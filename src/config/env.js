const { z } = require("zod");

const envSchema = z.object({
  NODE_ENV: z.string().optional().default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  JWT_SECRET: z.string().min(16).default("change-me-in-env-please-32chars-min"),
  CORS_ORIGIN: z.string().optional(),
  ADMIN_EMAIL: z.string().email().default("admin@example.com"),
  ADMIN_PASSWORD: z.string().min(8).default("admin12345"),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20).optional(),
  SUPABASE_STORAGE_BUCKET: z.string().min(1).optional().default("media"),
  FORM_TO_EMAILS: z.string().optional(),
  FORM_FROM_EMAIL: z.string().email().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_SECURE: z
    .union([z.literal("true"), z.literal("false")])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  MONGODB_URI: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
});

function loadEnv() {
  require("dotenv").config();
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Invalid environment variables:\n${message}`);
  }
  return parsed.data;
}

const env = loadEnv();

module.exports = { env };
