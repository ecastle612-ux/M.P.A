/**
 * PMX-004 Phase 5 — optional haptic feedback (confirm / destructive only).
 * Never required for workflow completion. No-ops when unsupported or reduced-motion.
 */

export type HapticKind = "confirm" | "destructive";

const PATTERN: Record<HapticKind, number[]> = {
  confirm: [10],
  destructive: [12, 40, 12]
};

function prefersReducedMotion(): boolean {
  const matchMedia =
    typeof globalThis.matchMedia === "function"
      ? globalThis.matchMedia.bind(globalThis)
      : typeof window !== "undefined" && typeof window.matchMedia === "function"
        ? window.matchMedia.bind(window)
        : null;
  if (!matchMedia) return true;
  return matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function triggerHaptic(kind: HapticKind = "confirm"): void {
  if (typeof navigator === "undefined") return;
  if (prefersReducedMotion()) return;
  const vibrate = navigator.vibrate;
  if (typeof vibrate !== "function") return;
  try {
    vibrate.call(navigator, PATTERN[kind]);
  } catch {
    // Unsupported / blocked — ignore.
  }
}
