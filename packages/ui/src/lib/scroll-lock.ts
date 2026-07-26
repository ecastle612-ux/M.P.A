"use client";

import { useEffect } from "react";

let lockCount = 0;
let previousOverflow = "";

function lockBodyScroll() {
  if (typeof document === "undefined") return;
  if (lockCount === 0) {
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  lockCount += 1;
}

function unlockBodyScroll() {
  if (typeof document === "undefined") return;
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    document.body.style.overflow = previousOverflow;
    previousOverflow = "";
  }
}

/**
 * PMX-004 Phase 5 — body scroll-lock while overlays (Drawer / Modal) are open.
 * Nested overlays share a ref-count so unlock only happens when the last closes.
 */
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    lockBodyScroll();
    return () => {
      unlockBodyScroll();
    };
  }, [active]);
}
