/**
 * FIN-003 Phase C — payout input contract (R2 / P6).
 * Cash basis: destination-settled succeeded payments only; excludes unsafe corpus.
 */
import { INTENT_STATUSES_COUNT_AS_TRANSFERRED } from "./transfer-safety";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

export type PropertyPeriodDistributable = {
  propertyId: string;
  periodStart: string;
  periodEnd: string;
  currency: "usd";
  grossCollectedCents: number;
  alreadyTransferredCents: number;
  distributableCents: number;
  incomplete: boolean;
  skipReason: string | null;
};

function dollarsToCents(amount: unknown): number {
  const n = typeof amount === "number" ? amount : Number(amount ?? 0);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

function fundingModeOf(meta: Record<string, unknown> | null | undefined): string {
  if (!meta) return "unknown";
  const mode = meta["fundingMode"] ?? meta["funding_mode"];
  return typeof mode === "string" ? mode : "unknown";
}

function isUnsafeCorpus(meta: Record<string, unknown> | null | undefined): boolean {
  if (!meta) return true;
  const mode = fundingModeOf(meta);
  if (mode !== "destination") return true;
  if (meta["safeCorpusExcluded"] === true) return true;
  if (meta["achReturned"] === true) return true;
  if (meta["disputeStatus"] === "open" || meta["disputeStatus"] === "lost") return true;
  return false;
}

/**
 * Sum destination-settled payment principal for property in [periodStart, periodEnd).
 * Fail closed (incomplete) when payments lack property linkage or funding mode.
 */
export async function loadPropertyPeriodDistributable(input: {
  organizationId: string;
  propertyId: string;
  periodStart: string;
  periodEnd: string;
  client: AnyClient;
}): Promise<PropertyPeriodDistributable> {
  const { organizationId, propertyId, periodStart, periodEnd, client } = input;

  const { data: payments, error } = await client
    .from("payments")
    .select("id, amount, status, property_id, paid_at, metadata, payment_attempt_id")
    .eq("organization_id", organizationId)
    .eq("property_id", propertyId)
    .gte("paid_at", periodStart)
    .lt("paid_at", periodEnd)
    .in("status", ["succeeded", "paid", "completed"]);

  if (error) {
    return {
      propertyId,
      periodStart,
      periodEnd,
      currency: "usd",
      grossCollectedCents: 0,
      alreadyTransferredCents: 0,
      distributableCents: 0,
      incomplete: true,
      skipReason: `Payment read failed: ${error.message}`
    };
  }

  let gross = 0;
  let incomplete = false;
  let skipReason: string | null = null;

  for (const row of payments ?? []) {
    const r = row as Record<string, unknown>;
    if (r["property_id"] !== propertyId) {
      incomplete = true;
      skipReason = "Missing property linkage on payment";
      continue;
    }
    const meta = (r["metadata"] ?? {}) as Record<string, unknown>;

    // Prefer attempt metadata when present
    let attemptMeta = meta;
    if (typeof r["payment_attempt_id"] === "string") {
      const { data: attempt } = await client
        .from("payment_attempts")
        .select("metadata")
        .eq("id", r["payment_attempt_id"])
        .eq("organization_id", organizationId)
        .maybeSingle();
      if (attempt?.metadata && typeof attempt.metadata === "object") {
        attemptMeta = attempt.metadata as Record<string, unknown>;
      }
    }

    const mode = fundingModeOf(attemptMeta);
    if (mode === "unknown") {
      incomplete = true;
      skipReason = "Unknown funding mode on payment attempt";
      continue;
    }
    if (mode !== "destination" || isUnsafeCorpus(attemptMeta)) {
      continue;
    }

    const amountCents = dollarsToCents(r["amount"]);
    const cumulativeRefunded =
      typeof attemptMeta["cumulativeRefundedCents"] === "number"
        ? attemptMeta["cumulativeRefundedCents"]
        : 0;
    const net = Math.max(0, amountCents - cumulativeRefunded);
    gross += net;
  }

  // M1: include needs_reconcile / executing — ambiguous money must not be re-allocated
  const { data: prior } = await client
    .from("transfer_intents")
    .select("amount_cents, status, external_transfer_id")
    .eq("organization_id", organizationId)
    .eq("property_id", propertyId)
    .eq("period_start", periodStart)
    .eq("period_end", periodEnd);

  const alreadyTransferredCents = (prior ?? []).reduce(
    (
      sum: number,
      row: { amount_cents?: number; status?: string; external_transfer_id?: string | null }
    ) => {
      const status = row.status ?? "";
      const counts =
        (INTENT_STATUSES_COUNT_AS_TRANSFERRED as readonly string[]).includes(status) ||
        Boolean(row.external_transfer_id);
      return counts ? sum + (row.amount_cents ?? 0) : sum;
    },
    0
  );

  const distributableCents = Math.max(0, gross - alreadyTransferredCents);

  return {
    propertyId,
    periodStart,
    periodEnd,
    currency: "usd",
    grossCollectedCents: gross,
    alreadyTransferredCents,
    distributableCents,
    incomplete,
    skipReason: incomplete ? skipReason : null
  };
}
