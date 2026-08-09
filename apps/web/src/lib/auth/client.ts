"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@mpa/supabase";
import { clientEnv } from "../env/client-env";

/**
 * Must use the same cookie name as middleware / createAuthServerClient (`mpa_session`).
 * Otherwise sign-in writes the default sb-*-auth-token cookie and protected routes
 * (Guided Setup, Mission Control) never see the session.
 */
export function createAuthClient() {
  return createBrowserClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookieOptions: {
        name: "mpa_session",
        path: "/",
        sameSite: "lax",
        secure: typeof window !== "undefined" ? window.location.protocol === "https:" : true
      }
    }
  );
}
