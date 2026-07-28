/**
 * BILL-001 Phase C — centralized entitlement gate for commercial mutations.
 *
 * AuthZ (capabilities) runs first; this gate runs next for plan limits,
 * module access, and subscription commercial status.
 */
import {
  assertModuleEntitled,
  assertWithinLimit,
  type EntitlementDenial,
  type EntitlementResult,
  type PlanEntitlementSnapshot
} from "../auth/capability-matrix";
import {
  assertEntitled,
  getEntitlementSnapshot
} from "../auth/entitlements";
import { createServiceRoleServerClient } from "../auth/server";
import type { SaasSubscriptionStatus } from "../integrations/saas-billing/contracts";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

export type EntitlementGateCode =
  | EntitlementDenial["code"]
  | "subscription_inactive"
  | "past_due_restricted"
  | "commercial_inactive";

export type EntitlementGateDenial = {
  ok: false;
  code: EntitlementGateCode;
  message: string;
  httpStatus: 402 | 403 | 409;
};

export type EntitlementGateOk = { ok: true };

export type EntitlementGateResult = EntitlementGateOk | EntitlementGateDenial;

export type OrganizationUsageCounts = {
  properties: number;
  activeSeats: number;
  pendingInvites: number;
  /** Seats that count toward the plan limit (active members + pending invites). */
  seatUsage: number;
};

export type OrganizationEntitlementContext = {
  organizationId: string;
  snapshot: PlanEntitlementSnapshot | null;
  subscriptionStatus: SaasSubscriptionStatus | null;
  commercialStatus: string | null;
  usage: OrganizationUsageCounts;
  /** True when new billable resources (properties / seats) may be created. */
  canCreateResources: boolean;
};

const CREATE_BLOCKING_STATUSES = new Set<string>([
  "past_due",
  "unpaid",
  "canceled",
  "incomplete_expired",
  "paused"
]);

function serviceClient(client?: AnyClient): AnyClient {
  if (client) return client;
  const created = createServiceRoleServerClient();
  if (!created) throw new Error("Entitlement gate requires SUPABASE_SERVICE_ROLE_KEY");
  return created;
}

function denial(
  code: EntitlementGateCode,
  message: string,
  httpStatus: 402 | 403 | 409 = 402
): EntitlementGateDenial {
  return { ok: false, code, message, httpStatus };
}

function fromEntitlementResult(result: EntitlementResult): EntitlementGateResult {
  if (result.ok) return { ok: true };
  return denial(
    result.code,
    result.message,
    result.code === "limit_exceeded" ? 402 : 403
  );
}

export function subscriptionAllowsResourceCreates(
  subscriptionStatus: string | null | undefined
): boolean {
  if (!subscriptionStatus) {
    // No mirrored SaaS sub yet (guided setup / trial provision) — allow within snapshot limits.
    return true;
  }
  if (CREATE_BLOCKING_STATUSES.has(subscriptionStatus)) {
    return false;
  }
  return ["trialing", "active", "incomplete"].includes(subscriptionStatus);
}

export async function countOrganizationUsage(
  organizationId: string,
  client?: AnyClient
): Promise<OrganizationUsageCounts> {
  const db = serviceClient(client);
  const [properties, activeMembers, pendingInvites] = await Promise.all([
    db
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .is("deleted_at", null),
    db
      .from("organization_memberships")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("status", "active"),
    db
      .from("organization_invitations")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("status", "pending")
  ]);

  const propertyCount = properties.error ? 0 : (properties.count ?? 0);
  const activeSeats = activeMembers.error ? 0 : (activeMembers.count ?? 0);
  const pending = pendingInvites.error ? 0 : (pendingInvites.count ?? 0);

  return {
    properties: propertyCount,
    activeSeats,
    pendingInvites: pending,
    seatUsage: activeSeats + pending
  };
}

export class EntitlementGateError extends Error {
  readonly denial: EntitlementGateDenial;

  constructor(denial: EntitlementGateDenial) {
    super(denial.message);
    this.name = "EntitlementGateError";
    this.denial = denial;
  }
}

export function throwIfDenied(result: EntitlementGateResult): asserts result is EntitlementGateOk {
  if (!result.ok) {
    throw new EntitlementGateError(result);
  }
}

export async function loadOrganizationEntitlementContext(
  organizationId: string,
  client?: AnyClient
): Promise<OrganizationEntitlementContext> {
  const db = serviceClient(client);
  const [snapshot, usage, subRow, orgRow] = await Promise.all([
    getEntitlementSnapshot(organizationId, db).catch(() => null),
    countOrganizationUsage(organizationId, db),
    db
      .from("saas_subscriptions")
      .select("status")
      .eq("organization_id", organizationId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    db.from("organizations").select("commercial_status").eq("id", organizationId).maybeSingle()
  ]);

  const subscriptionStatus =
    subRow.data && typeof (subRow.data as { status?: unknown }).status === "string"
      ? ((subRow.data as { status: SaasSubscriptionStatus }).status ?? null)
      : null;
  const orgData = orgRow.data as { commercial_status?: string | null } | null;
  const commercialStatus =
    orgData?.commercial_status != null ? String(orgData.commercial_status) : null;

  return {
    organizationId,
    snapshot,
    subscriptionStatus,
    commercialStatus,
    usage,
    canCreateResources: subscriptionAllowsResourceCreates(subscriptionStatus)
  };
}

function assertCreateResourcesAllowed(
  context: OrganizationEntitlementContext
): EntitlementGateResult {
  if (!context.canCreateResources) {
    if (context.subscriptionStatus === "past_due" || context.subscriptionStatus === "unpaid") {
      return denial(
        "past_due_restricted",
        "Your subscription payment is past due. Update billing to add properties or team seats.",
        402
      );
    }
    return denial(
      "subscription_inactive",
      "Your subscription is not active. Manage billing to restore create access.",
      402
    );
  }
  return { ok: true };
}

/** Hard block for creating a property (BILL-001 Phase C exit criterion). */
export async function assertCanCreateProperty(
  organizationId: string,
  client?: AnyClient
): Promise<EntitlementGateResult> {
  const context = await loadOrganizationEntitlementContext(organizationId, client);
  const createGate = assertCreateResourcesAllowed(context);
  if (!createGate.ok) return createGate;

  if (!context.snapshot) {
    return denial(
      "no_snapshot",
      "No subscription entitlements are bound for this organization. Complete billing or provisioning first.",
      403
    );
  }

  const moduleGate = assertModuleEntitled(context.snapshot, "property_operations");
  if (!moduleGate.ok) {
    return denial("not_entitled", moduleGate.message, 403);
  }

  return fromEntitlementResult(
    assertWithinLimit(context.snapshot, "maxProperties", context.usage.properties)
  );
}

/**
 * Hard block for inviting a new seat.
 * Resends of an existing pending invite do not consume an extra seat.
 */
export async function assertCanInviteSeat(
  organizationId: string,
  options?: { isResend?: boolean; client?: AnyClient }
): Promise<EntitlementGateResult> {
  if (options?.isResend) {
    return { ok: true };
  }

  const context = await loadOrganizationEntitlementContext(organizationId, options?.client);
  const createGate = assertCreateResourcesAllowed(context);
  if (!createGate.ok) return createGate;

  if (!context.snapshot) {
    return denial(
      "no_snapshot",
      "No subscription entitlements are bound for this organization. Complete billing or provisioning first.",
      403
    );
  }

  return fromEntitlementResult(
    assertWithinLimit(context.snapshot, "maxUsers", context.usage.seatUsage)
  );
}

/** Module access gate (Property / Facility / feature modules). */
export async function assertCanAccessModule(
  organizationId: string,
  moduleKey: string,
  client?: AnyClient
): Promise<EntitlementGateResult> {
  const result = await assertEntitled(organizationId, moduleKey, client);
  return fromEntitlementResult(result);
}

export function entitledModuleKeys(snapshot: PlanEntitlementSnapshot | null): string[] {
  if (!snapshot) return [];
  const keys = new Set<string>([...snapshot.modules]);
  for (const [key, enabled] of Object.entries(snapshot.features)) {
    if (enabled) keys.add(key);
  }
  return [...keys];
}
