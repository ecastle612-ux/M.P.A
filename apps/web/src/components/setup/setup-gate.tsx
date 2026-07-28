"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isPathAllowedDuringSetup } from "../../lib/setup/completion";

export function SetupGate({ isSetupComplete }: { isSetupComplete: boolean }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (isSetupComplete) return;
    // Never yank Master Admin HQ into the PM setup wizard.
    if (pathname.startsWith("/master-admin")) return;
    // Portal surfaces have their own shells — never funnel them into Ops /setup.
    if (pathname.startsWith("/portal")) return;
    if (!isPathAllowedDuringSetup(pathname) && pathname !== "/login") {
      router.replace("/setup");
    }
  }, [isSetupComplete, pathname, router]);

  return null;
}
