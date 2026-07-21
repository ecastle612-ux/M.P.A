"use client";

import { useEffect, useRef } from "react";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * SH-002 / SH-003: Trap focus while `active` is true.
 *
 * - Do not depend on `onEscape` identity (inline callbacks remount the effect).
 * - Never call `.focus()` on effect re-runs while the user already focuses inside.
 * - On deactivate, restore prior focus only if focus is still inside the trap
 *   (avoids yanking focus during unrelated cleanups).
 */
export function useFocusTrap<TElement extends HTMLElement>(
  active: boolean,
  onEscape: () => void
) {
  const containerRef = useRef<TElement | null>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);
  const onEscapeRef = useRef(onEscape);
  const wasActiveRef = useRef(false);
  onEscapeRef.current = onEscape;

  useEffect(() => {
    const container = containerRef.current;
    if (!active) {
      if (wasActiveRef.current && container) {
        const activeEl = document.activeElement;
        if (activeEl instanceof HTMLElement && container.contains(activeEl)) {
          previouslyFocusedElement.current?.focus({ preventScroll: true });
        }
      }
      wasActiveRef.current = false;
      return;
    }

    if (!container) return;

    const activating = !wasActiveRef.current;
    wasActiveRef.current = true;

    if (activating) {
      previouslyFocusedElement.current = document.activeElement as HTMLElement | null;
      const activeEl = document.activeElement;
      const alreadyInside =
        activeEl instanceof HTMLElement &&
        container.contains(activeEl) &&
        activeEl.matches(FOCUSABLE_SELECTOR);
      if (!alreadyInside) {
        const initialFocusable = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
        initialFocusable[0]?.focus({ preventScroll: true });
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onEscapeRef.current();
        return;
      }

      if (event.key !== "Tab") return;

      const trap = containerRef.current;
      if (!trap) return;
      const focusableElements = Array.from(trap.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (!focusableElements.length) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement as HTMLElement | null;

      if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault();
        lastElement?.focus({ preventScroll: true });
      } else if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement?.focus({ preventScroll: true });
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [active]);

  return containerRef;
}
