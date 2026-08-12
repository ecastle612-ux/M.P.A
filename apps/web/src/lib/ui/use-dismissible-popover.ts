"use client";

import { useEffect, useId, useRef, type RefObject } from "react";

/**
 * Escape + outside click + return focus for disclosure popovers (PPS1-020).
 * Reuses the same interaction grammar as marketing/app mobile menus.
 */
export function useDismissiblePopover(open: boolean, onClose: () => void): {
  rootRef: RefObject<HTMLDivElement | null>;
  triggerRef: RefObject<HTMLButtonElement | null>;
  panelId: string;
} {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const wasOpen = useRef(false);
  const panelId = useId();

  useEffect(() => {
    if (!open) {
      if (wasOpen.current) {
        triggerRef.current?.focus();
      }
      wasOpen.current = false;
      return;
    }
    wasOpen.current = true;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        onClose();
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  return { rootRef, triggerRef, panelId };
}
