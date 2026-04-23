// Supabase browser client. Lives in the module so every service /
// repository gets the same instance (session in localStorage, one
// auth-state-change subscription per app).
//
// The `VITE_SUPABASE_*` values are exposed to the browser — that is
// intentional and safe: the anon key is public, and RLS on every
// table is what actually protects user data.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type Env = {
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
};

function readEnv(): Env {
  // Vite inlines these at build time. On the server (Cloudflare Worker)
  // the import.meta.env path also works thanks to @cloudflare/vite-plugin.
  return (import.meta as unknown as { env: Env }).env ?? {};
}

let _client: SupabaseClient | null = null;
let _unconfigured = false;

/**
 * Returns the shared Supabase client, or `null` when the environment is
 * not configured yet. The app is built to degrade gracefully when
 * Supabase is missing (login/signup surface an error; protected routes
 * fall back to unauth state) so this must never throw.
 */
export function getSupabase(): SupabaseClient | null {
  if (_client) return _client;
  if (_unconfigured) return null;
  const env = readEnv();
  const url = env.VITE_SUPABASE_URL?.trim();
  const anonKey = env.VITE_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) {
    _unconfigured = true;
    return null;
  }
  _client = createClient(url, anonKey, {
    auth: {
      // Persist across reloads; restore on init.
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return _client;
}

export function isSupabaseConfigured(): boolean {
  return getSupabase() !== null;
}
