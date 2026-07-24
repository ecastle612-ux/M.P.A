/**
 * PAY-001 Slice 1 — SettlementFundingService.
 * Resolves destination routing, persists mappings, emits funding audit events.
 * Does not call createTransfer or implement refund/dispute automation.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@mpa/supabase";
import { createAuthServerComponentClient, createServiceRoleServerClient } from "../auth/server";
import {
  canApplyLiveDestinationCharges,
  evaluateDestinationProviderCapability
} from "./capability";
import { computeApplicationFeeAmountCents } from "./fees";
import { isPay001DestinationFundingEnvEnabled } from "./flags";
import {
  evaluateSettlementReadiness,
  failedCheckIds,
  type OrgSettlementAccountMirror
} from "./readiness";
import type {
  OrgSettlementFundingSettings,
  PaymentSettlementMappingInput,
  PaymentSettlementMappingRecord,
  SettlementFundingDecision,
  SettlementReadinessResult
} from "./contracts";

// Tables may not yet be in generated Database types.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FundingClient = any;

async function resolveClient(client?: SupabaseClient<Database>): Promise<FundingClient> {
  return client ?? (await createAuthServerComponentClient());
}

async function adminClient(): Promise<FundingClient> {
  return createServiceRoleServerClient() as FundingClient;
}

function defaultSettings(organizationId: string): OrgSettlementFundingSettings {
  return {
    organizationId,
    destinationEnrolled: false,
    fundingEnabled: false,
    feeBps: 0,
    feeFlatCents: 0,
    metadata: {}
  };
}

function mapSettings(row: Record<string, unknown>): OrgSettlementFundingSettings {
  return {
    organizationId: String(row["organization_id"]),
    destinationEnrolled: Boolean(row["destination_enrolled"]),
    fundingEnabled: Boolean(row["funding_enabled"]),
    feeBps: Number(row["fee_bps"] ?? 0),
    feeFlatCents: Number(row["fee_flat_cents"] ?? 0),
    metadata:
      row["metadata"] && typeof row["metadata"] === "object"
        ? (row["metadata"] as Record<string, unknown>)
        : {}
  };
}

function mapAccount(row: Record<string, unknown>): OrgSettlementAccountMirror {
  const currentlyDue = Array.isArray(row["currently_due"])
    ? (row["currently_due"] as unknown[]).map(String)
    : [];
  const pastDue = Array.isArray(row["past_due"])
    ? (row["past_due"] as unknown[]).map(String)
    : [];
  return {
    id: String(row["id"]),
    organizationId: String(row["organization_id"]),
    purpose: row["purpose"] === "owner" ? "owner" : "org_settlement",
    externalAccountId: String(row["external_account_id"] ?? ""),
    status: String(row["status"] ?? "not_started"),
    chargesEnabled: Boolean(row["charges_enabled"]),
    currentlyDue,
    pastDue,
    disabledReason: (row["disabled_reason"] as string | null) ?? null
  };
}

export async function getOrgSettlementFundingSettings(
  organizationId: string,
  client?: SupabaseClient<Database>
): Promise<OrgSettlementFundingSettings> {
  const db = await resolveClient(client);
  const { data } = await db
    .from("org_settlement_funding_settings")
    .select("*")
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (!data) return defaultSettings(organizationId);
  return mapSettings(data as Record<string, unknown>);
}

export async function upsertOrgSettlementFundingSettings(
  input: {
    organizationId: string;
    destinationEnrolled: boolean;
    fundingEnabled: boolean;
    feeBps?: number;
    feeFlatCents?: number;
    actorUserId?: string | null;
    metadata?: Record<string, unknown>;
  },
  client?: SupabaseClient<Database>
): Promise<OrgSettlementFundingSettings> {
  const db = await resolveClient(client);
  const previous = await getOrgSettlementFundingSettings(input.organizationId, db);
  const { data, error } = await db
    .from("org_settlement_funding_settings")
    .upsert(
      {
        organization_id: input.organizationId,
        destination_enrolled: input.destinationEnrolled,
        funding_enabled: input.fundingEnabled,
        fee_bps: input.feeBps ?? previous.feeBps,
        fee_flat_cents: input.feeFlatCents ?? previous.feeFlatCents,
        metadata: (input.metadata ?? previous.metadata) as Json,
        updated_at: new Date().toISOString()
      },
      { onConflict: "organization_id" }
    )
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  const next = mapSettings(data as Record<string, unknown>);
  if (
    previous.destinationEnrolled !== next.destinationEnrolled ||
    previous.fundingEnabled !== next.fundingEnabled
  ) {
    await writeFundingAudit({
      organizationId: input.organizationId,
      entityType: "org_settlement_funding_settings",
      entityId: input.organizationId,
      eventType: "funding.kill_switch.changed",
      summary: `Destination funding enrollment/funding updated (enrolled=${next.destinationEnrolled}, enabled=${next.fundingEnabled})`,
      actorUserId: input.actorUserId ?? null,
      payload: {
        previous: {
          destinationEnrolled: previous.destinationEnrolled,
          fundingEnabled: previous.fundingEnabled
        },
        next: {
          destinationEnrolled: next.destinationEnrolled,
          fundingEnabled: next.fundingEnabled
        },
        envFundingEnabled: isPay001DestinationFundingEnvEnabled()
      },
      client: db
    });
  }
  return next;
}

export async function loadOrgSettlementAccountMirror(
  organizationId: string,
  client?: SupabaseClient<Database>
): Promise<OrgSettlementAccountMirror | null> {
  const db = await resolveClient(client);
  const { data } = await db
    .from("connect_accounts")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("purpose", "org_settlement")
    .maybeSingle();
  if (!data) return null;
  return mapAccount(data as Record<string, unknown>);
}

/**
 * Resolve PAY-001 create-charge routing for an organization.
 * Enrolled + not ready / funding off → hard block (no legacy fallback).
 * Not enrolled → legacy_platform coexistence.
 */
export async function resolveSettlementFundingDecision(input: {
  organizationId: string;
  chargeAmountCents: number;
  proposedDestinationAccountId?: string | null;
  /** Defaults to PAYMENT_PROVIDER env — used for C1/C2 live destination lock */
  providerId?: string;
  client?: SupabaseClient<Database>;
}): Promise<SettlementFundingDecision> {
  const db = await resolveClient(input.client);
  const settings = await getOrgSettlementFundingSettings(input.organizationId, db);
  const account = await loadOrgSettlementAccountMirror(input.organizationId, db);

  if (!settings.destinationEnrolled) {
    return {
      kind: "legacy_platform",
      fundingMode: "legacy_platform",
      reason: "not_enrolled"
    };
  }

  const readiness = evaluateSettlementReadiness({
    organizationId: input.organizationId,
    destinationEnrolled: settings.destinationEnrolled,
    fundingEnabled: settings.fundingEnabled,
    account,
    ...(input.proposedDestinationAccountId !== undefined
      ? { proposedDestinationAccountId: input.proposedDestinationAccountId }
      : {})
  });

  if (!readiness.ready) {
    const failed = failedCheckIds(readiness);
    let code: Extract<SettlementFundingDecision, { kind: "blocked" }>["code"] =
      "settlement_not_ready";
    if (failed.includes("S6")) code = "funding_env_disabled";
    else if (failed.includes("S7")) code = "funding_org_disabled";
    else if (failed.includes("S8")) code = "cross_org_destination_forbidden";

    return {
      kind: "blocked",
      code,
      message: hardBlockMessage(code, failed),
      readiness
    };
  }

  // C1/C2: enrolled + ready still hard-blocks when provider cannot apply transfer_data.
  const capability = evaluateDestinationProviderCapability(input.providerId);
  if (!capability.capable) {
    return {
      kind: "blocked",
      code: "destination_provider_incapable",
      message: hardBlockMessage("destination_provider_incapable", [], capability.reason),
      readiness
    };
  }

  const fee = computeApplicationFeeAmountCents({
    chargeAmountCents: input.chargeAmountCents,
    feeBps: settings.feeBps,
    feeFlatCents: settings.feeFlatCents
  });

  return {
    kind: "destination",
    fundingMode: "destination",
    settlementExternalAccountId: readiness.settlementExternalAccountId as string,
    connectAccountId: readiness.connectAccountId,
    applicationFeeAmountCents: fee,
    readiness
  };
}

function hardBlockMessage(
  code: Extract<SettlementFundingDecision, { kind: "blocked" }>["code"],
  failed: string[],
  detail?: string | null
): string {
  switch (code) {
    case "funding_env_disabled":
      return "Destination settlement funding is disabled platform-wide. Checkout is blocked for enrolled organizations (no platform fallback).";
    case "funding_org_disabled":
      return "Destination settlement funding is disabled for this organization. Checkout is blocked (no platform fallback).";
    case "cross_org_destination_forbidden":
      return "Settlement destination does not match this organization's settlement account.";
    case "destination_provider_incapable":
      return `Destination settlement funding requires live Stripe (PAYMENT_PROVIDER=stripe + STRIPE_SECRET_KEY + PAY001_DESTINATION_FUNDING_ENABLED).${
        detail ? ` ${detail}` : ""
      } Checkout is blocked for enrolled organizations (no platform fallback; no fictional destination books).`;
    default:
      return `Organization settlement is not ready for destination charges (${failed.join(", ")}). Checkout is blocked (no platform fallback).`;
  }
}

export async function writeFundingAudit(input: {
  organizationId: string;
  entityType: string;
  entityId: string | null;
  eventType: string;
  summary: string;
  actorUserId: string | null;
  payload: Record<string, unknown>;
  client?: FundingClient;
}): Promise<void> {
  const db = input.client ?? (await adminClient());
  await db.from("billing_audit_events").insert({
    organization_id: input.organizationId,
    entity_type: input.entityType,
    entity_id: input.entityId,
    event_type: input.eventType,
    summary: input.summary,
    actor_user_id: input.actorUserId,
    payload: input.payload as Json
  });
}

export async function persistChargeSettlementMapping(
  input: PaymentSettlementMappingInput,
  client?: SupabaseClient<Database>
): Promise<PaymentSettlementMappingRecord> {
  const db = await adminClient();
  void client;
  const { data, error } = await db
    .from("payment_settlement_mappings")
    .upsert(
      {
        organization_id: input.organizationId,
        property_id: input.propertyId ?? null,
        payment_attempt_id: input.paymentAttemptId,
        provider: input.provider,
        settlement_external_account_id: input.settlementExternalAccountId,
        connect_account_id: input.connectAccountId ?? null,
        external_payment_intent_id: input.externalPaymentIntentId ?? null,
        external_checkout_session_id: input.externalCheckoutSessionId ?? null,
        funding_mode: input.fundingMode,
        application_fee_amount_cents: input.applicationFeeAmountCents,
        charge_amount_cents: input.chargeAmountCents,
        currency: input.currency ?? "usd",
        status: "created",
        metadata: (input.metadata ?? {}) as Json,
        updated_at: new Date().toISOString()
      },
      { onConflict: "payment_attempt_id" }
    )
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  const record = mapMapping(data as Record<string, unknown>);
  await writeFundingAudit({
    organizationId: input.organizationId,
    entityType: "payment_settlement_mapping",
    entityId: record.id,
    eventType: "funding.settlement.mapped",
    summary: `Charge mapped to settlement ${input.settlementExternalAccountId} (${input.fundingMode})`,
    actorUserId: null,
    payload: {
      paymentAttemptId: input.paymentAttemptId,
      fundingMode: input.fundingMode,
      settlementExternalAccountId: input.settlementExternalAccountId,
      applicationFeeAmountCents: input.applicationFeeAmountCents
    },
    client: db
  });
  return record;
}

export type DestinationSettlementVerifyResult =
  | { ok: true; mapping: PaymentSettlementMappingRecord }
  | {
      ok: false;
      reason:
        | "no_mapping"
        | "not_destination_mode"
        | "provider_incapable"
        | "destination_mismatch"
        | "stripe_destination_missing"
        | "stripe_destination_mismatch";
      detail: string;
      mapping: PaymentSettlementMappingRecord | null;
    };

/**
 * Cert C1/C3 — verify destination routing before confirming settlement mapping / fee facts.
 * Never confirms when provider cannot apply live transfer_data, or when org settlement acct mismatches.
 */
export async function verifyDestinationSettlementForConfirm(input: {
  paymentAttemptId: string;
  organizationId: string;
  externalPaymentIntentId?: string | null;
  /** Optional Stripe-reported transfer_data.destination (when retrieved) */
  stripeReportedDestination?: string | null;
  providerId?: string;
}): Promise<DestinationSettlementVerifyResult> {
  const db = await adminClient();
  const { data: existing } = await db
    .from("payment_settlement_mappings")
    .select("*")
    .eq("payment_attempt_id", input.paymentAttemptId)
    .eq("organization_id", input.organizationId)
    .maybeSingle();

  if (!existing) {
    return {
      ok: false,
      reason: "no_mapping",
      detail: "No durable charge→settlement mapping for this payment attempt",
      mapping: null
    };
  }

  const mapping = mapMapping(existing as Record<string, unknown>);
  if (mapping.fundingMode !== "destination") {
    return {
      ok: false,
      reason: "not_destination_mode",
      detail: `Mapping funding_mode=${mapping.fundingMode} is not destination`,
      mapping
    };
  }

  if (!canApplyLiveDestinationCharges(input.providerId)) {
    return {
      ok: false,
      reason: "provider_incapable",
      detail:
        "Refusing to confirm destination settlement without live Stripe destination capability (prevents fictional Connect corpus)",
      mapping
    };
  }

  const account = await loadOrgSettlementAccountMirror(input.organizationId, db);
  if (
    !account ||
    account.externalAccountId !== mapping.settlementExternalAccountId ||
    account.organizationId !== input.organizationId
  ) {
    return {
      ok: false,
      reason: "destination_mismatch",
      detail: "Mapped settlement account does not match this organization's org_settlement Connect account",
      mapping
    };
  }

  if (input.stripeReportedDestination !== undefined && input.stripeReportedDestination !== null) {
    if (!input.stripeReportedDestination) {
      return {
        ok: false,
        reason: "stripe_destination_missing",
        detail: "Stripe PaymentIntent has no transfer_data.destination",
        mapping
      };
    }
    if (input.stripeReportedDestination !== mapping.settlementExternalAccountId) {
      return {
        ok: false,
        reason: "stripe_destination_mismatch",
        detail: `Stripe destination ${input.stripeReportedDestination} ≠ mapped ${mapping.settlementExternalAccountId}`,
        mapping
      };
    }
  }

  return { ok: true, mapping };
}

export async function confirmChargeSettlementMapping(input: {
  paymentAttemptId: string;
  organizationId: string;
  externalPaymentIntentId?: string | null;
  actorUserId?: string | null;
  stripeReportedDestination?: string | null;
  providerId?: string;
}): Promise<PaymentSettlementMappingRecord | null> {
  const verified = await verifyDestinationSettlementForConfirm({
    paymentAttemptId: input.paymentAttemptId,
    organizationId: input.organizationId,
    ...(input.externalPaymentIntentId !== undefined
      ? { externalPaymentIntentId: input.externalPaymentIntentId }
      : {}),
    ...(input.stripeReportedDestination !== undefined
      ? { stripeReportedDestination: input.stripeReportedDestination }
      : {}),
    ...(input.providerId !== undefined ? { providerId: input.providerId } : {})
  });

  if (!verified.ok) {
    await writeFundingAudit({
      organizationId: input.organizationId,
      entityType: "payment_attempt",
      entityId: input.paymentAttemptId,
      eventType: "funding.charge.settlement_unverified",
      summary: `Destination settlement confirmation refused: ${verified.reason}`,
      actorUserId: input.actorUserId ?? null,
      payload: {
        reason: verified.reason,
        detail: verified.detail,
        paymentAttemptId: input.paymentAttemptId
      }
    });
    return null;
  }

  const db = await adminClient();
  const now = new Date().toISOString();
  const { data, error } = await db
    .from("payment_settlement_mappings")
    .update({
      status: "confirmed",
      confirmed_at: now,
      external_payment_intent_id:
        input.externalPaymentIntentId ?? verified.mapping.externalPaymentIntentId,
      updated_at: now
    })
    .eq("id", verified.mapping.id)
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  const record = mapMapping(data as Record<string, unknown>);
  await writeFundingAudit({
    organizationId: input.organizationId,
    entityType: "payment_settlement_mapping",
    entityId: record.id,
    eventType: "funding.charge.settled",
    summary: `Destination-funded payment settled for attempt ${input.paymentAttemptId}`,
    actorUserId: input.actorUserId ?? null,
    payload: {
      paymentAttemptId: input.paymentAttemptId,
      fundingMode: record.fundingMode,
      settlementExternalAccountId: record.settlementExternalAccountId,
      applicationFeeAmountCents: record.applicationFeeAmountCents,
      verified: true
    },
    client: db
  });
  return record;
}

function mapMapping(row: Record<string, unknown>): PaymentSettlementMappingRecord {
  return {
    id: String(row["id"]),
    organizationId: String(row["organization_id"]),
    propertyId: (row["property_id"] as string | null) ?? null,
    paymentAttemptId: String(row["payment_attempt_id"]),
    provider: String(row["provider"]),
    settlementExternalAccountId: String(row["settlement_external_account_id"]),
    connectAccountId: (row["connect_account_id"] as string | null) ?? null,
    externalPaymentIntentId: (row["external_payment_intent_id"] as string | null) ?? null,
    externalCheckoutSessionId: (row["external_checkout_session_id"] as string | null) ?? null,
    fundingMode: row["funding_mode"] === "legacy_platform" ? "legacy_platform" : "destination",
    applicationFeeAmountCents: Number(row["application_fee_amount_cents"] ?? 0),
    chargeAmountCents: Number(row["charge_amount_cents"] ?? 0),
    currency: String(row["currency"] ?? "usd"),
    status:
      row["status"] === "confirmed"
        ? "confirmed"
        : row["status"] === "failed"
          ? "failed"
          : row["status"] === "canceled"
            ? "canceled"
            : "created",
    metadata:
      row["metadata"] && typeof row["metadata"] === "object"
        ? (row["metadata"] as Record<string, unknown>)
        : {},
    createdAt: String(row["created_at"]),
    confirmedAt: (row["confirmed_at"] as string | null) ?? null
  };
}

/** Test helper — expose readiness evaluation without DB. */
export function evaluateReadinessForTests(
  input: Parameters<typeof evaluateSettlementReadiness>[0]
): SettlementReadinessResult {
  return evaluateSettlementReadiness(input);
}
