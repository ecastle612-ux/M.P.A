"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { evaluateCapability, type PermissionCapability } from "@mpa/shared";

const CACHE_KEY = "mpa.session.permissions.v2";

function writeCachedPermissions(permissions: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(CACHE_KEY, JSON.stringify(permissions));
  } catch {
    // Non-fatal cache write failure.
  }
}

type SessionPermissionsValue = {
  permissions: string[];
  loaded: boolean;
  /** Server-resolved: Master Admin with no PM portfolio roles — HQ chrome only. */
  masterAdminOnlyShell: boolean;
  canAccess: (requiredCapability?: PermissionCapability) => boolean;
};

const SessionPermissionsContext = createContext<SessionPermissionsValue | null>(null);

/**
 * DPX-002: server-seeded permissions so sidebar/mobile nav SSR matches hydration.
 */
export function SessionPermissionsProvider({
  children,
  initialPermissions = [],
  masterAdminOnlyShell = false
}: {
  children: ReactNode;
  initialPermissions?: string[];
  masterAdminOnlyShell?: boolean;
}) {
  const [permissions, setPermissions] = useState<string[]>(initialPermissions);
  const [loaded, setLoaded] = useState(initialPermissions.length > 0 || masterAdminOnlyShell);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch("/api/auth/session", { cache: "no-store" });
        if (!response.ok) {
          if (!cancelled) setLoaded(true);
          return;
        }
        const payload = (await response.json()) as { identity?: { permissions?: string[] } };
        if (!cancelled) {
          const next = payload.identity?.permissions ?? [];
          writeCachedPermissions(next);
          setPermissions((current) => {
            if (current.length === next.length && current.every((value, index) => value === next[index])) {
              return current;
            }
            return next;
          });
          setLoaded(true);
        }
      } catch {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const canAccess = useCallback(
    (requiredCapability?: PermissionCapability) => {
      if (!requiredCapability) return true;
      if (masterAdminOnlyShell && requiredCapability === "master_admin") return true;
      if (!loaded && permissions.length === 0) return false;
      return evaluateCapability(permissions, requiredCapability);
    },
    [loaded, masterAdminOnlyShell, permissions]
  );

  return (
    <SessionPermissionsContext.Provider
      value={{ permissions, loaded, masterAdminOnlyShell, canAccess }}
    >
      {children}
    </SessionPermissionsContext.Provider>
  );
}

export function useSessionPermissions(): SessionPermissionsValue {
  const context = useContext(SessionPermissionsContext);
  if (!context) {
    throw new Error("useSessionPermissions must be used within SessionPermissionsProvider");
  }
  return context;
}
