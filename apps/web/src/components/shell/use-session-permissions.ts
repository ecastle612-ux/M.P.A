"use client";

import { useEffect, useState } from "react";
import { evaluateCapability, type PermissionCapability } from "@mpa/shared";

export function useSessionPermissions() {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch("/api/auth/session", { cache: "no-store" });
        if (!response.ok) return;
        const payload = (await response.json()) as { identity?: { permissions?: string[] } };
        if (!cancelled) {
          setPermissions(payload.identity?.permissions ?? []);
          setLoaded(true);
        }
      } catch {
        if (!cancelled) {
          setPermissions([]);
          setLoaded(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function canAccess(requiredCapability?: PermissionCapability) {
    if (!requiredCapability) return true;
    return evaluateCapability(permissions, requiredCapability);
  }

  return { permissions, loaded, canAccess };
}
