import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { Database } from "./types";

type CookieStore = {
  getAll: () => { name: string; value: string }[];
  setAll: (cookies: { name: string; value: string; options: CookieOptions }[]) => void;
};

export function createServerSupabaseClient(cookieStore: CookieStore) {
  return createServerClient<Database>(
    process.env["NEXT_PUBLIC_SUPABASE_URL"] ?? "",
    process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"] ?? "",
    {
      cookies: cookieStore
    },
  );
}
