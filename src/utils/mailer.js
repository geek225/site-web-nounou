const nodemailer = require("nodemailer");

const { env } = require("../config/env");

function isMailConfigured() {
  return Boolean(env.SMTP_HOST && env.SMTP_PORT && env.SMTP_USER && env.SMTP_PASS && env.FORM_TO_EMAILS);
}

let transporter = null;

function getTransporter() {
  if (!isMailConfigured()) return null;
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE ?? env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });

  return transporter;
}

function getRecipients() {
  const raw = env.FORM_TO_EMAILS || "";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function getFromEmail() {
  return env.FORM_FROM_EMAIL || env.SMTP_USER || "no-reply@example.com";
}

module.exports = { isMailConfigured, getTransporter, getRecipients, getFromEmail };

