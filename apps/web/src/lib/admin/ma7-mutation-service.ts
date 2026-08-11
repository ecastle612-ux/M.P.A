/**
 * MA-7 mutation service — membership status + subscription lifecycle only.
 * Org suspend/reactivate and capacity mutate are blocked (no invented semantics).
 */

import { createAuthServerClient } from "../auth/server";
import { isPlatformOperatorUser } from "../commercial/server";
import { serverEnv } from "../env/server-env";
import {
  cancelAtPeriodEnd,
  reactivateSubscription
} from "../saas-lifecycle/apply-lifecycle";
import { getLifecycleByOrganizationId } from "../saas-lifecycle/lifecycle-store";
import { writeMa7Audit } from "./ma7-audit";
import {
  MA7_CAPABILITIES,
  operatorHasCapability,
  resolveTrustedCapabilities,
  type Ma7Capability
} from "./ma7-capabilities";
import {
  CAPACITY_MUTATION_BLOCKER,
  classifyMembershipTransition,
  classifySubscriptionCancel,
  classifySubscriptionReactivate,
  countActiveAdmins,
  newCorrelationId,
  ORG_LIFECYCLE_BLOCKER,
  validateConfirmation,
  validateReason,
  wouldRemoveLastAdmin,
  type Ma7MembershipStatus,
  type Ma7MutationErrorCode
} from "./ma7-mutations";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = { from: (table: string) => any };

async function tryServiceRole(): Promise<AnyClient | null> {
  try {
    if (process.env["VITEST"]) return null;
    if (!serverEnv.SUPABASE_SERVICE_ROLE_KEY) return null;
    const { createServiceRoleClient } = await import("../supabase/service-role");
    return createServiceRoleClient() as unknown as AnyClient;
  } catch {
    return null;
  }
}

async function dbClient(): Promise<AnyClient> {
  const service = await tryServiceRole();
  if (service) return service;
  return (await createAuthServerClient()) as unknown as AnyClient;
}

export type Ma7AuthContext = {
  userId: string;
  capabilities: ReadonlySet<Ma7Capability>;
};

export async function requireMa7Operator(
  required: Ma7Capability
): Promise<
  | { ok: true; auth: Ma7AuthContext }
  | { ok: false; status: 401 | 403; code: Ma7MutationErrorCode }
> {
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, status: 401, code: "unauthorized" };
  const isOperator = await isPlatformOperatorUser(user);
  const capabilities = resolveTrustedCapabilities({ isActiveOperator: isOperator });
  if (!isOperator || !operatorHasCapability(capabilities, required)) {
    return { ok: false, status: 403, code: "forbidden" };
  }
  return { ok: true, auth: { userId: user.id, capabilities } };
}

export type Ma7MutationResult = {
  ok: boolean;
  code?: Ma7MutationErrorCode | "ok" | "idempotent";
  message?: string;
  correlationId: string;
  previousState?: Record<string, unknown>;
  resultingState?: Record<string, unknown>;
  organizationId?: string;
  entityId?: string;
};

export async function mutateOrganizationLifecycle(input: {
  organizationId: string;
  action: "suspend" | "reactivate";
  reason?: unknown;
  confirm?: unknown;
  confirmationToken?: unknown;
  confirmationPhrase?: unknown;
  clientClaimedCapabilities?: unknown;
}): Promise<Ma7MutationResult> {
  void input;
  const correlationId = newCorrelationId();
  return {
    ok: false,
    code: "lifecycle_unavailable",
    message: ORG_LIFECYCLE_BLOCKER,
    correlationId
  };
}

export async function mutateMembershipStatus(input: {
  membershipId: string;
  organizationId: string;
  status: Ma7MembershipStatus;
  reason: unknown;
  confirm: unknown;
  confirmationToken: unknown;
  idempotencyKey?: string | null;
}): Promise<Ma7MutationResult> {
  const correlationId = newCorrelationId();
  const gate = await requireMa7Operator(MA7_CAPABILITIES.USERS_MEMBERSHIP_MUTATE);
  if (!gate.ok) {
    return { ok: false, code: gate.code, correlationId, message: gate.code };
  }

  const reasonCheck = validateReason(input.reason);
  if (!reasonCheck.ok) {
    await writeMa7Audit({
      operatorUserId: gate.auth.userId,
      organizationId: input.organizationId,
      action: "ma7.membership.status",
      entityType: "organization_memberships",
      entityId: input.membershipId,
      reason: null,
      correlationId,
      result: "rejected",
      errorCode: reasonCheck.code
    });
    return { ok: false, code: reasonCheck.code, correlationId, message: "Meaningful reason required (min 8 chars)." };
  }

  const action =
    input.status === "inactive" ? ("deactivate_membership" as const) : ("reactivate_membership" as const);
  const confirmCheck = validateConfirmation({
    action,
    confirm: input.confirm,
    confirmationToken: input.confirmationToken
  });
  if (!confirmCheck.ok) {
    await writeMa7Audit({
      operatorUserId: gate.auth.userId,
      organizationId: input.organizationId,
      action: "ma7.membership.status",
      entityType: "organization_memberships",
      entityId: input.membershipId,
      reason: reasonCheck.reason,
      correlationId,
      result: "rejected",
      errorCode: confirmCheck.code
    });
    return {
      ok: false,
      code: confirmCheck.code,
      correlationId,
      message: "Explicit confirmation token required."
    };
  }

  const client = await dbClient();

  // Resolve membership server-side — never trust client org alone.
  const { data: membership, error: loadError } = await client
    .from("organization_memberships")
    .select("id, organization_id, user_id, roles, status")
    .eq("id", input.membershipId)
    .maybeSingle();

  if (loadError) {
    return { ok: false, code: "invalid_state", correlationId, message: loadError.message };
  }
  if (!membership) {
    return { ok: false, code: "not_found", correlationId, message: "Membership not found." };
  }

  const resolvedOrgId = String(membership.organization_id);
  if (resolvedOrgId !== input.organizationId) {
    await writeMa7Audit({
      operatorUserId: gate.auth.userId,
      organizationId: resolvedOrgId,
      action: "ma7.membership.status",
      entityType: "organization_memberships",
      entityId: input.membershipId,
      reason: reasonCheck.reason,
      correlationId,
      result: "rejected",
      errorCode: "cross_org_rejected",
      idempotencyKey: input.idempotencyKey ?? null
    });
    return {
      ok: false,
      code: "cross_org_rejected",
      correlationId,
      message: "Membership does not belong to the stated organization.",
      organizationId: resolvedOrgId
    };
  }

  // Verify organization exists (server-resolved scope).
  const { data: org } = await client
    .from("organizations")
    .select("id, name")
    .eq("id", resolvedOrgId)
    .maybeSingle();
  if (!org) {
    return { ok: false, code: "not_found", correlationId, message: "Organization not found." };
  }

  const currentStatus = String(membership.status) as Ma7MembershipStatus;
  const transition = classifyMembershipTransition({
    current: currentStatus === "inactive" ? "inactive" : "active",
    requested: input.status
  });

  const previousState = {
    membershipId: String(membership.id),
    userId: String(membership.user_id),
    status: currentStatus,
    roles: Array.isArray(membership.roles) ? membership.roles : []
  };

  if (transition === "already_active" || transition === "already_inactive") {
    const code = transition === "already_active" ? "already_active" : "already_inactive";
    const audited = await writeMa7Audit({
      operatorUserId: gate.auth.userId,
      organizationId: resolvedOrgId,
      action: "ma7.membership.status",
      entityType: "organization_memberships",
      entityId: input.membershipId,
      reason: reasonCheck.reason,
      correlationId,
      result: "idempotent",
      previousState,
      resultingState: previousState,
      errorCode: code,
      idempotencyKey: input.idempotencyKey ?? null
    });
    if (!audited.ok) {
      return { ok: false, code: "audit_failed", correlationId, message: audited.error ?? "audit_failed" };
    }
    return {
      ok: true,
      code: "idempotent",
      message: code,
      correlationId,
      previousState,
      resultingState: previousState,
      organizationId: resolvedOrgId,
      entityId: input.membershipId
    };
  }

  if (input.status === "inactive") {
    const { data: orgMembers } = await client
      .from("organization_memberships")
      .select("id, status, roles")
      .eq("organization_id", resolvedOrgId);
    const rows = (orgMembers ?? []) as Array<{ id: string; status: string; roles: string[] }>;
    const activeAdminCount = countActiveAdmins(rows);
    if (
      wouldRemoveLastAdmin({
        target: {
          status: currentStatus,
          roles: Array.isArray(membership.roles) ? (membership.roles as string[]) : []
        },
        requestedStatus: "inactive",
        activeAdminCount
      })
    ) {
      await writeMa7Audit({
        operatorUserId: gate.auth.userId,
        organizationId: resolvedOrgId,
        action: "ma7.membership.status",
        entityType: "organization_memberships",
        entityId: input.membershipId,
        reason: reasonCheck.reason,
        correlationId,
        result: "rejected",
        previousState,
        errorCode: "last_admin_protection",
        idempotencyKey: input.idempotencyKey ?? null
      });
      return {
        ok: false,
        code: "last_admin_protection",
        correlationId,
        message: "Cannot deactivate the last organization administrator.",
        previousState,
        organizationId: resolvedOrgId,
        entityId: input.membershipId
      };
    }
  }

  const { data: updated, error: updateError } = await client
    .from("organization_memberships")
    .update({ status: input.status, updated_at: new Date().toISOString() })
    .eq("id", input.membershipId)
    .eq("organization_id", resolvedOrgId)
    .select("id, user_id, roles, status")
    .maybeSingle();

  if (updateError || !updated) {
    await writeMa7Audit({
      operatorUserId: gate.auth.userId,
      organizationId: resolvedOrgId,
      action: "ma7.membership.status",
      entityType: "organization_memberships",
      entityId: input.membershipId,
      reason: reasonCheck.reason,
      correlationId,
      result: "failure",
      previousState,
      errorCode: "invalid_state",
      idempotencyKey: input.idempotencyKey ?? null
    });
    return {
      ok: false,
      code: "invalid_state",
      correlationId,
      message: updateError?.message ?? "Update failed",
      previousState,
      organizationId: resolvedOrgId
    };
  }

  const resultingState = {
    membershipId: String(updated.id),
    userId: String(updated.user_id),
    status: String(updated.status),
    roles: Array.isArray(updated.roles) ? updated.roles : []
  };

  const audited = await writeMa7Audit({
    operatorUserId: gate.auth.userId,
    organizationId: resolvedOrgId,
    action: "ma7.membership.status",
    entityType: "organization_memberships",
    entityId: input.membershipId,
    reason: reasonCheck.reason,
    correlationId,
    result: "success",
    previousState,
    resultingState,
    idempotencyKey: input.idempotencyKey ?? null
  });

  if (!audited.ok) {
    // Compensate — do not leave silent mutation without audit trail.
    await client
      .from("organization_memberships")
      .update({ status: currentStatus, updated_at: new Date().toISOString() })
      .eq("id", input.membershipId)
      .eq("organization_id", resolvedOrgId);
    return {
      ok: false,
      code: "audit_failed",
      correlationId,
      message: "Mutation rolled back because audit write failed.",
      previousState,
      organizationId: resolvedOrgId
    };
  }

  return {
    ok: true,
    code: "ok",
    correlationId,
    previousState,
    resultingState,
    organizationId: resolvedOrgId,
    entityId: input.membershipId
  };
}

export async function mutateSubscriptionLifecycle(input: {
  organizationId: string;
  action: "cancel" | "reactivate";
  reason: unknown;
  confirm: unknown;
  confirmationToken: unknown;
  idempotencyKey?: string | null;
}): Promise<Ma7MutationResult> {
  const correlationId = newCorrelationId();
  const required =
    input.action === "cancel"
      ? MA7_CAPABILITIES.SUBSCRIPTIONS_CANCEL
      : MA7_CAPABILITIES.SUBSCRIPTIONS_REACTIVATE;
  const gate = await requireMa7Operator(required);
  if (!gate.ok) {
    return { ok: false, code: gate.code, correlationId, message: gate.code };
  }

  const reasonCheck = validateReason(input.reason);
  if (!reasonCheck.ok) {
    await writeMa7Audit({
      operatorUserId: gate.auth.userId,
      organizationId: input.organizationId,
      action: `ma7.subscription.${input.action}`,
      entityType: "organization_subscriptions",
      entityId: input.organizationId,
      reason: null,
      correlationId,
      result: "rejected",
      errorCode: reasonCheck.code
    });
    return { ok: false, code: reasonCheck.code, correlationId, message: "Meaningful reason required (min 8 chars)." };
  }

  const confirmAction =
    input.action === "cancel" ? ("cancel_subscription" as const) : ("reactivate_subscription" as const);
  const confirmCheck = validateConfirmation({
    action: confirmAction,
    confirm: input.confirm,
    confirmationToken: input.confirmationToken
  });
  if (!confirmCheck.ok) {
    await writeMa7Audit({
      operatorUserId: gate.auth.userId,
      organizationId: input.organizationId,
      action: `ma7.subscription.${input.action}`,
      entityType: "organization_subscriptions",
      entityId: input.organizationId,
      reason: reasonCheck.reason,
      correlationId,
      result: "rejected",
      errorCode: confirmCheck.code
    });
    return {
      ok: false,
      code: confirmCheck.code,
      correlationId,
      message: "Explicit confirmation token required."
    };
  }

  const client = await dbClient();
  const { data: org } = await client
    .from("organizations")
    .select("id, name")
    .eq("id", input.organizationId)
    .maybeSingle();
  if (!org) {
    return { ok: false, code: "not_found", correlationId, message: "Organization not found." };
  }

  // Prefer durable lifecycle store; fall back to organization_subscriptions row.
  let beforeStatus: string | null = null;
  let beforeCancel = false;
  let stripeSubscriptionId: string | null = null;
  const life = await getLifecycleByOrganizationId(input.organizationId);
  if (life && life.organizationId === input.organizationId) {
    beforeStatus = life.status;
    beforeCancel = Boolean(life.cancelAtPeriodEnd);
    stripeSubscriptionId = life.stripeSubscriptionId;
  } else {
    const { data: subRow } = await client
      .from("organization_subscriptions")
      .select("status, cancel_at_period_end, stripe_subscription_id, organization_id")
      .eq("organization_id", input.organizationId)
      .maybeSingle();
    if (!subRow) {
      return { ok: false, code: "not_found", correlationId, message: "Subscription not found." };
    }
    beforeStatus = typeof subRow.status === "string" ? subRow.status : null;
    beforeCancel = Boolean(subRow.cancel_at_period_end);
    stripeSubscriptionId =
      typeof subRow.stripe_subscription_id === "string" ? subRow.stripe_subscription_id : null;
  }

  const previousState = {
    organizationId: input.organizationId,
    status: beforeStatus,
    cancelAtPeriodEnd: beforeCancel,
    stripeSubscriptionId
  };

  if (input.action === "cancel") {
    const classification = classifySubscriptionCancel({
      status: beforeStatus,
      cancelAtPeriodEnd: beforeCancel
    });
    if (classification === "already_cancelled") {
      const audited = await writeMa7Audit({
        operatorUserId: gate.auth.userId,
        organizationId: input.organizationId,
        action: "ma7.subscription.cancel",
        entityType: "organization_subscriptions",
        entityId: input.organizationId,
        reason: reasonCheck.reason,
        correlationId,
        result: "idempotent",
        previousState,
        resultingState: previousState,
        errorCode: "already_cancelled",
        idempotencyKey: input.idempotencyKey ?? null
      });
      if (!audited.ok) {
        return { ok: false, code: "audit_failed", correlationId, message: audited.error ?? "audit_failed" };
      }
      return {
        ok: true,
        code: "idempotent",
        message: "already_cancelled",
        correlationId,
        previousState,
        resultingState: previousState,
        organizationId: input.organizationId
      };
    }
    if (classification === "not_cancellable") {
      await writeMa7Audit({
        operatorUserId: gate.auth.userId,
        organizationId: input.organizationId,
        action: "ma7.subscription.cancel",
        entityType: "organization_subscriptions",
        entityId: input.organizationId,
        reason: reasonCheck.reason,
        correlationId,
        result: "rejected",
        previousState,
        errorCode: "not_cancellable",
        idempotencyKey: input.idempotencyKey ?? null
      });
      return {
        ok: false,
        code: "not_cancellable",
        correlationId,
        message: "Subscription is not in a cancellable state.",
        previousState,
        organizationId: input.organizationId
      };
    }

    const sub = await cancelAtPeriodEnd({
      organizationId: input.organizationId,
      source: "master_admin"
    });
    if (!sub || sub.organizationId !== input.organizationId) {
      await writeMa7Audit({
        operatorUserId: gate.auth.userId,
        organizationId: input.organizationId,
        action: "ma7.subscription.cancel",
        entityType: "organization_subscriptions",
        entityId: input.organizationId,
        reason: reasonCheck.reason,
        correlationId,
        result: "failure",
        previousState,
        errorCode: "invalid_state",
        idempotencyKey: input.idempotencyKey ?? null
      });
      return {
        ok: false,
        code: "invalid_state",
        correlationId,
        message: "Lifecycle service could not cancel subscription.",
        previousState,
        organizationId: input.organizationId
      };
    }

    // Reload authoritative state
    const reloaded = (await getLifecycleByOrganizationId(input.organizationId)) ?? sub;
    const resultingState = {
      organizationId: input.organizationId,
      status: reloaded.status,
      cancelAtPeriodEnd: Boolean(reloaded.cancelAtPeriodEnd),
      stripeSubscriptionId: reloaded.stripeSubscriptionId,
      currentPeriodEnd: reloaded.currentPeriodEnd
    };

    const audited = await writeMa7Audit({
      operatorUserId: gate.auth.userId,
      organizationId: input.organizationId,
      action: "ma7.subscription.cancel",
      entityType: "organization_subscriptions",
      entityId: input.organizationId,
      reason: reasonCheck.reason,
      correlationId,
      result: "success",
      previousState,
      resultingState,
      idempotencyKey: input.idempotencyKey ?? null
    });
    if (!audited.ok) {
      return {
        ok: false,
        code: "audit_failed",
        correlationId,
        message: "Lifecycle updated but audit write failed — verify Audit Log.",
        previousState,
        resultingState,
        organizationId: input.organizationId
      };
    }

    return {
      ok: true,
      code: "ok",
      correlationId,
      previousState,
      resultingState,
      organizationId: input.organizationId
    };
  }

  // reactivate
  const classification = classifySubscriptionReactivate({
    status: beforeStatus,
    cancelAtPeriodEnd: beforeCancel
  });
  if (classification === "already_active") {
    const audited = await writeMa7Audit({
      operatorUserId: gate.auth.userId,
      organizationId: input.organizationId,
      action: "ma7.subscription.reactivate",
      entityType: "organization_subscriptions",
      entityId: input.organizationId,
      reason: reasonCheck.reason,
      correlationId,
      result: "idempotent",
      previousState,
      resultingState: previousState,
      errorCode: "already_active",
      idempotencyKey: input.idempotencyKey ?? null
    });
    if (!audited.ok) {
      return { ok: false, code: "audit_failed", correlationId, message: audited.error ?? "audit_failed" };
    }
    return {
      ok: true,
      code: "idempotent",
      message: "already_active",
      correlationId,
      previousState,
      resultingState: previousState,
      organizationId: input.organizationId
    };
  }

  const sub = await reactivateSubscription({ organizationId: input.organizationId });
  if (!sub || sub.organizationId !== input.organizationId) {
    await writeMa7Audit({
      operatorUserId: gate.auth.userId,
      organizationId: input.organizationId,
      action: "ma7.subscription.reactivate",
      entityType: "organization_subscriptions",
      entityId: input.organizationId,
      reason: reasonCheck.reason,
      correlationId,
      result: "failure",
      previousState,
      errorCode: "invalid_state",
      idempotencyKey: input.idempotencyKey ?? null
    });
    return {
      ok: false,
      code: "invalid_state",
      correlationId,
      message: "Lifecycle service could not reactivate subscription.",
      previousState,
      organizationId: input.organizationId
    };
  }

  const reloaded = (await getLifecycleByOrganizationId(input.organizationId)) ?? sub;
  const resultingState = {
    organizationId: input.organizationId,
    status: reloaded.status,
    cancelAtPeriodEnd: Boolean(reloaded.cancelAtPeriodEnd),
    stripeSubscriptionId: reloaded.stripeSubscriptionId,
    currentPeriodEnd: reloaded.currentPeriodEnd
  };

  const audited = await writeMa7Audit({
    operatorUserId: gate.auth.userId,
    organizationId: input.organizationId,
    action: "ma7.subscription.reactivate",
    entityType: "organization_subscriptions",
    entityId: input.organizationId,
    reason: reasonCheck.reason,
    correlationId,
    result: "success",
    previousState,
    resultingState,
    idempotencyKey: input.idempotencyKey ?? null
  });
  if (!audited.ok) {
    return {
      ok: false,
      code: "audit_failed",
      correlationId,
      message: "Lifecycle updated but audit write failed — verify Audit Log.",
      previousState,
      resultingState,
      organizationId: input.organizationId
    };
  }

  return {
    ok: true,
    code: "ok",
    correlationId,
    previousState,
    resultingState,
    organizationId: input.organizationId
  };
}

export function capacityMutationBlocked(): Ma7MutationResult {
  return {
    ok: false,
    code: "capacity_mutation_unavailable",
    message: CAPACITY_MUTATION_BLOCKER,
    correlationId: newCorrelationId()
  };
}
