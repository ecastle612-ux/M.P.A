/**
 * FIN-003 Phase C — allocation + payout run + transfer execution.
 * OwnerPayoutService money-out surface. Phase D/E wire notify/remittance on outcomes.
 * Hardening: M1–M5 + Phase E remittance-at-paid (R-D2). No schedules.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@mpa/supabase";
import { createAuthServerComponentClient, createServiceRoleServerClient } from "../auth/server";
import {
  getConnectProvider,
  isFin003PhaseAEnabled,
  isFin003TransfersEnabled,
  resolveDefaultConnectProviderId
} from "../integrations/connect";
import { allocatePropertyCents, assertProfilePercentsValid } from "./allocation-math";
import { loadPropertyPeriodDistributable } from "./payout-input";
import {
  runTransferIntentCycle,
  type CycleAttempt,
  type CycleIntent,
  type CyclePersistence
} from "./transfer-intent-cycle";
import {
  computeLeaseExpiryIso,
  decideExecuteLeaseAction,
  EXECUTE_LEASE_TTL_MS,
  newExecuteLeaseToken
} from "./execute-lease";
import {
  claimBlockedByIntent,
  failedRunMaySupersede,
  runStatusBlocksNewClaim
} from "./transfer-safety";
import { notifyPmRunAttention, notifyTransferOutcome } from "./payout-notifications";
import { ensureRemittanceRecord } from "./projections";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

async function resolveClient(client?: SupabaseClient<Database>): Promise<AnyClient> {
  return client ?? (await createAuthServerComponentClient());
}

async function adminClient(): Promise<AnyClient> {
  return createServiceRoleServerClient() as AnyClient;
}

/** M4 — defense-in-depth: payout:manage inside service (not API-only). */
export async function assertActorPayoutManage(input: {
  organizationId: string;
  actorUserId: string;
  admin?: AnyClient;
}): Promise<void> {
  const admin = input.admin ?? (await adminClient());
  const { data: membership, error } = await admin
    .from("organization_memberships")
    .select("roles")
    .eq("organization_id", input.organizationId)
    .eq("user_id", input.actorUserId)
    .eq("status", "active")
    .maybeSingle();
  if (error) throw new Error(error.message);
  const roles = (membership?.roles ?? []) as string[];
  if (roles.length === 0) {
    throw new Error("FORBIDDEN: payout:manage required");
  }

  const { data: grants, error: grantsError } = await admin
    .from("role_permission_grants")
    .select("capability_key")
    .in("role", roles)
    .eq("capability_key", "payout:manage");
  if (grantsError) throw new Error(grantsError.message);

  const allowed = new Set((grants ?? []).map((g: { capability_key: string }) => g.capability_key));

  const { data: overrides } = await admin
    .from("organization_permission_overrides")
    .select("capability_key, effect")
    .eq("organization_id", input.organizationId)
    .in("role", roles)
    .eq("capability_key", "payout:manage");

  for (const row of overrides ?? []) {
    if (row.effect === "allow") allowed.add("payout:manage");
    if (row.effect === "deny") allowed.delete("payout:manage");
  }

  if (!allowed.has("payout:manage")) {
    throw new Error("FORBIDDEN: payout:manage required");
  }
}

/** M5 — every propertyId must belong to the executing organization. */
export async function assertPropertiesInOrganization(input: {
  organizationId: string;
  propertyIds: string[];
  admin?: AnyClient;
}): Promise<void> {
  const unique = [...new Set(input.propertyIds)];
  if (unique.length === 0) throw new Error("At least one property required");
  const admin = input.admin ?? (await adminClient());
  const { data, error } = await admin
    .from("properties")
    .select("id")
    .eq("organization_id", input.organizationId)
    .in("id", unique);
  if (error) throw new Error(error.message);
  const found = new Set((data ?? []).map((r: { id: string }) => r.id));
  const missing = unique.filter((id) => !found.has(id));
  if (missing.length > 0) {
    throw new Error(`Property not in organization: ${missing[0]}`);
  }
}

async function writeAudit(
  organizationId: string,
  entityType: string,
  entityId: string | null,
  eventType: string,
  summary: string,
  actorUserId: string | null | undefined,
  payload: Record<string, unknown>,
  client: AnyClient
): Promise<void> {
  await client.from("connect_audit_events").insert({
    organization_id: organizationId,
    entity_type: entityType,
    entity_id: entityId,
    event_type: eventType,
    summary,
    actor_user_id: actorUserId ?? null,
    payload: payload as Json
  });
}

export type AllocationProfileRow = {
  id: string;
  propertyId: string;
  ownerUserId: string;
  percent: number;
};

export async function listAllocationProfiles(input: {
  organizationId: string;
  propertyId: string;
  client?: SupabaseClient<Database>;
}): Promise<AllocationProfileRow[]> {
  const client = await resolveClient(input.client);
  const { data, error } = await client
    .from("allocation_profiles")
    .select("id, property_id, owner_user_id, percent")
    .eq("organization_id", input.organizationId)
    .eq("property_id", input.propertyId);
  if (error) throw new Error(error.message);
  return (data ?? []).map(
    (r: { id: string; property_id: string; owner_user_id: string; percent: number }) => ({
      id: r.id,
      propertyId: r.property_id,
      ownerUserId: r.owner_user_id,
      percent: Number(r.percent)
    })
  );
}

export async function upsertAllocationProfiles(input: {
  organizationId: string;
  propertyId: string;
  shares: Array<{ ownerUserId: string; percent: number }>;
  actorUserId: string;
  client?: SupabaseClient<Database>;
}): Promise<AllocationProfileRow[]> {
  assertProfilePercentsValid(input.shares.map((s) => s.percent));
  const admin = await adminClient();
  await assertActorPayoutManage({
    organizationId: input.organizationId,
    actorUserId: input.actorUserId,
    admin
  });
  await assertPropertiesInOrganization({
    organizationId: input.organizationId,
    propertyIds: [input.propertyId],
    admin
  });

  await admin
    .from("allocation_profiles")
    .delete()
    .eq("organization_id", input.organizationId)
    .eq("property_id", input.propertyId);

  const rows = input.shares.map((s) => ({
    organization_id: input.organizationId,
    property_id: input.propertyId,
    owner_user_id: s.ownerUserId,
    percent: s.percent,
    updated_at: new Date().toISOString()
  }));

  const { data, error } = await admin.from("allocation_profiles").insert(rows).select("*");
  if (error) throw new Error(error.message);

  await writeAudit(
    input.organizationId,
    "allocation_profile",
    input.propertyId,
    "allocation.profile.updated",
    `Allocation profile updated for property (${input.shares.length} owners)`,
    input.actorUserId,
    { propertyId: input.propertyId, shares: input.shares },
    admin
  );

  return (data ?? []).map(
    (r: { id: string; property_id: string; owner_user_id: string; percent: number }) => ({
      id: r.id,
      propertyId: r.property_id,
      ownerUserId: r.owner_user_id,
      percent: Number(r.percent)
    })
  );
}

/**
 * M1 — block new runs when claim is active OR any intent is paid/ambiguous.
 * Failed runs may supersede only when no transferred/ambiguous intents remain.
 */
async function assertNoActiveClaim(input: {
  organizationId: string;
  propertyId: string;
  periodStart: string;
  periodEnd: string;
  admin: AnyClient;
}): Promise<void> {
  const { data: blockingIntents } = await input.admin
    .from("transfer_intents")
    .select("id, status, external_transfer_id")
    .eq("organization_id", input.organizationId)
    .eq("property_id", input.propertyId)
    .eq("period_start", input.periodStart)
    .eq("period_end", input.periodEnd);

  for (const intent of blockingIntents ?? []) {
    if (claimBlockedByIntent(intent)) {
      throw new Error(
        `Blocking transfer intent ${intent.id} (${intent.status}) exists for property/period — reconcile before new run`
      );
    }
  }

  const { data: unknownAttempts } = await input.admin
    .from("payout_attempts")
    .select("id, transfer_intent_id, status")
    .eq("organization_id", input.organizationId)
    .eq("status", "unknown");

  for (const attempt of unknownAttempts ?? []) {
    const { data: intent } = await input.admin
      .from("transfer_intents")
      .select("id, property_id, period_start, period_end")
      .eq("id", attempt.transfer_intent_id)
      .maybeSingle();
    if (
      intent &&
      intent.property_id === input.propertyId &&
      intent.period_start === input.periodStart &&
      intent.period_end === input.periodEnd
    ) {
      throw new Error(
        `Unknown payout attempt ${attempt.id} blocks new run for property/period — reconcile first`
      );
    }
  }

  const { data: props } = await input.admin
    .from("payout_run_properties")
    .select("payout_run_id")
    .eq("organization_id", input.organizationId)
    .eq("property_id", input.propertyId)
    .eq("period_start", input.periodStart)
    .eq("period_end", input.periodEnd);

  for (const p of props ?? []) {
    const { data: run } = await input.admin
      .from("payout_runs")
      .select("id, status")
      .eq("id", p.payout_run_id)
      .maybeSingle();
    if (!run) continue;
    if (runStatusBlocksNewClaim(run.status)) {
      throw new Error(
        `Active or completed payout run exists for property/period (run ${run.id}, status ${run.status})`
      );
    }
    if (run.status === "failed") {
      const { data: runIntents } = await input.admin
        .from("transfer_intents")
        .select("status, external_transfer_id")
        .eq("payout_run_id", run.id);
      if (
        !failedRunMaySupersede({
          runStatus: run.status,
          intents: runIntents ?? []
        })
      ) {
        throw new Error(
          `Failed payout run ${run.id} still has transferred or ambiguous intents — reconcile before new run`
        );
      }
    }
  }
}

export type CreatePayoutRunResult = {
  runId: string;
  status: string;
  allocationCount: number;
  intentCount: number;
  skippedProperties: Array<{ propertyId: string; reason: string }>;
};

export async function createPayoutRun(input: {
  organizationId: string;
  propertyIds: string[];
  periodStart: string;
  periodEnd: string;
  actorUserId: string;
  client?: SupabaseClient<Database>;
}): Promise<CreatePayoutRunResult> {
  if (!isFin003PhaseAEnabled()) {
    throw new Error("FIN-003 Phase A is disabled");
  }
  if (input.propertyIds.length === 0) throw new Error("At least one property required");
  if (new Date(input.periodEnd) <= new Date(input.periodStart)) {
    throw new Error("periodEnd must be after periodStart");
  }

  const admin = await adminClient();
  await assertActorPayoutManage({
    organizationId: input.organizationId,
    actorUserId: input.actorUserId,
    admin
  });
  await assertPropertiesInOrganization({
    organizationId: input.organizationId,
    propertyIds: input.propertyIds,
    admin
  });

  const skippedProperties: Array<{ propertyId: string; reason: string }> = [];

  for (const propertyId of input.propertyIds) {
    await assertNoActiveClaim({
      organizationId: input.organizationId,
      propertyId,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      admin
    });
  }

  const { data: settlement } = await admin
    .from("connect_accounts")
    .select("*")
    .eq("organization_id", input.organizationId)
    .eq("purpose", "org_settlement")
    .maybeSingle();

  if (!settlement || settlement.status !== "eligible" || !settlement.charges_enabled) {
    throw new Error("Org settlement Connect account is not destination-ready / eligible");
  }

  const { data: run, error: runError } = await admin
    .from("payout_runs")
    .insert({
      organization_id: input.organizationId,
      status: "draft",
      period_start: input.periodStart,
      period_end: input.periodEnd,
      currency: "usd",
      created_by: input.actorUserId
    })
    .select("*")
    .single();
  if (runError) throw new Error(runError.message);

  let allocationCount = 0;
  let intentCount = 0;

  for (const propertyId of input.propertyIds) {
    await admin.from("payout_run_properties").insert({
      payout_run_id: run.id,
      organization_id: input.organizationId,
      property_id: propertyId,
      period_start: input.periodStart,
      period_end: input.periodEnd
    });

    const profiles = await listAllocationProfiles({
      organizationId: input.organizationId,
      propertyId,
      client: admin
    });
    if (profiles.length === 0) {
      skippedProperties.push({ propertyId, reason: "No allocation profile" });
      continue;
    }
    try {
      assertProfilePercentsValid(profiles.map((p) => p.percent));
    } catch (err) {
      skippedProperties.push({
        propertyId,
        reason: err instanceof Error ? err.message : "Invalid profile"
      });
      continue;
    }

    const distributable = await loadPropertyPeriodDistributable({
      organizationId: input.organizationId,
      propertyId,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      client: admin
    });

    if (distributable.incomplete) {
      skippedProperties.push({
        propertyId,
        reason: distributable.skipReason ?? "Incomplete payout facts"
      });
      continue;
    }
    if (distributable.distributableCents <= 0) {
      skippedProperties.push({ propertyId, reason: "No distributable destination corpus" });
      continue;
    }

    const shares = allocatePropertyCents({
      propertyDistributableCents: distributable.distributableCents,
      shares: profiles.map((p) => ({ ownerUserId: p.ownerUserId, percent: p.percent }))
    });

    for (const share of shares) {
      if (share.amountCents <= 0) continue;

      const { data: ownerAcct } = await admin
        .from("connect_accounts")
        .select("*")
        .eq("organization_id", input.organizationId)
        .eq("purpose", "owner")
        .eq("owner_user_id", share.ownerUserId)
        .maybeSingle();

      const { data: allocation, error: allocError } = await admin
        .from("payout_allocations")
        .insert({
          organization_id: input.organizationId,
          payout_run_id: run.id,
          property_id: propertyId,
          owner_user_id: share.ownerUserId,
          period_start: input.periodStart,
          period_end: input.periodEnd,
          split_percent: share.percent,
          property_distributable_cents: distributable.distributableCents,
          amount_cents: share.amountCents,
          currency: "usd",
          skip_reason:
            !ownerAcct || ownerAcct.status !== "eligible" || !ownerAcct.payouts_enabled
              ? "Owner Connect not eligible"
              : null
        })
        .select("*")
        .single();
      if (allocError) throw new Error(allocError.message);
      allocationCount += 1;

      const eligible =
        ownerAcct &&
        ownerAcct.status === "eligible" &&
        ownerAcct.payouts_enabled &&
        share.amountCents > 0;

      await admin.from("transfer_intents").insert({
        organization_id: input.organizationId,
        payout_run_id: run.id,
        allocation_id: allocation.id,
        property_id: propertyId,
        owner_user_id: share.ownerUserId,
        period_start: input.periodStart,
        period_end: input.periodEnd,
        amount_cents: share.amountCents,
        currency: "usd",
        source_settlement_account_id: settlement.external_account_id,
        destination_owner_account_id: ownerAcct?.external_account_id ?? "missing",
        status: eligible ? "eligible" : "skipped",
        skip_reason: eligible ? null : "Owner Connect not eligible"
      });
      if (eligible) intentCount += 1;
    }

    await writeAudit(
      input.organizationId,
      "payout_run",
      run.id,
      "allocation.computed",
      `Allocations computed for property ${propertyId}`,
      input.actorUserId,
      {
        propertyId,
        distributableCents: distributable.distributableCents,
        shareCount: shares.length
      },
      admin
    );
  }

  await admin
    .from("payout_runs")
    .update({ status: "queued", updated_at: new Date().toISOString() })
    .eq("id", run.id);

  await writeAudit(
    input.organizationId,
    "payout_run",
    run.id,
    "payout_run.created",
    `Payout run created (${intentCount} eligible intents)`,
    input.actorUserId,
    {
      propertyIds: input.propertyIds,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      intentCount,
      skippedProperties
    },
    admin
  );

  return {
    runId: run.id,
    status: "queued",
    allocationCount,
    intentCount,
    skippedProperties
  };
}

export type ExecutePayoutRunResult = {
  runId: string;
  status: string;
  succeeded: number;
  failed: number;
  skipped: number;
  needsReconcile: number;
  blockedReason: string | null;
};

function buildCyclePersistence(
  admin: AnyClient,
  organizationId: string,
  intentId: string,
  actorUserId: string
): CyclePersistence {
  return {
    async markIntentPaid(externalTransferId) {
      await admin
        .from("transfer_intents")
        .update({
          status: "paid",
          external_transfer_id: externalTransferId,
          failure_reason: null,
          updated_at: new Date().toISOString()
        })
        .eq("id", intentId);
      await writeAudit(
        organizationId,
        "transfer_intent",
        intentId,
        "transfer_intent.succeeded",
        `Transfer ${externalTransferId} succeeded`,
        actorUserId,
        { externalTransferId },
        admin
      );
      // R-D2 — remittance at paid persistence boundary (independent of notify success)
      await ensureRemittanceRecord({
        organizationId,
        transferIntentId: intentId
      }).catch((err) => {
        console.error("[FIN-003 Phase E] remittance-at-paid failed", err);
      });
    },
    async markIntentFailed(reason) {
      await admin
        .from("transfer_intents")
        .update({
          status: "failed",
          failure_reason: reason,
          updated_at: new Date().toISOString()
        })
        .eq("id", intentId);
      await writeAudit(
        organizationId,
        "transfer_intent",
        intentId,
        "transfer_intent.failed",
        reason,
        actorUserId,
        {},
        admin
      );
    },
    async markIntentNeedsReconcile(reason) {
      await admin
        .from("transfer_intents")
        .update({
          status: "needs_reconcile",
          failure_reason: reason,
          updated_at: new Date().toISOString()
        })
        .eq("id", intentId);
      await writeAudit(
        organizationId,
        "transfer_intent",
        intentId,
        "transfer_intent.needs_reconcile",
        reason,
        actorUserId,
        {},
        admin
      );
    },
    async markIntentEligibleForRetry(reason) {
      await admin
        .from("transfer_intents")
        .update({
          status: "eligible",
          failure_reason: reason,
          external_transfer_id: null,
          updated_at: new Date().toISOString()
        })
        .eq("id", intentId);
    },
    async markIntentSkipped(reason) {
      await admin
        .from("transfer_intents")
        .update({
          status: "skipped",
          skip_reason: reason,
          updated_at: new Date().toISOString()
        })
        .eq("id", intentId);
    },
    async markIntentExecuting() {
      await admin
        .from("transfer_intents")
        .update({ status: "executing", updated_at: new Date().toISOString() })
        .eq("id", intentId);
    },
    async insertAttempt({ attemptNumber, idempotencyKey }) {
      const { data, error } = await admin
        .from("payout_attempts")
        .insert({
          organization_id: organizationId,
          transfer_intent_id: intentId,
          attempt_number: attemptNumber,
          idempotency_key: idempotencyKey,
          status: "created"
        })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      return { id: data.id as string };
    },
    async updateAttempt(attemptId, patch) {
      await admin
        .from("payout_attempts")
        .update({
          status: patch.status,
          external_transfer_id: patch.external_transfer_id ?? undefined,
          error_message: patch.error_message ?? undefined,
          updated_at: new Date().toISOString()
        })
        .eq("id", attemptId);
    }
  };
}

export async function executePayoutRun(input: {
  organizationId: string;
  runId: string;
  actorUserId: string;
  client?: SupabaseClient<Database>;
}): Promise<ExecutePayoutRunResult> {
  if (!isFin003PhaseAEnabled()) throw new Error("FIN-003 Phase A is disabled");
  if (!isFin003TransfersEnabled()) {
    throw new Error("FIN003_TRANSFERS_ENABLED is off — money-out kill switch engaged");
  }

  const admin = await adminClient();
  await assertActorPayoutManage({
    organizationId: input.organizationId,
    actorUserId: input.actorUserId,
    admin
  });

  const { data: run, error } = await admin
    .from("payout_runs")
    .select("*")
    .eq("id", input.runId)
    .eq("organization_id", input.organizationId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!run) throw new Error("Payout run not found");

  const nowMs = Date.now();
  const leaseDecision = decideExecuteLeaseAction({
    status: run.status,
    leaseExpiresAt: run.execute_lease_expires_at ?? null,
    nowMs
  });
  if (leaseDecision === "deny") {
    throw new Error(
      run.status === "running"
        ? "Execute lease held by another worker — retry after lease expiry"
        : `Run status ${run.status} is not executable`
    );
  }

  // M5 — properties on the run must belong to org
  const { data: runProps } = await admin
    .from("payout_run_properties")
    .select("property_id")
    .eq("payout_run_id", run.id)
    .eq("organization_id", input.organizationId);
  const runPropertyIds = (runProps ?? []).map((p: { property_id: string }) => p.property_id);
  if (runPropertyIds.length > 0) {
    await assertPropertiesInOrganization({
      organizationId: input.organizationId,
      propertyIds: runPropertyIds,
      admin
    });
  }

  const { data: allIntents } = await admin
    .from("transfer_intents")
    .select("*")
    .eq("payout_run_id", run.id)
    .eq("organization_id", input.organizationId);

  const workIntents = (allIntents ?? []).filter((i: { status: string }) =>
    ["eligible", "failed", "needs_reconcile", "executing"].includes(i.status)
  );

  const sumCents = workIntents
    .filter((i: { status: string }) => i.status === "eligible" || i.status === "failed")
    .reduce((s: number, i: { amount_cents: number }) => s + i.amount_cents, 0);

  const providerId = resolveDefaultConnectProviderId();
  const provider = getConnectProvider(providerId === "noop" ? "noop" : undefined);

  const settlementId =
    workIntents[0]?.source_settlement_account_id ??
    (
      await admin
        .from("connect_accounts")
        .select("external_account_id")
        .eq("organization_id", input.organizationId)
        .eq("purpose", "org_settlement")
        .maybeSingle()
    ).data?.external_account_id;

  if (!settlementId) throw new Error("Missing org settlement account");

  const { data: settlementRow } = await admin
    .from("connect_accounts")
    .select("*")
    .eq("organization_id", input.organizationId)
    .eq("purpose", "org_settlement")
    .eq("external_account_id", settlementId)
    .maybeSingle();
  if (!settlementRow) throw new Error("Settlement account ownership check failed");

  let balance;
  try {
    balance = await provider.getBalance(settlementId);
  } catch (err) {
    throw new Error(
      `Balance preflight failed: ${err instanceof Error ? err.message : "unknown"}`
    );
  }

  if (sumCents > balance.availableCents) {
    await admin
      .from("payout_runs")
      .update({
        status: "failed",
        failure_reason: "Insufficient settlement available balance for batch",
        preflight_available_cents: balance.availableCents,
        preflight_sum_cents: sumCents,
        execute_lease_token: null,
        execute_lease_expires_at: null,
        updated_at: new Date().toISOString()
      })
      .eq("id", run.id);

    await writeAudit(
      input.organizationId,
      "payout_run",
      run.id,
      "payout_run.preflight_blocked",
      "Batch balance preflight failed",
      input.actorUserId,
      { availableCents: balance.availableCents, sumCents },
      admin
    );

    return {
      runId: run.id,
      status: "failed",
      succeeded: 0,
      failed: 0,
      skipped: 0,
      needsReconcile: 0,
      blockedReason: "Insufficient settlement available balance for batch"
    };
  }

  // R-C1 — exclusive execute lease (Postgres row lock serializes concurrent UPDATEs)
  const leaseToken = newExecuteLeaseToken();
  const leaseExpiresAt = computeLeaseExpiryIso(nowMs, EXECUTE_LEASE_TTL_MS);
  const leasePatch = {
    status: "running" as const,
    started_at: run.started_at ?? new Date(nowMs).toISOString(),
    preflight_available_cents: balance.availableCents,
    preflight_sum_cents: sumCents,
    execute_lease_token: leaseToken,
    execute_lease_expires_at: leaseExpiresAt,
    updated_at: new Date(nowMs).toISOString()
  };

  let claimed: { id: string; execute_lease_token: string | null } | null = null;
  if (leaseDecision === "acquire") {
    const { data, error: claimError } = await admin
      .from("payout_runs")
      .update(leasePatch)
      .eq("id", run.id)
      .eq("organization_id", input.organizationId)
      .in("status", ["queued", "partial", "failed"])
      .select("id, execute_lease_token")
      .maybeSingle();
    if (claimError) throw new Error(claimError.message);
    claimed = data;
  } else {
    // steal: only when running AND lease expired/null (crash recovery).
    // Row lock + expiry predicate ⇒ second concurrent stealer sees live lease and loses.
    const nowIso = new Date(nowMs).toISOString();
    const { data, error: stealError } = await admin
      .from("payout_runs")
      .update(leasePatch)
      .eq("id", run.id)
      .eq("organization_id", input.organizationId)
      .eq("status", "running")
      .or(`execute_lease_expires_at.is.null,execute_lease_expires_at.lte."${nowIso}"`)
      .select("id, execute_lease_token")
      .maybeSingle();
    if (stealError) throw new Error(stealError.message);
    claimed = data;
  }

  if (!claimed || claimed.execute_lease_token !== leaseToken) {
    throw new Error("Execute lease not acquired — another worker holds authority");
  }

  await writeAudit(
    input.organizationId,
    "payout_run",
    run.id,
    "payout_run.started",
    leaseDecision === "steal"
      ? "Payout run execute recovered via expired lease steal"
      : "Payout run execute started with exclusive lease",
    input.actorUserId,
    { intentCount: workIntents.length, sumCents, leaseDecision },
    admin
  );

  const renewLease = async () => {
    const renewMs = Date.now();
    const { data: renewed, error: renewError } = await admin
      .from("payout_runs")
      .update({
        execute_lease_expires_at: computeLeaseExpiryIso(renewMs, EXECUTE_LEASE_TTL_MS),
        updated_at: new Date(renewMs).toISOString()
      })
      .eq("id", run.id)
      .eq("organization_id", input.organizationId)
      .eq("execute_lease_token", leaseToken)
      .eq("status", "running")
      .select("id")
      .maybeSingle();
    if (renewError) throw new Error(renewError.message);
    if (!renewed) {
      throw new Error("Execute lease lost — aborting to avoid parallel transfers");
    }
  };

  let succeeded = 0;
  let failed = 0;
  let needsReconcile = 0;
  let skipped = (allIntents ?? []).filter((i: { status: string }) => i.status === "skipped")
    .length;

  for (const intent of workIntents) {
    await renewLease();

    const { data: dest } = await admin
      .from("connect_accounts")
      .select("*")
      .eq("organization_id", input.organizationId)
      .eq("purpose", "owner")
      .eq("owner_user_id", intent.owner_user_id)
      .eq("external_account_id", intent.destination_owner_account_id)
      .maybeSingle();

    if (
      (!dest || dest.status !== "eligible") &&
      intent.status !== "needs_reconcile" &&
      intent.status !== "executing"
    ) {
      await admin
        .from("transfer_intents")
        .update({
          status: "skipped",
          skip_reason: "Owner Connect not eligible at execute",
          updated_at: new Date().toISOString()
        })
        .eq("id", intent.id);
      skipped += 1;
      continue;
    }

    const { data: priorAttempts } = await admin
      .from("payout_attempts")
      .select("id, attempt_number, idempotency_key, status, external_transfer_id")
      .eq("transfer_intent_id", intent.id)
      .order("attempt_number", { ascending: false })
      .limit(1);

    const lastRow = priorAttempts?.[0] ?? null;
    const lastAttempt: CycleAttempt | null = lastRow
      ? {
          id: lastRow.id,
          attempt_number: Number(lastRow.attempt_number),
          idempotency_key: lastRow.idempotency_key,
          status: lastRow.status,
          external_transfer_id: lastRow.external_transfer_id
        }
      : null;

    const cycleIntent: CycleIntent = {
      id: intent.id,
      status: intent.status,
      amount_cents: intent.amount_cents,
      currency: intent.currency,
      source_settlement_account_id: intent.source_settlement_account_id,
      destination_owner_account_id: intent.destination_owner_account_id,
      external_transfer_id: intent.external_transfer_id,
      owner_user_id: intent.owner_user_id,
      property_id: intent.property_id,
      period_start: intent.period_start,
      period_end: intent.period_end
    };

    const result = await runTransferIntentCycle({
      intent: cycleIntent,
      lastAttempt,
      provider,
      organizationId: input.organizationId,
      payoutRunId: run.id,
      loadDistributable: async () => {
        // M2 — fresh distributable immediately before create (inside cycle)
        const d = await loadPropertyPeriodDistributable({
          organizationId: input.organizationId,
          propertyId: intent.property_id,
          periodStart: intent.period_start,
          periodEnd: intent.period_end,
          client: admin
        });
        // Exclude this intent from "already transferred" when it is still eligible/failed
        // (not yet counted as moved). loadPropertyPeriodDistributable already omits those.
        return {
          distributableCents: d.distributableCents,
          incomplete: d.incomplete
        };
      },
      persist: buildCyclePersistence(admin, input.organizationId, intent.id, input.actorUserId)
    });

    if (result.outcome === "succeeded") {
      succeeded += 1;
      await notifyTransferOutcome({
        organizationId: input.organizationId,
        transferIntentId: intent.id,
        outcome: "paid"
      }).catch((err) => {
        console.error("[FIN-003 Phase D] paid notify failed", err);
      });
    } else if (result.outcome === "failed") {
      failed += 1;
      await notifyTransferOutcome({
        organizationId: input.organizationId,
        transferIntentId: intent.id,
        outcome: "failed"
      }).catch((err) => {
        console.error("[FIN-003 Phase D] failed notify failed", err);
      });
    } else if (result.outcome === "needs_reconcile") needsReconcile += 1;
    else skipped += 1;
  }

  // M1: needs_reconcile ⇒ partial (never clean failed) so period claim stays blocked
  const finalStatus =
    needsReconcile > 0
      ? "partial"
      : succeeded > 0 && (failed > 0 || skipped > 0)
        ? "partial"
        : failed > 0 && succeeded === 0
          ? "failed"
          : succeeded > 0
            ? "succeeded"
            : "failed";

  await admin
    .from("payout_runs")
    .update({
      status: finalStatus,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      execute_lease_token: null,
      execute_lease_expires_at: null,
      failure_reason:
        needsReconcile > 0
          ? "One or more transfers need reconcile — do not supersede period"
          : null
    })
    .eq("id", run.id)
    .eq("execute_lease_token", leaseToken);

  await writeAudit(
    input.organizationId,
    "payout_run",
    run.id,
    "payout_run.completed",
    `Payout run completed with status ${finalStatus}`,
    input.actorUserId,
    { succeeded, failed, skipped, needsReconcile },
    admin
  );

  await notifyPmRunAttention({
    organizationId: input.organizationId,
    payoutRunId: run.id,
    actorUserId: input.actorUserId,
    failedCount: failed,
    needsReconcileCount: needsReconcile
  }).catch((err) => {
    console.error("[FIN-003 Phase D] PM run attention notify failed", err);
  });

  return {
    runId: run.id,
    status: finalStatus,
    succeeded,
    failed,
    skipped,
    needsReconcile,
    blockedReason: null
  };
}

export async function applyTransferWebhookEvents(
  providerId: string,
  payload: unknown,
  headers: Record<string, string>
): Promise<{ processed: number; ignored: number; duplicate: boolean }> {
  if (!isFin003PhaseAEnabled()) {
    return { processed: 0, ignored: 0, duplicate: false };
  }

  const provider = getConnectProvider(providerId);
  const events = await provider.parseTransferWebhook(payload, headers);
  const admin = await adminClient();
  let processed = 0;
  let ignored = 0;
  let duplicate = false;

  for (const event of events) {
    const { data: existing } = await admin
      .from("connect_webhook_events")
      .select("id")
      .eq("provider", provider.id)
      .eq("external_event_id", event.externalEventId)
      .maybeSingle();
    if (existing) {
      duplicate = true;
      continue;
    }

    const { data: stored, error: storeError } = await admin
      .from("connect_webhook_events")
      .insert({
        provider: provider.id,
        external_event_id: event.externalEventId,
        event_type: event.type,
        payload: (payload ?? {}) as Json,
        status: event.ignored || event.type === "ignored" ? "ignored" : "received"
      })
      .select("id")
      .single();
    if (storeError) throw new Error(storeError.message);

    if (event.ignored || event.type === "ignored" || !event.externalTransferId) {
      ignored += 1;
      await admin
        .from("connect_webhook_events")
        .update({ status: "ignored", processed_at: new Date().toISOString() })
        .eq("id", stored.id);
      continue;
    }

    const meta = event.metadata ?? {};
    const intentId =
      typeof meta["transfer_intent_id"] === "string" ? meta["transfer_intent_id"] : null;

    let intent = null;
    if (intentId) {
      const { data } = await admin
        .from("transfer_intents")
        .select("*")
        .eq("id", intentId)
        .maybeSingle();
      intent = data;
    }
    if (!intent) {
      const { data } = await admin
        .from("transfer_intents")
        .select("*")
        .eq("external_transfer_id", event.externalTransferId)
        .maybeSingle();
      intent = data;
    }

    if (!intent) {
      ignored += 1;
      await admin
        .from("connect_webhook_events")
        .update({ status: "ignored", processed_at: new Date().toISOString() })
        .eq("id", stored.id);
      continue;
    }

    const nextStatus =
      event.type === "transfer_failed" || event.type === "transfer_reversed"
        ? "failed"
        : event.type === "transfer_created" || event.type === "transfer_updated"
          ? "paid"
          : intent.status;

    await admin
      .from("transfer_intents")
      .update({
        status: nextStatus,
        external_transfer_id: event.externalTransferId,
        failure_reason:
          event.type === "transfer_failed" || event.type === "transfer_reversed"
            ? event.message ?? event.type
            : intent.failure_reason,
        updated_at: new Date().toISOString()
      })
      .eq("id", intent.id);

    await admin
      .from("connect_webhook_events")
      .update({
        status: "processed",
        organization_id: intent.organization_id,
        processed_at: new Date().toISOString()
      })
      .eq("id", stored.id);

    await writeAudit(
      intent.organization_id,
      "transfer_intent",
      intent.id,
      "transfer_intent.webhook_applied",
      `Transfer webhook ${event.type} applied`,
      null,
      {
        externalTransferId: event.externalTransferId,
        eventType: event.type,
        status: nextStatus
      },
      admin
    );

    // R-D2 — remittance when webhook marks paid (before notify)
    if (nextStatus === "paid") {
      await ensureRemittanceRecord({
        organizationId: intent.organization_id as string,
        transferIntentId: intent.id as string
      }).catch((err) => {
        console.error("[FIN-003 Phase E] webhook remittance-at-paid failed", err);
      });
    }

    // Phase D/E — idempotent paid/failed (+ remittance) notifications
    if (nextStatus === "paid" || nextStatus === "failed") {
      await notifyTransferOutcome({
        organizationId: intent.organization_id as string,
        transferIntentId: intent.id as string,
        outcome: nextStatus === "paid" ? "paid" : "failed"
      }).catch((err) => {
        console.error("[FIN-003 Phase E] webhook notify failed", err);
      });
    }

    processed += 1;
  }

  return { processed, ignored, duplicate };
}

export async function getPayoutRun(input: {
  organizationId: string;
  runId: string;
  client?: SupabaseClient<Database>;
}): Promise<{
  run: Record<string, unknown>;
  intents: Record<string, unknown>[];
  allocations: Record<string, unknown>[];
}> {
  const client = await resolveClient(input.client);
  const { data: run, error } = await client
    .from("payout_runs")
    .select("*")
    .eq("id", input.runId)
    .eq("organization_id", input.organizationId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!run) throw new Error("Payout run not found");

  const { data: intents } = await client
    .from("transfer_intents")
    .select("*")
    .eq("payout_run_id", input.runId);
  const { data: allocations } = await client
    .from("payout_allocations")
    .select("*")
    .eq("payout_run_id", input.runId);

  return {
    run: run as Record<string, unknown>,
    intents: (intents ?? []) as Record<string, unknown>[],
    allocations: (allocations ?? []) as Record<string, unknown>[]
  };
}
