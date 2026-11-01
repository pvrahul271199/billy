import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseKey } from "./sync";

let client: SupabaseClient | null = null;

/** The one shared Supabase client. Only call when `isSyncConfigured()`. */
export function supabase(): SupabaseClient {
  client ??= createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, supabaseKey()!, {
    auth: { persistSession: true, autoRefreshToken: true, storageKey: "billy-auth" },
  });
  return client;
}
