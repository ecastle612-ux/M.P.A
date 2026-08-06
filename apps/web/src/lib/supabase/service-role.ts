import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { serverEnv } from "../env/server-env";

export function createServiceRoleClient(): SupabaseClient {
  if (!serverEnv.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for webhook processing");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createClient<any>(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}
