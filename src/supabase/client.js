const { createClient } = require("@supabase/supabase-js");

const { env } = require("../config/env");

function isSupabaseConfigured() {
  return Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);
}

let supabaseAdmin = null;

function getSupabaseAdmin() {
  if (!isSupabaseConfigured()) {
    const err = new Error("Supabase not configured");
    err.status = 503;
    throw err;
  }

  if (supabaseAdmin) return supabaseAdmin;

  supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  return supabaseAdmin;
}

module.exports = { getSupabaseAdmin, isSupabaseConfigured };

