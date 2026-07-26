/**
 * PMX-004 Phase 7 — allowlisted offline endpoints.
 * Unknown endpoints default to block (requires connection).
 */

import type { OutboxWorkflow } from "./types";

export type AllowlistMatch = {
  workflow: OutboxWorkflow;
  label: string;
};

function pathOnly(url: string): string {
  try {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return new URL(url).pathname;
    }
  } catch {
    // fall through
  }
  return url.split("?")[0] ?? url;
}

/**
 * Returns allowlist match for same-origin API mutations, else null (blocked offline).
 */
export function matchAllowlistedRequest(
  method: string,
  url: string,
  body: unknown
): AllowlistMatch | null {
  const normalizedMethod = method.toUpperCase();
  const path = pathOnly(url);

  if (normalizedMethod === "POST" && /^\/api\/messaging\/threads\/[^/]+\/messages$/.test(path)) {
    return { workflow: "message_send", label: "Message" };
  }

  if (normalizedMethod === "PATCH" && /^\/api\/maintenance\/[^/]+$/.test(path)) {
    const action =
      body && typeof body === "object" && body !== null && "action" in body
        ? String((body as { action?: unknown }).action ?? "")
        : "";
    // Notes / field updates only — not create, assign, complete, etc.
    if (action === "update") {
      return { workflow: "maintenance_notes", label: "Maintenance notes" };
    }
    return null;
  }

  if (normalizedMethod === "POST" && path === "/api/media/intent") {
    return { workflow: "maintenance_photo", label: "Photo upload" };
  }

  if (normalizedMethod === "POST" && /^\/api\/vendor-jobs\/[^/]+\/photo$/.test(path)) {
    return { workflow: "vendor_photo", label: "Vendor photo" };
  }

  if (
    (normalizedMethod === "PATCH" || normalizedMethod === "POST") &&
    /^\/api\/facility\/inspections\/[^/]+$/.test(path)
  ) {
    const action =
      body && typeof body === "object" && body !== null && "action" in body
        ? String((body as { action?: unknown }).action ?? "")
        : "";
    if (action === "update_item" || action === "item" || action === "respond") {
      return { workflow: "inspection_item", label: "Inspection response" };
    }
    // Also allow JSON bodies that patch checklist fields without action tag
    if (
      body &&
      typeof body === "object" &&
      body !== null &&
      ("itemId" in body || "checklistItemId" in body || "response" in body)
    ) {
      return { workflow: "inspection_item", label: "Inspection response" };
    }
  }

  return null;
}

/** Explicit block list messaging for non-allowlisted sensitive flows. */
export function isExplicitlyBlockedOffline(method: string, url: string): boolean {
  const path = pathOnly(url);
  const blockedPrefixes = [
    "/api/payments",
    "/api/resident/payments",
    "/api/saas",
    "/api/billing",
    "/api/signatures",
    "/api/signing",
    "/api/auth",
    "/api/organizations/switch",
    "/api/master-admin",
    "/api/migration",
    "/api/owner/payouts",
    "/api/payouts"
  ];
  if (blockedPrefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) {
    return true;
  }
  // Destructive deletes
  if (method.toUpperCase() === "DELETE") return true;
  return false;
}
