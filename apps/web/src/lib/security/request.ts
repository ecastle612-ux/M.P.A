import type { NextRequest } from "next/server";

/**
 * Best-effort client IP extraction from standard proxy headers. Returns `"unknown"` when
 * no forwarding header is present (the value is only used as a rate-limit / audit key).
 */
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0];
    if (first && first.trim().length > 0) return first.trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp && realIp.trim().length > 0) return realIp.trim();
  return "unknown";
}

/**
 * Non-reversible pseudonymization of an IP (FNV-1a, 32-bit) for audit logs. This avoids
 * storing raw IPs while still allowing correlation of repeated activity.
 */
export function hashIp(ip: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < ip.length; i += 1) {
    hash ^= ip.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
