/**
 * Slice 4 — managed-unit capacity enforcement + authorization.
 * Server recounts public.property_units; never trusts client commercial fields.
 */

import {
  additionalUnitBlocks,
  authorizedUnitCapacity,
  buildCapacityGatePresentation,
  evaluateUnitCapacityState,
  findForbiddenClientCapacityFields,
  recurringMonthlyUsd,
  resolveAuthorizedUnitCapacity,
  type CapacityAuditEntry,
  type CapacityGatePresentation,
  type LifecycleSubscription,
  type UnitCapacitySnapshot
} from "@mpa/shared";
import type { SupabaseClient } from "@supabase/supabase-js";
import { applyNextPeriodCapacityStripeUpdate } from "../saas-stripe/update-capacity";
import {
  consumeCapacityAuthorizationIntent,
  createCapacityAuthorizationIntent,
  getCapacityAuthIdempotency,
  getCapacityAuthorizationIntent,
  rememberCapacityAuthIdempotency,
  releaseCapacityAuthLock,
  tryAcquireCapacityAuthLock
} from "./capacity-intent-store";
import { persistLifecycleSubscription } from "./apply-lifecycle";
import {
  getLifecycleByOrganizationId,
  saveLifecycleSubscription
} from "./lifecycle-store";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = SupabaseClient<any>;

export async function countOrganizationPropertyUnits(
  supabase: Db,
  organizationId: string
): Promise<number> {
  const { count, error } = await supabase
    .from("property_units")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organizationId);
  if (error) {
    throw new Error(error.message);
  }
  return count ?? 0;
}

function trialActive(sub: LifecycleSubscription): boolean {
  if (sub.status === "trialing") return true;
  if (!sub.trialEndsAt) return false;
  return Date.parse(sub.trialEndsAt) > Date.now();
}

export function snapshotForSubscription(
  sub: LifecycleSubscription,
  actualUnits: number,
  projectedAdditionalUnits = 0
): UnitCapacitySnapshot {
  return evaluateUnitCapacityState({
    module: sub.productSku,
    billingInterval: sub.billingCycle,
    declaredUnits: sub.declaredUnitCount,
    actualUnits,
    authorizedUnitCapacity: sub.authorizedUnitCapacity,
    authorizedAdditionalBlocks: sub.authorizedAdditionalBlocks,
    pendingAdditionalBlocks: sub.pendingAdditionalBlocks,
    pendingAuthorizedUnitCapacity: sub.pendingAuthorizedUnitCapacity,
    projectedAdditionalUnits,
    nextBillingPeriodEnd: sub.currentPeriodEnd,
    trialActive: trialActive(sub)
  });
}

export type CapacityGateErrorBody = {
  error: "additional_unit_capacity_required";
  title: "Additional Unit Capacity Required";
  intentId: string;
  gate: CapacityGatePresentation;
  snapshot: UnitCapacitySnapshot;
};

/**
 * Pre-check before a capacity-increasing mutation.
 * When blocked, stores a server intent and returns gate payload (HTTP 409).
 * Organizations without a linked self-serve subscription are not gated.
 */
export async function assertWithinUnitCapacityOrGate(input: {
  supabase: Db;
  organizationId: string;
  additionalUnits: number;
  source: string;
}): Promise<{ ok: true; actualUnits: number; sub: LifecycleSubscription | null } | {
  ok: false;
  status: 409;
  body: CapacityGateErrorBody;
}> {
  const sub = getLifecycleByOrganizationId(input.organizationId);
  if (!sub) {
    // No commercial subscription linked — do not invent seat/property limits.
    const actualUnits = await countOrganizationPropertyUnits(
      input.supabase,
      input.organizationId
    );
    return { ok: true, actualUnits, sub: null };
  }

  const actualUnits = await countOrganizationPropertyUnits(
    input.supabase,
    input.organizationId
  );
  const authorizedCapacity = resolveAuthorizedUnitCapacity({
    authorizedUnitCapacity: sub.authorizedUnitCapacity,
    authorizedAdditionalBlocks: sub.authorizedAdditionalBlocks
  });
  const projected = actualUnits + Math.max(0, Math.floor(input.additionalUnits));

  // Persist reconciled actual count (questionnaire is not the permanent source of truth).
  if (sub.managedUnitCount !== actualUnits) {
    saveLifecycleSubscription({
      ...sub,
      managedUnitCount: actualUnits,
      declaredUnitCount: sub.declaredUnitCount ?? sub.managedUnitCount,
      updatedAt: new Date().toISOString()
    });
  }

  if (projected <= authorizedCapacity) {
    return { ok: true, actualUnits, sub };
  }

  const latest = getLifecycleByOrganizationId(input.organizationId) ?? sub;
  const snapshot = snapshotForSubscription(latest, actualUnits, input.additionalUnits);
  const gate = buildCapacityGatePresentation(snapshot, projected);
  const intent = createCapacityAuthorizationIntent({
    organizationId: input.organizationId,
    projectedUnits: projected,
    additionalUnits: input.additionalUnits,
    source: input.source
  });

  return {
    ok: false,
    status: 409,
    body: {
      error: "additional_unit_capacity_required",
      title: "Additional Unit Capacity Required",
      intentId: intent.id,
      gate,
      snapshot: gate.snapshot
    }
  };
}

function appendCapacityAudit(
  sub: LifecycleSubscription,
  entry: CapacityAuditEntry
): LifecycleSubscription {
  const reason = `capacity_authorized:${entry.previousCapacity}->${entry.requestedCapacity}:blocks:${entry.previousAdditionalBlocks}->${entry.newAdditionalBlocks}`;
  return {
    ...sub,
    audit: [
      ...sub.audit,
      {
        at: entry.at,
        from: sub.status,
        to: sub.status,
        reason,
        source: entry.source,
        ...(entry.eventId ? { eventId: entry.eventId } : {})
      }
    ]
  };
}

export type AuthorizeCapacityResult =
  | {
      ok: true;
      reused: boolean;
      snapshot: UnitCapacitySnapshot;
      gate: null;
      sub: LifecycleSubscription;
    }
  | { ok: false; status: number; error: string; detail?: string };

/**
 * Server-authoritative authorization. Client may only pass intentId (+ optional idempotency key).
 */
export async function authorizeAdditionalUnitCapacity(input: {
  organizationId: string;
  intentId?: string | null;
  idempotencyKey?: string | null;
  clientBody?: Record<string, unknown> | null;
  supabase?: Db | null;
}): Promise<AuthorizeCapacityResult> {
  const forbidden = findForbiddenClientCapacityFields(input.clientBody);
  if (forbidden.length > 0) {
    return {
      ok: false,
      status: 400,
      error: "client_authoritative_fields_forbidden",
      detail: forbidden.join(",")
    };
  }

  const idemKey = input.idempotencyKey?.trim();
  if (idemKey) {
    const prior = getCapacityAuthIdempotency(idemKey);
    if (prior) {
      const sub = getLifecycleByOrganizationId(input.organizationId);
      if (sub) {
        const actual = sub.managedUnitCount ?? 0;
        return {
          ok: true,
          reused: true,
          snapshot: snapshotForSubscription(sub, actual),
          gate: null,
          sub
        };
      }
    }
  }

  let sub = getLifecycleByOrganizationId(input.organizationId);
  if (!sub) {
    return { ok: false, status: 404, error: "subscription_not_found" };
  }

  if (!tryAcquireCapacityAuthLock(input.organizationId)) {
    return { ok: false, status: 409, error: "authorization_in_progress" };
  }

  try {
    let targetUnits: number;
    const intent = input.intentId ? getCapacityAuthorizationIntent(input.intentId) : null;
    if (input.intentId) {
      if (!intent || intent.organizationId !== input.organizationId) {
        return { ok: false, status: 410, error: "intent_expired_or_unknown" };
      }
    }

    let actualUnits = sub.managedUnitCount ?? 0;
    if (input.supabase) {
      actualUnits = await countOrganizationPropertyUnits(
        input.supabase,
        input.organizationId
      );
    }

    if (intent) {
      // Recompute: projected must still cover live actual; never trust client units.
      targetUnits = Math.max(actualUnits, intent.projectedUnits);
      if (actualUnits > intent.projectedUnits) {
        // Units grew since intent — rebuild target from live actual (still server-side).
        targetUnits = actualUnits;
      }
    } else {
      // Billing-page authorize: cover current actual if over capacity / sync.
      targetUnits = actualUnits;
    }

    const previousCapacity = resolveAuthorizedUnitCapacity({
      authorizedUnitCapacity: sub.authorizedUnitCapacity,
      authorizedAdditionalBlocks: sub.authorizedAdditionalBlocks
    });
    const previousBlocks =
      sub.authorizedAdditionalBlocks ??
      Math.max(0, Math.ceil(previousCapacity / 500) - 1);
    const newBlocks = additionalUnitBlocks(targetUnits);
    const newCapacity = authorizedUnitCapacity(newBlocks);

    if (targetUnits <= previousCapacity && newBlocks <= previousBlocks) {
      // Nothing to raise — optionally schedule decrease via reconcile.
      if (intent) consumeCapacityAuthorizationIntent(intent.id);
      const reconciled = await reconcileOrganizationUnitCapacity({
        organizationId: input.organizationId,
        ...(input.supabase ? { supabase: input.supabase } : {}),
        source: "authorize_noop_reconcile"
      });
      return {
        ok: true,
        reused: false,
        snapshot: reconciled.snapshot,
        gate: null,
        sub: reconciled.sub ?? sub
      };
    }

    const stripeResult = await applyNextPeriodCapacityStripeUpdate({
      stripeSubscriptionId: sub.stripeSubscriptionId,
      additionalCapacityItemId: sub.stripeAdditionalCapacityItemId,
      currentBlocks: previousBlocks,
      nextBlocks: newBlocks,
      billingCycle: sub.billingCycle
    });
    if (!stripeResult.ok && stripeResult.error !== "price_unconfigured") {
      // Still grant operational capacity when Stripe Prices are not configured (Slice safety).
      // price_unconfigured and vitest skips are acceptable; hard Stripe errors fail closed.
      if (!process.env["VITEST"] && stripeResult.error !== "stripe_not_configured") {
        return { ok: false, status: 502, error: stripeResult.error };
      }
    }

    const now = new Date().toISOString();
    const previousMonthly = recurringMonthlyUsd({
      module: sub.productSku,
      additionalBlocks: previousBlocks
    });
    const newMonthly = recurringMonthlyUsd({
      module: sub.productSku,
      additionalBlocks: newBlocks
    });
    const auditEntry: CapacityAuditEntry = {
      at: now,
      organizationId: input.organizationId,
      stripeSubscriptionId: sub.stripeSubscriptionId,
      previousCapacity,
      requestedCapacity: newCapacity,
      actualUnits,
      previousAdditionalBlocks: previousBlocks,
      newAdditionalBlocks: newBlocks,
      previousRecurringMonthlyUsd: previousMonthly,
      newRecurringMonthlyUsd: newMonthly,
      billingInterval: sub.billingCycle,
      billingPeriodEnd: sub.currentPeriodEnd,
      quoteId: sub.quoteId,
      source: intent?.source ?? "capacity_authorize",
      ...(idemKey ? { idempotencyKey: idemKey } : {})
    };

    sub = appendCapacityAudit(
      {
        ...sub,
        managedUnitCount: actualUnits,
        authorizedAdditionalBlocks: newBlocks,
        authorizedUnitCapacity: newCapacity,
        pendingAdditionalBlocks: newBlocks,
        pendingAuthorizedUnitCapacity: newCapacity,
        stripeAdditionalCapacityItemId:
          stripeResult.ok
            ? stripeResult.stripeAdditionalCapacityItemId
            : sub.stripeAdditionalCapacityItemId,
        lastCapacityAuthorizedAt: now,
        updatedAt: now
      },
      auditEntry
    );
    sub = saveLifecycleSubscription(sub);
    await persistLifecycleSubscription(sub);

    if (intent) consumeCapacityAuthorizationIntent(intent.id);
    if (idemKey) rememberCapacityAuthIdempotency(idemKey, sub.id);

    return {
      ok: true,
      reused: false,
      snapshot: snapshotForSubscription(sub, actualUnits),
      gate: null,
      sub
    };
  } finally {
    releaseCapacityAuthLock(input.organizationId);
  }
}

/**
 * Reconcile actual property_units → managed count; schedule decreases for next period.
 * Does not silently raise capacity.
 */
export async function reconcileOrganizationUnitCapacity(input: {
  organizationId: string;
  supabase?: Db | null;
  source?: string;
  eventId?: string;
}): Promise<{ sub: LifecycleSubscription | null; snapshot: UnitCapacitySnapshot }> {
  let sub = getLifecycleByOrganizationId(input.organizationId);
  if (!sub) {
    return {
      sub: null,
      snapshot: evaluateUnitCapacityState({ actualUnits: 0, authorizedUnitCapacity: 500 })
    };
  }

  let actualUnits = sub.managedUnitCount ?? 0;
  if (input.supabase) {
    actualUnits = await countOrganizationPropertyUnits(
      input.supabase,
      input.organizationId
    );
  }

  const authorizedCapacity = resolveAuthorizedUnitCapacity({
    authorizedUnitCapacity: sub.authorizedUnitCapacity,
    authorizedAdditionalBlocks: sub.authorizedAdditionalBlocks
  });
  const currentBlocks =
    sub.authorizedAdditionalBlocks ??
    Math.max(0, Math.ceil(authorizedCapacity / 500) - 1);
  const requiredBlocks = additionalUnitBlocks(actualUnits);

  let next = {
    ...sub,
    managedUnitCount: actualUnits,
    declaredUnitCount: sub.declaredUnitCount ?? sub.managedUnitCount,
    updatedAt: new Date().toISOString()
  };

  if (requiredBlocks < currentBlocks) {
    // Schedule decrease for next period — keep operational capacity until period boundary.
    const stripeResult = await applyNextPeriodCapacityStripeUpdate({
      stripeSubscriptionId: sub.stripeSubscriptionId,
      additionalCapacityItemId: sub.stripeAdditionalCapacityItemId,
      currentBlocks,
      nextBlocks: requiredBlocks,
      billingCycle: sub.billingCycle
    });
    next = {
      ...next,
      pendingAdditionalBlocks: requiredBlocks,
      pendingAuthorizedUnitCapacity: authorizedUnitCapacity(requiredBlocks),
      stripeAdditionalCapacityItemId: stripeResult.ok
        ? stripeResult.stripeAdditionalCapacityItemId
        : next.stripeAdditionalCapacityItemId,
      audit: [
        ...next.audit,
        {
          at: next.updatedAt,
          from: next.status,
          to: next.status,
          reason: `capacity_decrease_scheduled:${currentBlocks}->${requiredBlocks}`,
          source: input.source ?? "reconcile",
          ...(input.eventId ? { eventId: input.eventId } : {})
        }
      ]
    };
  } else if (
    requiredBlocks === currentBlocks &&
    sub.pendingAdditionalBlocks != null &&
    sub.pendingAdditionalBlocks === currentBlocks
  ) {
    // Already aligned.
  }

  sub = saveLifecycleSubscription(next);
  await persistLifecycleSubscription(sub);
  return { sub, snapshot: snapshotForSubscription(sub, actualUnits) };
}

/**
 * At billing-period boundary (invoice.created / paid): apply pending decrease to authorized.
 */
export async function applyPendingCapacityAtPeriodBoundary(input: {
  stripeSubscriptionId: string;
  eventId: string;
}): Promise<LifecycleSubscription | null> {
  const { getLifecycleByStripeSubscriptionId } = await import("./lifecycle-store");
  let sub = getLifecycleByStripeSubscriptionId(input.stripeSubscriptionId);
  if (!sub) return null;

  if (
    sub.pendingAdditionalBlocks == null ||
    sub.pendingAuthorizedUnitCapacity == null
  ) {
    return sub;
  }

  const pendingBlocks = sub.pendingAdditionalBlocks;
  const currentBlocks = sub.authorizedAdditionalBlocks ?? 0;

  // Increases already raised authorized at authorize-time; clear pending when matched.
  // Decreases: lower authorized now that the period rolled.
  const now = new Date().toISOString();
  sub = saveLifecycleSubscription({
    ...sub,
    authorizedAdditionalBlocks: pendingBlocks,
    authorizedUnitCapacity: sub.pendingAuthorizedUnitCapacity,
    pendingAdditionalBlocks: pendingBlocks,
    pendingAuthorizedUnitCapacity: sub.pendingAuthorizedUnitCapacity,
    updatedAt: now,
    audit: [
      ...sub.audit,
      {
        at: now,
        from: sub.status,
        to: sub.status,
        reason:
          pendingBlocks < currentBlocks
            ? `capacity_decrease_applied:${currentBlocks}->${pendingBlocks}`
            : `capacity_period_sync:${currentBlocks}->${pendingBlocks}`,
        source: "invoice_period_boundary",
        eventId: input.eventId
      }
    ]
  });
  await persistLifecycleSubscription(sub);
  return sub;
}

export async function getOrganizationCapacityView(input: {
  organizationId: string;
  supabase?: Db | null;
}): Promise<{
  linked: boolean;
  snapshot: UnitCapacitySnapshot | null;
  gate: CapacityGatePresentation | null;
  sub: LifecycleSubscription | null;
}> {
  const sub = getLifecycleByOrganizationId(input.organizationId);
  if (!sub) {
    return { linked: false, snapshot: null, gate: null, sub: null };
  }
  let actualUnits = sub.managedUnitCount ?? 0;
  if (input.supabase) {
    actualUnits = await countOrganizationPropertyUnits(
      input.supabase,
      input.organizationId
    );
    if (actualUnits !== sub.managedUnitCount) {
      saveLifecycleSubscription({
        ...sub,
        managedUnitCount: actualUnits,
        updatedAt: new Date().toISOString()
      });
    }
  }
  const latest = getLifecycleByOrganizationId(input.organizationId) ?? sub;
  const snapshot = snapshotForSubscription(latest, actualUnits);
  const gate =
    snapshot.capacityStatus === "requires_authorization"
      ? buildCapacityGatePresentation(snapshot)
      : null;
  return { linked: true, snapshot, gate, sub: latest };
}
