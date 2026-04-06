const express = require("express");
const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const path = require("node:path");
const multer = require("multer");
const { z } = require("zod");

const { requireAdminAuth } = require("../middleware/requireAdminAuth");
const { env } = require("../config/env");
const { getSupabaseAdmin, isSupabaseConfigured } = require("../supabase/client");
const {
  getSettings,
  updateSettings,
  listCollection,
  createInCollection,
  updateInCollection,
  deleteFromCollection,
} = require("../local/store");
const { defaultData } = require("../local/defaultData");

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });

const adminRouter = express.Router();

adminRouter.use(requireAdminAuth);

function deepMerge(base, patch) {
  if (!patch || typeof patch !== "object") return base;
  if (!base || typeof base !== "object") return structuredClone(patch);
  if (Array.isArray(base) || Array.isArray(patch)) return structuredClone(patch);

  const out = { ...base };
  Object.entries(patch).forEach(([k, v]) => {
    if (v === undefined) return;
    if (v && typeof v === "object" && !Array.isArray(v) && out[k] && typeof out[k] === "object" && !Array.isArray(out[k])) {
      out[k] = deepMerge(out[k], v);
      return;
    }
    out[k] = structuredClone(v);
  });
  return out;
}

adminRouter.get("/settings", async (req, res, next) => {
  try {
    if (!isSupabaseConfigured()) {
      const settings = await getSettings();
      return res.json({ settings: settings || defaultData.settings });
    }

    const supabase = getSupabaseAdmin();
    const result = await supabase.from("site_settings").select("data").eq("id", 1).maybeSingle();
    if (result.error) throw result.error;
    res.json({ settings: result.data?.data || null });
  } catch (err) {
    next(err);
  }
});

adminRouter.put("/settings", async (req, res, next) => {
  try {
    const body = z
      .object({
        design: z
          .object({
            accentColor: z.string().optional(),
            backgroundColor: z.string().optional(),
            surfaceColor: z.string().optional(),
            textColor: z.string().optional(),
            fontFamily: z.string().optional(),
          })
          .optional(),
        hero: z
          .object({
            kickerText: z.string().optional(),
            title: z.string().optional(),
            subtitle: z.string().optional(),
            primaryCtaText: z.string().optional(),
            primaryCtaHref: z.string().optional(),
            secondaryCtaText: z.string().optional(),
            videoUrl: z.string().optional(),
            sliderImages: z.array(z.object({ url: z.string(), publicId: z.string().optional() })).optional(),
            roundSliderImages: z.array(z.object({ url: z.string(), publicId: z.string().optional() })).optional(),
            stats: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
          })
          .optional(),
        about: z
          .object({
            title: z.string().optional(),
            text: z.string().optional(),
            image: z.object({ url: z.string().optional(), publicId: z.string().optional() }).optional(),
          })
          .optional(),
        cta: z
          .object({
            title: z.string().optional(),
            text: z.string().optional(),
            buttonText: z.string().optional(),
          })
          .optional(),
        contact: z
          .object({
            email: z.string().optional(),
            phone: z.string().optional(),
            address: z.string().optional(),
          })
          .optional(),
        brand: z
          .object({
            name: z.string().optional(),
            logo: z.object({ url: z.string().optional(), publicId: z.string().optional() }).optional(),
          })
          .optional(),
        headerCta: z
          .object({
            text: z.string().optional(),
            href: z.string().optional(),
          })
          .optional(),
        navigation: z
          .object({
            items: z.array(z.object({ label: z.string(), target: z.string() })).optional(),
          })
          .optional(),
        servicesSection: z
          .object({
            title: z.string().optional(),
            subtitle: z.string().optional(),
          })
          .optional(),
        gallery: z
          .object({
            title: z.string().optional(),
            subtitle: z.string().optional(),
          })
          .optional(),
        newsletter: z
          .object({
            title: z.string().optional(),
            text: z.string().optional(),
            placeholder: z.string().optional(),
            buttonText: z.string().optional(),
          })
          .optional(),
        social: z
          .object({
            links: z.array(z.object({ icon: z.string().optional(), label: z.string(), url: z.string() })).optional(),
          })
          .optional(),
        layout: z
          .object({
            sectionOrder: z.array(z.string()).optional(),
            sectionEnabled: z.record(z.boolean()).optional(),
          })
          .optional(),
      })
      .parse(req.body);

    const patch = {};
    if (body.design) patch.design = body.design;
    if (body.hero) patch.hero = body.hero;
    if (body.about) patch.about = body.about;
    if (body.cta) patch.cta = body.cta;
    if (body.contact) patch.contact = body.contact;
    if (body.brand) patch.brand = body.brand;
    if (body.headerCta) patch.headerCta = body.headerCta;
    if (body.navigation) patch.navigation = body.navigation;
    if (body.servicesSection) patch.servicesSection = body.servicesSection;
    if (body.gallery) patch.gallery = body.gallery;
    if (body.newsletter) patch.newsletter = body.newsletter;
    if (body.social) patch.social = body.social;
    if (body.layout) patch.layout = body.layout;

    if (!isSupabaseConfigured()) {
      const settings = await updateSettings(patch);
      return res.json({ settings });
    }

    const supabase = getSupabaseAdmin();
    const currentRes = await supabase.from("site_settings").select("data").eq("id", 1).maybeSingle();
    if (currentRes.error) throw currentRes.error;
    const current = currentRes.data?.data || {};

    const nextSettings = deepMerge(current, patch);

    const upsertRes = await supabase
      .from("site_settings")
      .upsert({ id: 1, data: nextSettings }, { onConflict: "id" })
      .select("data")
      .single();

    if (upsertRes.error) throw upsertRes.error;
    res.json({ settings: upsertRes.data.data });
  } catch (err) {
    next(err);
  }
});

adminRouter.post("/upload", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: { message: "No file provided" } });

    const folder = typeof req.body?.folder === "string" ? req.body.folder : "nounou";
    const safeFolder = folder.replace(/^\/*/, "").replace(/\.\./g, "");
    const ext = path.extname(req.file.originalname || "").replace(".", "") || "png";
    const id = crypto.randomUUID();
    const objectPath = `${safeFolder}/${Date.now()}-${id}.${ext}`;

    if (!isSupabaseConfigured()) {
      const destDir = path.join(process.cwd(), "public", "uploads", safeFolder);
      await fs.mkdir(destDir, { recursive: true });
      const destPath = path.join(destDir, `${Date.now()}-${id}.${ext}`);
      await fs.writeFile(destPath, req.file.buffer);
      const url = `/uploads/${safeFolder}/${path.basename(destPath)}`.replaceAll("\\", "/");
      return res.json({ url, publicId: url });
    }

    const bucket = env.SUPABASE_STORAGE_BUCKET;

    const supabase = getSupabaseAdmin();
    const uploadRes = await supabase.storage.from(bucket).upload(objectPath, req.file.buffer, {
      contentType: req.file.mimetype,
      upsert: true,
    });

    if (uploadRes.error) throw uploadRes.error;

    const publicUrlRes = supabase.storage.from(bucket).getPublicUrl(objectPath);
    const url = publicUrlRes.data?.publicUrl;

    res.json({
      url,
      publicId: objectPath,
    });
  } catch (err) {
    next(err);
  }
});

function parseId(req) {
  const id = req.params.id;
  if (!id) {
    const err = new Error("Missing id");
    err.status = 400;
    throw err;
  }
  return id;
}

adminRouter.get("/services", async (req, res, next) => {
  try {
    if (!isSupabaseConfigured()) {
      const items = await listCollection("services");
      return res.json({ items: items.map((x) => ({ ...x, _id: x.id })) });
    }

    const supabase = getSupabaseAdmin();
    const result = await supabase.from("services").select("*").order("order_index", { ascending: true });
    if (result.error) throw result.error;
    res.json({ items: (result.data || []).map((x) => ({ ...x, _id: x.id })) });
  } catch (err) {
    next(err);
  }
});

adminRouter.post("/services", async (req, res, next) => {
  try {
    const body = z
      .object({
        title: z.string().min(1),
        description: z.string().min(1),
        media: z.object({ url: z.string().optional(), publicId: z.string().optional() }).optional(),
        order: z.number().optional(),
        enabled: z.boolean().optional(),
      })
      .parse(req.body);

    if (!isSupabaseConfigured()) {
      const created = await createInCollection("services", {
        title: body.title,
        description: body.description,
        media: body.media || null,
        enabled: body.enabled ?? true,
        order_index: body.order ?? 0,
      });
      return res.status(201).json({ item: { ...created, _id: created.id } });
    }

    const supabase = getSupabaseAdmin();
    const insertRes = await supabase
      .from("services")
      .insert({
        title: body.title,
        description: body.description,
        media: body.media || null,
        enabled: body.enabled ?? true,
        order_index: body.order ?? 0,
      })
      .select("*")
      .single();

    if (insertRes.error) throw insertRes.error;
    res.status(201).json({ item: { ...insertRes.data, _id: insertRes.data.id } });
  } catch (err) {
    next(err);
  }
});

adminRouter.put("/services/:id", async (req, res, next) => {
  try {
    const id = parseId(req);
    const body = z
      .object({
        title: z.string().min(1).optional(),
        description: z.string().min(1).optional(),
        media: z.object({ url: z.string().optional(), publicId: z.string().optional() }).optional(),
        order: z.number().optional(),
        enabled: z.boolean().optional(),
      })
      .parse(req.body);

    if (!isSupabaseConfigured()) {
      const updated = await updateInCollection("services", id, {
        ...(body.title !== undefined ? { title: body.title } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
        ...(body.media !== undefined ? { media: body.media } : {}),
        ...(body.enabled !== undefined ? { enabled: body.enabled } : {}),
        ...(body.order !== undefined ? { order_index: body.order } : {}),
      });
      return res.json({ item: updated ? { ...updated, _id: updated.id } : null });
    }

    const supabase = getSupabaseAdmin();
    const updateRes = await supabase
      .from("services")
      .update({
        ...(body.title !== undefined ? { title: body.title } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
        ...(body.media !== undefined ? { media: body.media } : {}),
        ...(body.enabled !== undefined ? { enabled: body.enabled } : {}),
        ...(body.order !== undefined ? { order_index: body.order } : {}),
      })
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (updateRes.error) throw updateRes.error;
    res.json({ item: updateRes.data ? { ...updateRes.data, _id: updateRes.data.id } : null });
  } catch (err) {
    next(err);
  }
});

adminRouter.delete("/services/:id", async (req, res, next) => {
  try {
    const id = parseId(req);
    if (!isSupabaseConfigured()) {
      await deleteFromCollection("services", id);
      return res.status(204).end();
    }

    const supabase = getSupabaseAdmin();
    const delRes = await supabase.from("services").delete().eq("id", id);
    if (delRes.error) throw delRes.error;
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

adminRouter.get("/other-services", async (req, res, next) => {
  try {
    if (!isSupabaseConfigured()) {
      const items = await listCollection("otherServices");
      return res.json({ items: items.map((x) => ({ ...x, _id: x.id })) });
    }

    const supabase = getSupabaseAdmin();
    const result = await supabase.from("other_services").select("*").order("order_index", { ascending: true });
    if (result.error) throw result.error;
    res.json({ items: (result.data || []).map((x) => ({ ...x, _id: x.id })) });
  } catch (err) {
    next(err);
  }
});

adminRouter.post("/other-services", async (req, res, next) => {
  try {
    const body = z
      .object({
        title: z.string().min(1),
        description: z.string().min(1),
        media: z.object({ url: z.string().optional(), publicId: z.string().optional() }).optional(),
        order: z.number().optional(),
        enabled: z.boolean().optional(),
      })
      .parse(req.body);

    if (!isSupabaseConfigured()) {
      const created = await createInCollection("otherServices", {
        title: body.title,
        description: body.description,
        media: body.media || null,
        enabled: body.enabled ?? true,
        order_index: body.order ?? 0,
      });
      return res.status(201).json({ item: { ...created, _id: created.id } });
    }

    const supabase = getSupabaseAdmin();
    const insertRes = await supabase
      .from("other_services")
      .insert({
        title: body.title,
        description: body.description,
        media: body.media || null,
        enabled: body.enabled ?? true,
        order_index: body.order ?? 0,
      })
      .select("*")
      .single();

    if (insertRes.error) throw insertRes.error;
    res.status(201).json({ item: { ...insertRes.data, _id: insertRes.data.id } });
  } catch (err) {
    next(err);
  }
});

adminRouter.put("/other-services/:id", async (req, res, next) => {
  try {
    const id = parseId(req);
    const body = z
      .object({
        title: z.string().min(1).optional(),
        description: z.string().min(1).optional(),
        media: z.object({ url: z.string().optional(), publicId: z.string().optional() }).optional(),
        order: z.number().optional(),
        enabled: z.boolean().optional(),
      })
      .parse(req.body);

    if (!isSupabaseConfigured()) {
      const updated = await updateInCollection("otherServices", id, {
        ...(body.title !== undefined ? { title: body.title } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
        ...(body.media !== undefined ? { media: body.media } : {}),
        ...(body.enabled !== undefined ? { enabled: body.enabled } : {}),
        ...(body.order !== undefined ? { order_index: body.order } : {}),
      });
      return res.json({ item: updated ? { ...updated, _id: updated.id } : null });
    }

    const supabase = getSupabaseAdmin();
    const updateRes = await supabase
      .from("other_services")
      .update({
        ...(body.title !== undefined ? { title: body.title } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
        ...(body.media !== undefined ? { media: body.media } : {}),
        ...(body.enabled !== undefined ? { enabled: body.enabled } : {}),
        ...(body.order !== undefined ? { order_index: body.order } : {}),
      })
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (updateRes.error) throw updateRes.error;
    res.json({ item: updateRes.data ? { ...updateRes.data, _id: updateRes.data.id } : null });
  } catch (err) {
    next(err);
  }
});

adminRouter.delete("/other-services/:id", async (req, res, next) => {
  try {
    const id = parseId(req);
    if (!isSupabaseConfigured()) {
      await deleteFromCollection("otherServices", id);
      return res.status(204).end();
    }

    const supabase = getSupabaseAdmin();
    const delRes = await supabase.from("other_services").delete().eq("id", id);
    if (delRes.error) throw delRes.error;
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

adminRouter.get("/destinations", async (req, res, next) => {
  try {
    if (!isSupabaseConfigured()) {
      const items = await listCollection("destinations");
      return res.json({ items: items.map((x) => ({ ...x, _id: x.id })) });
    }

    const supabase = getSupabaseAdmin();
    const result = await supabase.from("destinations").select("*").order("order_index", { ascending: true });
    if (result.error) throw result.error;
    res.json({ items: (result.data || []).map((x) => ({ ...x, _id: x.id })) });
  } catch (err) {
    next(err);
  }
});

adminRouter.post("/destinations", async (req, res, next) => {
  try {
    const body = z
      .object({
        title: z.string().min(1),
        location: z.string().optional(),
        tags: z.array(z.string()).optional(),
        media: z.object({ url: z.string().optional(), publicId: z.string().optional() }).optional(),
        order: z.number().optional(),
        enabled: z.boolean().optional(),
      })
      .parse(req.body);

    if (!isSupabaseConfigured()) {
      const created = await createInCollection("destinations", {
        title: body.title,
        location: body.location || null,
        tags: body.tags || [],
        media: body.media || null,
        enabled: body.enabled ?? true,
        order_index: body.order ?? 0,
      });
      return res.status(201).json({ item: { ...created, _id: created.id } });
    }

    const supabase = getSupabaseAdmin();
    const insertRes = await supabase
      .from("destinations")
      .insert({
        title: body.title,
        location: body.location || null,
        tags: body.tags || [],
        media: body.media || null,
        enabled: body.enabled ?? true,
        order_index: body.order ?? 0,
      })
      .select("*")
      .single();

    if (insertRes.error) throw insertRes.error;
    res.status(201).json({ item: { ...insertRes.data, _id: insertRes.data.id } });
  } catch (err) {
    next(err);
  }
});

adminRouter.put("/destinations/:id", async (req, res, next) => {
  try {
    const id = parseId(req);
    const body = z
      .object({
        title: z.string().min(1).optional(),
        location: z.string().optional(),
        tags: z.array(z.string()).optional(),
        media: z.object({ url: z.string().optional(), publicId: z.string().optional() }).optional(),
        order: z.number().optional(),
        enabled: z.boolean().optional(),
      })
      .parse(req.body);

    if (!isSupabaseConfigured()) {
      const updated = await updateInCollection("destinations", id, {
        ...(body.title !== undefined ? { title: body.title } : {}),
        ...(body.location !== undefined ? { location: body.location } : {}),
        ...(body.tags !== undefined ? { tags: body.tags } : {}),
        ...(body.media !== undefined ? { media: body.media } : {}),
        ...(body.enabled !== undefined ? { enabled: body.enabled } : {}),
        ...(body.order !== undefined ? { order_index: body.order } : {}),
      });
      return res.json({ item: updated ? { ...updated, _id: updated.id } : null });
    }

    const supabase = getSupabaseAdmin();
    const updateRes = await supabase
      .from("destinations")
      .update({
        ...(body.title !== undefined ? { title: body.title } : {}),
        ...(body.location !== undefined ? { location: body.location } : {}),
        ...(body.tags !== undefined ? { tags: body.tags } : {}),
        ...(body.media !== undefined ? { media: body.media } : {}),
        ...(body.enabled !== undefined ? { enabled: body.enabled } : {}),
        ...(body.order !== undefined ? { order_index: body.order } : {}),
      })
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (updateRes.error) throw updateRes.error;
    res.json({ item: updateRes.data ? { ...updateRes.data, _id: updateRes.data.id } : null });
  } catch (err) {
    next(err);
  }
});

adminRouter.delete("/destinations/:id", async (req, res, next) => {
  try {
    const id = parseId(req);
    if (!isSupabaseConfigured()) {
      await deleteFromCollection("destinations", id);
      return res.status(204).end();
    }

    const supabase = getSupabaseAdmin();
    const delRes = await supabase.from("destinations").delete().eq("id", id);
    if (delRes.error) throw delRes.error;
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

adminRouter.get("/testimonials", async (req, res, next) => {
  try {
    if (!isSupabaseConfigured()) {
      const items = await listCollection("testimonials");
      return res.json({ items: items.map((x) => ({ ...x, _id: x.id })) });
    }

    const supabase = getSupabaseAdmin();
    const result = await supabase.from("testimonials").select("*").order("order_index", { ascending: true });
    if (result.error) throw result.error;
    res.json({ items: (result.data || []).map((x) => ({ ...x, _id: x.id })) });
  } catch (err) {
    next(err);
  }
});

adminRouter.post("/testimonials", async (req, res, next) => {
  try {
    const body = z
      .object({
        name: z.string().min(1),
        role: z.string().optional(),
        quote: z.string().min(1),
        avatar: z.object({ url: z.string().optional(), publicId: z.string().optional() }).optional(),
        order: z.number().optional(),
        enabled: z.boolean().optional(),
      })
      .parse(req.body);

    if (!isSupabaseConfigured()) {
      const created = await createInCollection("testimonials", {
        name: body.name,
        role: body.role || null,
        quote: body.quote,
        avatar: body.avatar || null,
        enabled: body.enabled ?? true,
        order_index: body.order ?? 0,
      });
      return res.status(201).json({ item: { ...created, _id: created.id } });
    }

    const supabase = getSupabaseAdmin();
    const insertRes = await supabase
      .from("testimonials")
      .insert({
        name: body.name,
        role: body.role || null,
        quote: body.quote,
        avatar: body.avatar || null,
        enabled: body.enabled ?? true,
        order_index: body.order ?? 0,
      })
      .select("*")
      .single();

    if (insertRes.error) throw insertRes.error;
    res.status(201).json({ item: { ...insertRes.data, _id: insertRes.data.id } });
  } catch (err) {
    next(err);
  }
});

adminRouter.put("/testimonials/:id", async (req, res, next) => {
  try {
    const id = parseId(req);
    const body = z
      .object({
        name: z.string().min(1).optional(),
        role: z.string().optional(),
        quote: z.string().min(1).optional(),
        avatar: z.object({ url: z.string().optional(), publicId: z.string().optional() }).optional(),
        order: z.number().optional(),
        enabled: z.boolean().optional(),
      })
      .parse(req.body);

    if (!isSupabaseConfigured()) {
      const updated = await updateInCollection("testimonials", id, {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.role !== undefined ? { role: body.role } : {}),
        ...(body.quote !== undefined ? { quote: body.quote } : {}),
        ...(body.avatar !== undefined ? { avatar: body.avatar } : {}),
        ...(body.enabled !== undefined ? { enabled: body.enabled } : {}),
        ...(body.order !== undefined ? { order_index: body.order } : {}),
      });
      return res.json({ item: updated ? { ...updated, _id: updated.id } : null });
    }

    const supabase = getSupabaseAdmin();
    const updateRes = await supabase
      .from("testimonials")
      .update({
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.role !== undefined ? { role: body.role } : {}),
        ...(body.quote !== undefined ? { quote: body.quote } : {}),
        ...(body.avatar !== undefined ? { avatar: body.avatar } : {}),
        ...(body.enabled !== undefined ? { enabled: body.enabled } : {}),
        ...(body.order !== undefined ? { order_index: body.order } : {}),
      })
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (updateRes.error) throw updateRes.error;
    res.json({ item: updateRes.data ? { ...updateRes.data, _id: updateRes.data.id } : null });
  } catch (err) {
    next(err);
  }
});

adminRouter.delete("/testimonials/:id", async (req, res, next) => {
  try {
    const id = parseId(req);
    if (!isSupabaseConfigured()) {
      await deleteFromCollection("testimonials", id);
      return res.status(204).end();
    }

    const supabase = getSupabaseAdmin();
    const delRes = await supabase.from("testimonials").delete().eq("id", id);
    if (delRes.error) throw delRes.error;
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = { adminRouter };

