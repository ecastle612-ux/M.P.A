/**
 * PMX-004 Phase 2 — standalone / installed detection.
 */

export function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  const media = window.matchMedia?.("(display-mode: standalone)");
  if (media?.matches) return true;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  if (nav.standalone === true) return true;
  // Android TWA / related
  if (window.matchMedia?.("(display-mode: fullscreen)")?.matches) return true;
  if (window.matchMedia?.("(display-mode: minimal-ui)")?.matches) return true;
  return false;
}

export function subscribeStandaloneChange(onChange: (standalone: boolean) => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  const media = window.matchMedia?.("(display-mode: standalone)");
  const handler = () => onChange(isStandaloneDisplay());
  media?.addEventListener?.("change", handler);
  window.addEventListener("appinstalled", handler);
  return () => {
    media?.removeEventListener?.("change", handler);
    window.removeEventListener("appinstalled", handler);
  };
}
