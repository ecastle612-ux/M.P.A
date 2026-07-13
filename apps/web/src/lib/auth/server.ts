import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@mpa/supabase";
import { serverEnv } from "../env/server-env";

export async function createAuthServerClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      }
    }
  });
}
