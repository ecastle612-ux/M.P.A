"use client";

import { useEffect, useRef } from "react";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * SH-002: Trap focus while `active` is true.
 *
 * Critical: do **not** depend on `onEscape` identity. Callers often pass inline
 * functions; re-running this effect steals focus via `firstElement.focus()` and
 * dismisses the mobile keyboard mid-typing (Severity 1 defect).
 */
export function useFocusTrap<TElement extends HTMLElement>(
  active: boolean,
  onEscape: () => void
) {
  const containerRef = useRef<TElement | null>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);
  const onEscapeRef = useRef(onEscape);
  onEscapeRef.current = onEscape;

  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;

    previouslyFocusedElement.current = document.activeElement as HTMLElement | null;

    const initialFocusable = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
    // Prefer an already-focused control inside the trap (e.g. user tapped search).
    const activeEl = document.activeElement;
    const alreadyInside =
      activeEl instanceof HTMLElement && container.contains(activeEl) && activeEl.matches(FOCUSABLE_SELECTOR);
    if (!alreadyInside) {
      initialFocusable[0]?.focus();
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
        lastElement?.focus();
      } else if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement?.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      // Only restore outside focus when the trap deactivates — never on dependency churn.
      previouslyFocusedElement.current?.focus();
    };
  }, [active]);

  return containerRef;
}
