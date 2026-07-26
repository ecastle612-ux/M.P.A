/**
 * PMX-004 Phase 2 — install eligibility / platform detection.
 */

export type PwaPlatform =
  | "android-chrome"
  | "ios-safari"
  | "desktop"
  | "other";

export function detectPwaPlatform(
  userAgent = typeof navigator !== "undefined" ? navigator.userAgent : "",
  maxTouchPoints = typeof navigator !== "undefined" ? navigator.maxTouchPoints : 0
): PwaPlatform {
  const ua = userAgent;
  const isIos =
    /iPad|iPhone|iPod/.test(ua) ||
    (ua.includes("Macintosh") && maxTouchPoints > 1);
  const isAndroid = /Android/i.test(ua);
  const isMobile = isIos || isAndroid || /Mobile/i.test(ua);

  // iOS: A2HS coaching (Safari primary; other iOS browsers still get guidance).
  if (isIos) return "ios-safari";
  // Android: BIP / Chrome-family install path.
  if (isAndroid) return "android-chrome";
  if (!isMobile) return "desktop";
  return "other";
}

/** True when an install coaching surface is useful (not already installed). */
export function isInstallCoachingEligible(platform: PwaPlatform, standalone: boolean): boolean {
  if (standalone) return false;
  return platform === "android-chrome" || platform === "ios-safari" || platform === "desktop";
}
