const express = require("express");
const { z } = require("zod");
const rateLimit = require("express-rate-limit");

const { env } = require("../config/env");
const { verifyPassword } = require("../utils/password");
const { signAdminToken } = require("../utils/jwt");
const { requireAdminAuth } = require("../middleware/requireAdminAuth");
const { getSupabaseAdmin, isSupabaseConfigured } = require("../supabase/client");

const authRouter = express.Router();

const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

authRouter.post("/login", loginLimiter, async (req, res, next) => {
  try {
    const body = z
      .object({
        email: z.string().email(),
        password: z.string().min(1),
      })
      .parse(req.body);

    if (!isSupabaseConfigured()) {
      const emailOk = body.email.toLowerCase() === env.ADMIN_EMAIL.toLowerCase();
      const passOk = body.password === env.ADMIN_PASSWORD;
      if (!emailOk || !passOk) {
        return res.status(401).json({ error: { message: "Invalid credentials" } });
      }

      const token = signAdminToken({ _id: "local-admin", email: env.ADMIN_EMAIL });
      return res.json({ token, admin: { email: env.ADMIN_EMAIL } });
    }

    const supabase = getSupabaseAdmin();
    const adminRes = await supabase
      .from("admin_users")
      .select("id,email,password_hash")
      .eq("email", body.email.toLowerCase())
      .maybeSingle();

    if (adminRes.error || !adminRes.data) {
      return res.status(401).json({ error: { message: "Invalid credentials" } });
    }

    const ok = await verifyPassword(body.password, adminRes.data.password_hash);
    if (!ok) {
      return res.status(401).json({ error: { message: "Invalid credentials" } });
    }

    const token = signAdminToken({ _id: adminRes.data.id, email: adminRes.data.email });
    res.json({
      token,
      admin: { email: adminRes.data.email },
    });
  } catch (err) {
    next(err);
  }
});

authRouter.get("/me", requireAdminAuth, async (req, res) => {
  res.json({ admin: { email: req.admin.email } });
});

module.exports = { authRouter };
