// Supabase Client Initialization for AirCare Frontend
// Reads public client credentials from Vite environment variables.
// Follows principle of least privilege: ONLY publishable/anon keys are permitted here.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
// Support standard modern publishable key and legacy anon key fallback
const supabaseKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY) as string | undefined;

let clientInstance: SupabaseClient | null = null;
const isConfigured = Boolean(
  supabaseUrl &&
  supabaseKey &&
  supabaseUrl.startsWith('https://') &&
  supabaseKey.length > 10 &&
  !supabaseUrl.includes('YOUR_SUPABASE') &&
  !supabaseKey.includes('YOUR_SUPABASE')
);

if (isConfigured) {
  try {
    clientInstance = createClient(supabaseUrl!, supabaseKey!, {
      auth: {
        persistSession: false, // AirCare public views require no local session persistence
        autoRefreshToken: false,
      },
    });
  } catch (err) {
    console.warn('[AirCare] Failed to initialize Supabase client instance:', err);
    clientInstance = null;
  }
}

/**
 * Returns whether Supabase credentials have been properly supplied via environment variables.
 */
export function isSupabaseConfigured(): boolean {
  return isConfigured && clientInstance !== null;
}

/**
 * Returns the active Supabase client singleton, or null if not configured.
 */
export function getSupabaseClient(): SupabaseClient | null {
  return clientInstance;
}

/**
 * Returns sanitized connection metadata for diagnostics (zero secrets).
 */
export function getSupabaseDiagnosticsMetadata() {
  return {
    isConfigured: isSupabaseConfigured(),
    urlConfigured: Boolean(supabaseUrl),
    urlHost: supabaseUrl ? new URL(supabaseUrl).host : null,
    keyConfigured: Boolean(supabaseKey),
    keyType: supabaseKey ? (supabaseKey.startsWith('sb_publishable_') ? 'Publishable' : 'Anon JWT') : null,
  };
}
