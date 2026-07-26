/**
 * PMX-004 Phase 3 — visualViewport keyboard inset helpers (pure + DOM apply).
 * Bottom-fixed chrome should offset by `--mpa-keyboard-inset` so the soft keyboard
 * does not permanently cover sticky actions / bottom nav.
 */

export const MPA_KEYBOARD_INSET_CSS_VAR = "--mpa-keyboard-inset";

/** Layout-viewport residual below the visual viewport (soft keyboard / browser chrome). */
export function computeKeyboardInset(
  visualViewport: Pick<VisualViewport, "height" | "offsetTop"> | null | undefined,
  layoutViewportHeight: number
): number {
  if (!visualViewport || !Number.isFinite(layoutViewportHeight) || layoutViewportHeight <= 0) {
    return 0;
  }
  const inset = layoutViewportHeight - visualViewport.height - visualViewport.offsetTop;
  if (!Number.isFinite(inset) || inset <= 0) return 0;
  return Math.round(inset);
}

export function applyKeyboardInsetCssVar(insetPx: number, root: HTMLElement | null = null): void {
  if (typeof document === "undefined") return;
  const target = root ?? document.documentElement;
  target.style.setProperty(MPA_KEYBOARD_INSET_CSS_VAR, `${Math.max(0, Math.round(insetPx))}px`);
}

export function clearKeyboardInsetCssVar(root: HTMLElement | null = null): void {
  applyKeyboardInsetCssVar(0, root);
}

export function readKeyboardInsetFromVisualViewport(
  win: Pick<Window, "innerHeight" | "visualViewport"> = window
): number {
  return computeKeyboardInset(win.visualViewport ?? null, win.innerHeight);
}
