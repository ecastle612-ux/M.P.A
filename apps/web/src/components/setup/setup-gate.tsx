"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

const SETUP_ALLOWED_PREFIXES = [
  "/setup",
  "/master-admin",
  "/portal",
  "/properties/new",
  "/units/new",
  "/tenants/new",
  "/leases/new",
  "/profile",
  "/api/"
];

export function SetupGate({ isSetupComplete }: { isSetupComplete: boolean }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (isSetupComplete) return;
    // Never yank Master Admin HQ into the PM setup wizard.
    if (pathname.startsWith("/master-admin")) return;
    const allowed = SETUP_ALLOWED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
    if (!allowed && pathname !== "/login") {
      router.replace("/setup");
    }
  }, [isSetupComplete, pathname, router]);

  return null;
}
