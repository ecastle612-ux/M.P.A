"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createAuthClient } from "../../lib/auth/client";

export function AuthSessionSync() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createAuthClient();
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event) => {
      // DPX-003: do not refresh on token refresh — remounting root layout re-seeds theme SSR.
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        router.refresh();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  return null;
}
