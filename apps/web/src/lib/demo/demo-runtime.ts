import { COM_002_FLAGS } from "@mpa/shared";

/**
 * STAB-015 — Demo APIs must fail closed on Vercel Production unless explicitly enabled.
 * Uses VERCEL_ENV (not NODE_ENV) so local `next build` / Preview remain usable.
 */
export function isDemoRuntimeEnabled(): boolean {
  if (!COM_002_FLAGS.sliceB_demoPlatform) {
    return false;
  }
  if (process.env["VERCEL_ENV"] === "production") {
    return process.env["DEMO_ENABLED"] === "true";
  }
  return true;
}
