/**
 * MA-8 — Master Admin certification inventory (hardening slice).
 * No new product capabilities — documents what must exist and stay gated.
 */

export type Ma8Surface = {
  slice: "MA-1" | "MA-2" | "MA-3" | "MA-4" | "MA-5" | "MA-6" | "MA-7" | "Owner Ops" | "Legacy";
  kind: "page" | "api" | "mutation";
  path: string;
  notes?: string;
};

/** Primary Command Center surfaces delivered by MA-1…MA-7. */
export const MA8_PRIMARY_SURFACES: readonly Ma8Surface[] = [
  { slice: "MA-1", kind: "page", path: "/admin" },
  { slice: "MA-1", kind: "page", path: "/admin/errors" },
  { slice: "MA-1", kind: "page", path: "/admin/errors/[errorId]" },
  { slice: "MA-1", kind: "api", path: "GET /api/admin/errors" },
  { slice: "MA-2", kind: "page", path: "/admin/platform/organizations/[orgId]" },
  { slice: "MA-2", kind: "api", path: "GET /api/admin/organizations/[orgId]" },
  { slice: "MA-3", kind: "page", path: "/admin/users" },
  { slice: "MA-3", kind: "page", path: "/admin/users/[userId]" },
  { slice: "MA-3", kind: "page", path: "/admin/audit" },
  { slice: "MA-3", kind: "page", path: "/admin/audit/[eventId]" },
  { slice: "MA-3", kind: "api", path: "GET /api/admin/users" },
  { slice: "MA-3", kind: "api", path: "GET /api/admin/audit" },
  { slice: "MA-4", kind: "page", path: "/admin/subscriptions" },
  { slice: "MA-4", kind: "page", path: "/admin/subscriptions/[orgId]" },
  { slice: "MA-4", kind: "page", path: "/admin/capacity" },
  { slice: "MA-4", kind: "page", path: "/admin/capacity/[orgId]" },
  { slice: "MA-4", kind: "api", path: "GET /api/admin/subscriptions" },
  { slice: "MA-4", kind: "api", path: "GET /api/admin/capacity" },
  { slice: "MA-5", kind: "page", path: "/admin/checkout" },
  { slice: "MA-5", kind: "page", path: "/admin/checkout/[sessionId]" },
  { slice: "MA-5", kind: "page", path: "/admin/webhooks" },
  { slice: "MA-5", kind: "page", path: "/admin/webhooks/[eventId]" },
  { slice: "MA-5", kind: "api", path: "GET /api/admin/checkout" },
  { slice: "MA-5", kind: "api", path: "GET /api/admin/webhooks" },
  { slice: "MA-6", kind: "page", path: "/admin/operations" },
  { slice: "MA-6", kind: "page", path: "/admin/operations/work-orders" },
  { slice: "MA-6", kind: "page", path: "/admin/operations/work-orders/[workOrderId]" },
  { slice: "MA-6", kind: "page", path: "/admin/operations/properties" },
  { slice: "MA-6", kind: "page", path: "/admin/operations/vendors" },
  { slice: "MA-6", kind: "page", path: "/admin/operations/notifications" },
  { slice: "MA-6", kind: "api", path: "GET /api/admin/operations" },
  { slice: "MA-7", kind: "mutation", path: "POST /api/admin/mutations/memberships" },
  { slice: "MA-7", kind: "mutation", path: "POST /api/admin/mutations/subscriptions" },
  { slice: "MA-7", kind: "mutation", path: "POST /api/admin/mutations/blocked" }
] as const;

/** Primary Master Admin nav entries that must remain reachable. */
export const MA8_PRIMARY_NAV_HREFS = [
  "/admin",
  "/admin/platform/organizations",
  "/admin/users",
  "/admin/subscriptions",
  "/admin/capacity",
  "/admin/checkout",
  "/admin/webhooks",
  "/admin/operations",
  "/admin/audit",
  "/admin/errors"
] as const;

/** Forbidden secret material that must never appear unreacted in MA API/UI payloads. */
export const MA8_FORBIDDEN_SECRET_PATTERNS: readonly RegExp[] = [
  /STRIPE_SECRET_KEY\s*=\s*\S+/i,
  /sk_live_[A-Za-z0-9]{8,}/,
  /sk_test_[A-Za-z0-9]{16,}/,
  /whsec_[A-Za-z0-9]{8,}/,
  /SUPABASE_SERVICE_ROLE_KEY\s*=\s*\S+/i,
  /-----BEGIN (RSA |EC )?PRIVATE KEY-----/,
  /Bearer\s+[A-Za-z0-9._-]{20,}/i
];

export function assertNoForbiddenSecrets(payload: unknown, label: string): void {
  const text = JSON.stringify(payload);
  for (const pattern of MA8_FORBIDDEN_SECRET_PATTERNS) {
    if (pattern.test(text)) {
      throw new Error(`MA-8 sensitive-data failure in ${label}: matched ${pattern}`);
    }
  }
}

export const MA8_DOCUMENTED_NON_GOALS = [
  "Organization suspend/reactivate (no org status field; side effects undefined)",
  "Fine-grained operator grants table (no approved Production migration)",
  "Manual capacity mutation (Stripe/webhook authoritative)",
  "Webhook replay",
  "Role editing / arbitrary capability grants"
] as const;

export const MA8_RESIDUAL_RISKS = [
  "Owner Ops /admin/commercial/subscriptions SKU assign remains operator-gated but outside MA-7 capability matrix (pre-MA surface; documented — do not expand)",
  "Legacy orphan pages (launch-readiness, products/*, testing/demo, capability-catalog) remain URL-reachable behind admin layout; not in primary nav"
] as const;
