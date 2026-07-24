/**
 * FIN-003 Phase D — TransferIntent / remittance read projections.
 * No money movement. Honesty: status comes only from persisted intents.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@mpa/supabase";
import { createAuthServerComponentClient, createServiceRoleServerClient } from "../auth/server";
import { writeConnectAudit } from "./connect-audit";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

async function resolveClient(client?: SupabaseClient<Database>): Promise<AnyClient> {
  return client ?? (await createAuthServerComponentClient());
}

async function adminClient(): Promise<AnyClient> {
  return createServiceRoleServerClient() as AnyClient;
}

function formatCents(amountCents: number, currency = "usd"): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase()
    }).format(amountCents / 100);
  } catch {
    return `$${(amountCents / 100).toFixed(2)}`;
  }
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString();
}

export type OwnerPayoutVisibility = "pending" | "paid" | "failed" | "skipped" | "other";

export function mapIntentVisibility(status: string): OwnerPayoutVisibility {
  if (status === "paid" || status === "in_transit") return "paid";
  if (status === "failed") return "failed";
  if (status === "skipped") return "skipped";
  if (
    status === "eligible" ||
    status === "pending" ||
    status === "executing" ||
    status === "needs_reconcile"
  ) {
    return "pending";
  }
  return "other";
}

export type OwnerPayoutHistoryRow = {
  intentId: string;
  runId: string;
  propertyId: string;
  propertyName: string;
  periodStart: string;
  periodEnd: string;
  periodLabel: string;
  amountCents: number;
  amountLabel: string;
  status: string;
  visibility: OwnerPayoutVisibility;
  statusLabel: string;
  externalTransferId: string | null;
  remittanceId: string | null;
  remittanceSummary: string | null;
  updatedAt: string;
  updatedLabel: string;
};

export type PayoutRemittanceRecord = {
  id: string;
  transferIntentId: string;
  propertyId: string;
  propertyName: string;
  periodLabel: string;
  amountLabel: string;
  summary: string;
  externalTransferId: string | null;
  createdAt: string;
  createdLabel: string;
};

export type OrgPayoutRunSummary = {
  runId: string;
  status: string;
  statusLabel: string;
  periodLabel: string;
  intentCount: number;
  paidCount: number;
  failedCount: number;
  pendingCount: number;
  needsReconcileCount: number;
  createdAt: string;
  createdLabel: string;
  failureReason: string | null;
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  eligible: "Eligible",
  executing: "Processing",
  in_transit: "In transit",
  paid: "Paid",
  failed: "Failed",
  skipped: "Skipped",
  needs_reconcile: "Needs reconcile",
  draft: "Draft",
  queued: "Queued",
  running: "Running",
  succeeded: "Succeeded",
  partial: "Partial",
  canceled: "Canceled"
};

export function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

/** Owner-scoped TransferIntent history for authorized property ids. */
export async function listOwnerPayoutHistory(input: {
  organizationId: string;
  ownerUserId: string;
  propertyIds: string[];
  client?: SupabaseClient<Database>;
  limit?: number;
}): Promise<OwnerPayoutHistoryRow[]> {
  if (input.propertyIds.length === 0) return [];
  const client = await resolveClient(input.client);
  const limit = input.limit ?? 50;

  const { data: intents, error } = await client
    .from("transfer_intents")
    .select(
      "id, payout_run_id, property_id, period_start, period_end, amount_cents, currency, status, external_transfer_id, updated_at"
    )
    .eq("organization_id", input.organizationId)
    .eq("owner_user_id", input.ownerUserId)
    .in("property_id", input.propertyIds)
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);

  const propertyIds = [...new Set((intents ?? []).map((i: { property_id: string }) => i.property_id))];
  const { data: properties } = propertyIds.length
    ? await client.from("properties").select("id, name").in("id", propertyIds)
    : { data: [] };
  const nameById = new Map(
    (properties ?? []).map((p: { id: string; name: string }) => [p.id, p.name])
  );

  const intentIds = (intents ?? []).map((i: { id: string }) => i.id);
  const { data: remittances } = intentIds.length
    ? await client
        .from("payout_remittance_records")
        .select("id, transfer_intent_id, summary")
        .eq("organization_id", input.organizationId)
        .in("transfer_intent_id", intentIds)
        .eq("status", "issued")
    : { data: [] };
  type RemittanceLite = { id: string; transfer_intent_id: string; summary: string };
  const remittanceByIntent = new Map<string, RemittanceLite>(
    (remittances ?? []).map((r: RemittanceLite) => [r.transfer_intent_id, r])
  );

  return (intents ?? []).map(
    (row: {
      id: string;
      payout_run_id: string;
      property_id: string;
      period_start: string;
      period_end: string;
      amount_cents: number;
      currency: string;
      status: string;
      external_transfer_id: string | null;
      updated_at: string;
    }) => {
      const visibility = mapIntentVisibility(row.status);
      const remittance = remittanceByIntent.get(row.id) ?? null;
      return {
        intentId: row.id,
        runId: row.payout_run_id,
        propertyId: row.property_id,
        propertyName: nameById.get(row.property_id) ?? "Property",
        periodStart: row.period_start,
        periodEnd: row.period_end,
        periodLabel: `${formatDate(row.period_start)} – ${formatDate(row.period_end)}`,
        amountCents: row.amount_cents,
        amountLabel: formatCents(row.amount_cents, row.currency),
        status: row.status,
        visibility,
        statusLabel: statusLabel(row.status),
        externalTransferId: row.external_transfer_id,
        remittanceId: remittance?.id ?? null,
        remittanceSummary: remittance?.summary ?? null,
        updatedAt: row.updated_at,
        updatedLabel: formatDate(row.updated_at)
      };
    }
  );
}

export async function listOwnerRemittanceRecords(input: {
  organizationId: string;
  ownerUserId: string;
  propertyIds: string[];
  client?: SupabaseClient<Database>;
  limit?: number;
}): Promise<PayoutRemittanceRecord[]> {
  if (input.propertyIds.length === 0) return [];
  const client = await resolveClient(input.client);
  const { data, error } = await client
    .from("payout_remittance_records")
    .select(
      "id, transfer_intent_id, property_id, period_start, period_end, amount_cents, currency, summary, external_transfer_id, created_at"
    )
    .eq("organization_id", input.organizationId)
    .eq("owner_user_id", input.ownerUserId)
    .in("property_id", input.propertyIds)
    .eq("status", "issued")
    .order("created_at", { ascending: false })
    .limit(input.limit ?? 50);
  if (error) throw new Error(error.message);

  const propertyIds = [...new Set((data ?? []).map((r: { property_id: string }) => r.property_id))];
  const { data: properties } = propertyIds.length
    ? await client.from("properties").select("id, name").in("id", propertyIds)
    : { data: [] };
  const nameById = new Map(
    (properties ?? []).map((p: { id: string; name: string }) => [p.id, p.name])
  );

  return (data ?? []).map(
    (row: {
      id: string;
      transfer_intent_id: string;
      property_id: string;
      period_start: string;
      period_end: string;
      amount_cents: number;
      currency: string;
      summary: string;
      external_transfer_id: string | null;
      created_at: string;
    }) => ({
      id: row.id,
      transferIntentId: row.transfer_intent_id,
      propertyId: row.property_id,
      propertyName: nameById.get(row.property_id) ?? "Property",
      periodLabel: `${formatDate(row.period_start)} – ${formatDate(row.period_end)}`,
      amountLabel: formatCents(row.amount_cents, row.currency),
      summary: row.summary,
      externalTransferId: row.external_transfer_id,
      createdAt: row.created_at,
      createdLabel: formatDate(row.created_at)
    })
  );
}

/** PM console — recent payout runs with intent tallies. */
export async function listOrgPayoutRunSummaries(input: {
  organizationId: string;
  client?: SupabaseClient<Database>;
  limit?: number;
}): Promise<OrgPayoutRunSummary[]> {
  const client = await resolveClient(input.client);
  const { data: runs, error } = await client
    .from("payout_runs")
    .select("id, status, period_start, period_end, created_at, failure_reason")
    .eq("organization_id", input.organizationId)
    .order("created_at", { ascending: false })
    .limit(input.limit ?? 25);
  if (error) throw new Error(error.message);

  const summaries: OrgPayoutRunSummary[] = [];
  for (const run of runs ?? []) {
    const { data: intents } = await client
      .from("transfer_intents")
      .select("status")
      .eq("payout_run_id", run.id)
      .eq("organization_id", input.organizationId);
    const statuses = (intents ?? []).map((i: { status: string }) => i.status);
    summaries.push({
      runId: run.id,
      status: run.status,
      statusLabel: statusLabel(run.status),
      periodLabel: `${formatDate(run.period_start)} – ${formatDate(run.period_end)}`,
      intentCount: statuses.length,
      paidCount: statuses.filter((s: string) => s === "paid" || s === "in_transit").length,
      failedCount: statuses.filter((s: string) => s === "failed").length,
      pendingCount: statuses.filter((s: string) =>
        ["eligible", "pending", "executing"].includes(s)
      ).length,
      needsReconcileCount: statuses.filter((s: string) => s === "needs_reconcile").length,
      createdAt: run.created_at,
      createdLabel: formatDate(run.created_at),
      failureReason: run.failure_reason
    });
  }
  return summaries;
}

/** Upsert remittance record when a transfer is paid (idempotent on transfer_intent_id). */
export async function ensureRemittanceRecord(input: {
  organizationId: string;
  transferIntentId: string;
}): Promise<{ id: string; created: boolean } | null> {
  const admin = await adminClient();
  const { data: intent, error } = await admin
    .from("transfer_intents")
    .select("*")
    .eq("id", input.transferIntentId)
    .eq("organization_id", input.organizationId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!intent) return null;
  if (intent.status !== "paid" && intent.status !== "in_transit") return null;

  const { data: existing } = await admin
    .from("payout_remittance_records")
    .select("id")
    .eq("transfer_intent_id", intent.id)
    .maybeSingle();
  if (existing) return { id: existing.id as string, created: false };

  const { data: property } = await admin
    .from("properties")
    .select("name")
    .eq("id", intent.property_id)
    .maybeSingle();

  const amountLabel = formatCents(intent.amount_cents, intent.currency);
  const summary = `Owner payout remittance: ${amountLabel} for ${property?.name ?? "property"} (${formatDate(intent.period_start)} – ${formatDate(intent.period_end)}). Transfer ${intent.external_transfer_id ?? "pending id"}.`;

  const { data: inserted, error: insertError } = await admin
    .from("payout_remittance_records")
    .insert({
      organization_id: input.organizationId,
      transfer_intent_id: intent.id,
      payout_run_id: intent.payout_run_id,
      property_id: intent.property_id,
      owner_user_id: intent.owner_user_id,
      period_start: intent.period_start,
      period_end: intent.period_end,
      amount_cents: intent.amount_cents,
      currency: intent.currency,
      external_transfer_id: intent.external_transfer_id,
      status: "issued",
      summary,
      metadata: {
        source: "fin003_phase_e",
        intentStatus: intent.status
      }
    })
    .select("id")
    .single();
  if (insertError) {
    // Unique race — treat as existing
    if (insertError.message.toLowerCase().includes("duplicate") || insertError.code === "23505") {
      const { data: again } = await admin
        .from("payout_remittance_records")
        .select("id")
        .eq("transfer_intent_id", intent.id)
        .maybeSingle();
      return again ? { id: again.id as string, created: false } : null;
    }
    throw new Error(insertError.message);
  }

  // R-D4 — remittance issue is auditable
  await writeConnectAudit(
    input.organizationId,
    "payout_remittance_record",
    inserted.id as string,
    "payout_remittance.issued",
    summary,
    null,
    {
      transferIntentId: intent.id,
      externalTransferId: intent.external_transfer_id,
      amountCents: intent.amount_cents
    },
    admin
  ).catch((err) => {
    console.error("[FIN-003 Phase E] remittance audit failed", err);
  });

  return { id: inserted.id as string, created: true };
}

/** R-D3 — payout history must use full owner property scope (not UI summary caps). */
export function ownerPayoutProjectionPropertyIds(propertyIds: string[]): string[] {
  return [...propertyIds];
}
