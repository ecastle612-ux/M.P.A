"use client";

import { useCallback, useSyncExternalStore } from "react";

export const SIDEBAR_COLLAPSE_STORAGE_KEY = "mpa_sidebar_collapsed";

const listeners = new Set<() => void>();

function emitSidebarCollapseChange() {
  for (const listener of listeners) {
    listener();
  }
}

function subscribeSidebarCollapse(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function readSidebarCollapsed(): boolean {
  try {
    return window.localStorage.getItem(SIDEBAR_COLLAPSE_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function useSidebarCollapse(): {
  collapsed: boolean;
  toggleCollapsed: () => void;
} {
  const collapsed = useSyncExternalStore(subscribeSidebarCollapse, readSidebarCollapsed, () => false);

  const toggleCollapsed = useCallback(() => {
    const next = !readSidebarCollapsed();
    try {
      window.localStorage.setItem(SIDEBAR_COLLAPSE_STORAGE_KEY, next ? "1" : "0");
    } catch {
      // Non-fatal preference persistence failure.
    }
    emitSidebarCollapseChange();
  }, []);

  return { collapsed, toggleCollapsed };
}
