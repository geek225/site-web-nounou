const express = require("express");
const { z } = require("zod");
const rateLimit = require("express-rate-limit");

const { getSupabaseAdmin, isSupabaseConfigured } = require("../supabase/client");
const { getBootstrap, createInCollection } = require("../local/store");
const { defaultData } = require("../local/defaultData");
const { getTransporter, getRecipients, getFromEmail } = require("../utils/mailer");

const publicRouter = express.Router();

const serviceRequestLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

const offlineBootstrap = {
  settings: defaultData.settings,
  services: defaultData.services.map((x) => ({ ...x, _id: x.id, order: x.order_index })),
  otherServices: (defaultData.otherServices || []).map((x) => ({ ...x, _id: x.id, order: x.order_index })),
  destinations: defaultData.destinations.map((x) => ({ ...x, _id: x.id, order: x.order_index })),
  testimonials: defaultData.testimonials.map((x) => ({ ...x, _id: x.id, order: x.order_index })),
};

publicRouter.get("/bootstrap", async (req, res, next) => {
  try {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
    if (!isSupabaseConfigured()) {
      const local = await getBootstrap();
      return res.json({
        settings: local.settings,
        services: local.services.map((x) => ({ ...x, order: x.order_index })),
        otherServices: (local.otherServices || []).map((x) => ({ ...x, order: x.order_index })),
        destinations: local.destinations.map((x) => ({ ...x, order: x.order_index })),
        testimonials: local.testimonials.map((x) => ({ ...x, order: x.order_index })),
      });
    }

    const supabase = getSupabaseAdmin();

    const settingsRes = await supabase.from("site_settings").select("data").eq("id", 1).maybeSingle();
    if (settingsRes.error) return res.json(offlineBootstrap);
    const settings = settingsRes.data?.data || offlineBootstrap.settings;

    const servicesRes = await supabase
      .from("services")
      .select("*")
      .eq("enabled", true)
      .order("order_index", { ascending: true });
    if (servicesRes.error) return res.json(offlineBootstrap);

    const otherServicesRes = await supabase
      .from("other_services")
      .select("*")
      .eq("enabled", true)
      .order("order_index", { ascending: true });
    if (otherServicesRes.error) return res.json(offlineBootstrap);

    const destinationsRes = await supabase
      .from("destinations")
      .select("*")
      .eq("enabled", true)
      .order("order_index", { ascending: true });
    if (destinationsRes.error) return res.json(offlineBootstrap);

    const testimonialsRes = await supabase
      .from("testimonials")
      .select("*")
      .eq("enabled", true)
      .order("order_index", { ascending: true });
    if (testimonialsRes.error) return res.json(offlineBootstrap);

    res.json({
      settings,
      services: servicesRes.data || [],
      otherServices: otherServicesRes.data || [],
      destinations: destinationsRes.data || [],
      testimonials: testimonialsRes.data || [],
    });
  } catch (err) {
    next(err);
  }
});

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

publicRouter.post("/service-request", serviceRequestLimiter, async (req, res, next) => {
  try {
    const body = z
      .object({
        fullName: z.string().min(1),
        email: z.string().email(),
        phone: z.string().optional(),
        ville: z.string().optional(),
        commune: z.string().optional(),
        quartier: z.string().optional(),
        serviceType: z.string().optional(),
        optionName: z.string().optional(),
        optionPrice: z.string().optional(),
      })
      .parse(req.body);

    const meta = {
      source: "formulaire",
      userAgent: req.get("user-agent") || "",
      ip: req.ip,
      createdAt: new Date().toISOString(),
    };

    let stored = false;
    let storedId = null;

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseAdmin();
      const insertRes = await supabase
        .from("service_requests")
        .insert({
          full_name: body.fullName,
          email: body.email,
          phone: body.phone || null,
          ville: body.ville || null,
          commune: body.commune || null,
          quartier: body.quartier || null,
          service_type: body.serviceType || null,
          option_name: body.optionName || null,
          option_price: body.optionPrice || null,
          raw: { ...body, meta },
        })
        .select("id")
        .single();

      if (insertRes.error) throw insertRes.error;
      stored = true;
      storedId = insertRes.data.id;
    } else {
      const created = await createInCollection("serviceRequests", { ...body, meta });
      stored = true;
      storedId = created.id;
    }

    let emailed = false;
    const transporter = getTransporter();
    const to = getRecipients();
    if (transporter && to.length) {
      const subject = `Nouvelle demande — ${body.serviceType || "Service"}`;
      const html = `
        <div style="font-family:Arial,sans-serif;line-height:1.5">
          <h2 style="margin:0 0 12px">Nouvelle demande de service</h2>
          <p style="margin:0 0 10px"><strong>Nom:</strong> ${escapeHtml(body.fullName)}</p>
          <p style="margin:0 0 10px"><strong>Email:</strong> ${escapeHtml(body.email)}</p>
          <p style="margin:0 0 10px"><strong>Téléphone:</strong> ${escapeHtml(body.phone || "")}</p>
          <p style="margin:0 0 10px"><strong>Ville:</strong> ${escapeHtml(body.ville || "")}</p>
          <p style="margin:0 0 10px"><strong>Commune:</strong> ${escapeHtml(body.commune || "")}</p>
          <p style="margin:0 0 10px"><strong>Quartier:</strong> ${escapeHtml(body.quartier || "")}</p>
          <p style="margin:0 0 10px"><strong>Service:</strong> ${escapeHtml(body.serviceType || "")}</p>
          <p style="margin:0 0 10px"><strong>Option:</strong> ${escapeHtml(body.optionName || "")}</p>
          <p style="margin:0 0 10px"><strong>Prix:</strong> ${escapeHtml(body.optionPrice || "")}</p>
          <hr style="border:none;border-top:1px solid #eee;margin:16px 0" />
          <p style="margin:0;color:#666;font-size:12px">ID: ${escapeHtml(storedId || "")}</p>
        </div>
      `;

      await transporter.sendMail({
        from: getFromEmail(),
        to: to.join(", "),
        replyTo: body.email,
        subject,
        html,
      });

      emailed = true;
    }

    res.json({ ok: true, stored, emailed, id: storedId });
  } catch (err) {
    next(err);
  }
});

module.exports = { publicRouter };
