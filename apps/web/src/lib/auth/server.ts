import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@mpa/supabase";
import { serverEnv } from "../env/server-env";

function createSupabaseServerClient(cookieStore: Awaited<ReturnType<typeof cookies>>, allowCookieWrites: boolean) {
  return createServerClient<Database>(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      async setAll(cookiesToSet) {
        if (!allowCookieWrites) {
          return;
        }
        for (const { name, value, options } of cookiesToSet) {
          await cookieStore.set(name, value, options);
        }
      }
    }
  });
}

export async function createAuthServerClient() {
  const cookieStore = await cookies();
  return createSupabaseServerClient(cookieStore, true);
}

export async function createAuthServerComponentClient() {
  const cookieStore = await cookies();
  return createSupabaseServerClient(cookieStore, false);
}

export function createServiceRoleServerClient() {
  if (!serverEnv.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }
  return createClient<Database>(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
