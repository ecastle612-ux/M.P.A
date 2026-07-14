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
    } = supabase.auth.onAuthStateChange(() => {
      router.refresh();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  return null;
}
