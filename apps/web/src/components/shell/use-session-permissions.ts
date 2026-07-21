"use client";

import { useCallback, useEffect, useState } from "react";
import { evaluateCapability, type PermissionCapability } from "@mpa/shared";

const CACHE_KEY = "mpa.session.permissions.v2";

function readCachedPermissions(): string[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : null;
  } catch {
    return null;
  }
}

function writeCachedPermissions(permissions: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(CACHE_KEY, JSON.stringify(permissions));
  } catch {
    // Non-fatal cache write failure.
  }
}

/**
 * SH-001: seed from sessionStorage so the first paint of nav is not an empty
 * permission set that later expands (nav reconstruction).
 */
export function useSessionPermissions() {
  const [permissions, setPermissions] = useState<string[]>(() => readCachedPermissions() ?? []);
  const [loaded, setLoaded] = useState(() => readCachedPermissions() != null);

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
        if (!cancelled) {
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
    // Until the first successful fetch (and with no cache), hide gated items
    // rather than flashing unauthorized destinations — cached seed avoids the jump.
    if (!loaded && permissions.length === 0) return false;
    return evaluateCapability(permissions, requiredCapability);
  }

  const canAccessStable = useCallback(canAccess, [loaded, permissions]);

  return { permissions, loaded, canAccess: canAccessStable };
}
