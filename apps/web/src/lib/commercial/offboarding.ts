/**
 * COM-001 Slice D — org offboarding (export → freeze → archive).
 * Cancel never immediately purges data (OB-04).
 */
import { createServiceRoleServerClient } from "../auth/server";
import { requestSaasCancelAtPeriodEnd } from "../saas/server";
import { emitCommercialOpsEvent } from "./ops-events";
import { appendCommunicationTimeline } from "./timeline";
import {
  ARCHIVE_RETENTION_DAYS,
  EXPORT_WINDOW_DAYS,
  type ExportInventory,
  type OffboardingSnapshot,
  type OffboardingStage,
  type RetentionOfferStatus
} from "./offboarding-types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

function serviceClient(): AnyClient {
  const client = createServiceRoleServerClient();
  if (!client) throw new Error("Offboarding requires SUPABASE_SERVICE_ROLE_KEY");
  return client;
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

function emptyRow(organizationId: string): Record<string, unknown> {
  return {
    organization_id: organizationId,
    stage: "none",
    cancel_confirmed_at: null,
    effective_cancel_at: null,
    cancel_reason: null,
    retention_offer_status: "none",
    retention_offer_notes: null,
    final_billing_coordinated_at: null,
    billing_cancel_mode: null,
    export_window_ends_at: null,
    export_ready_at: null,
    export_inventory: {},
    frozen_at: null,
    archive_scheduled_at: null,
    archived_at: null,
    deletion_scheduled_at: null,
    recovery_window_ends_at: null,
    legal_hold: false,
    purge_allowed: false,
    recovered_at: null
  };
}

function mapRow(row: Record<string, unknown>): OffboardingSnapshot {
  const stage = String(row["stage"] ?? "none") as OffboardingStage;
  const mutationsBlocked =
    stage === "frozen" || stage === "archive_scheduled" || stage === "archived";
  const exportOnlyAccess =
    stage === "export_window" || stage === "frozen" || stage === "archive_scheduled";
  const canWinBack =
    !Boolean(row["legal_hold"]) &&
    (stage === "export_window" ||
      stage === "frozen" ||
      stage === "archive_scheduled" ||
      stage === "final_billing" ||
      stage === "cancel_confirmed" ||
      stage === "retention_offer");

  return {
    organizationId: String(row["organization_id"]),
    stage,
    cancelConfirmedAt:
      row["cancel_confirmed_at"] != null ? String(row["cancel_confirmed_at"]) : null,
    effectiveCancelAt:
      row["effective_cancel_at"] != null ? String(row["effective_cancel_at"]) : null,
    cancelReason: row["cancel_reason"] != null ? String(row["cancel_reason"]) : null,
    retentionOfferStatus: String(
      row["retention_offer_status"] ?? "none"
    ) as RetentionOfferStatus,
    retentionOfferNotes:
      row["retention_offer_notes"] != null ? String(row["retention_offer_notes"]) : null,
    finalBillingCoordinatedAt:
      row["final_billing_coordinated_at"] != null
        ? String(row["final_billing_coordinated_at"])
        : null,
    billingCancelMode:
      row["billing_cancel_mode"] != null ? String(row["billing_cancel_mode"]) : null,
    exportWindowEndsAt:
      row["export_window_ends_at"] != null ? String(row["export_window_ends_at"]) : null,
    exportReadyAt: row["export_ready_at"] != null ? String(row["export_ready_at"]) : null,
    exportInventory:
      row["export_inventory"] && typeof row["export_inventory"] === "object"
        ? (row["export_inventory"] as ExportInventory)
        : {},
    frozenAt: row["frozen_at"] != null ? String(row["frozen_at"]) : null,
    archiveScheduledAt:
      row["archive_scheduled_at"] != null ? String(row["archive_scheduled_at"]) : null,
    archivedAt: row["archived_at"] != null ? String(row["archived_at"]) : null,
    deletionScheduledAt:
      row["deletion_scheduled_at"] != null ? String(row["deletion_scheduled_at"]) : null,
    recoveryWindowEndsAt:
      row["recovery_window_ends_at"] != null ? String(row["recovery_window_ends_at"]) : null,
    legalHold: Boolean(row["legal_hold"]),
    purgeAllowed: Boolean(row["purge_allowed"]),
    recoveredAt: row["recovered_at"] != null ? String(row["recovered_at"]) : null,
    mutationsBlocked,
    exportOnlyAccess,
    canWinBack
  };
}

async function loadOrCreate(organizationId: string): Promise<Record<string, unknown>> {
  const admin = serviceClient();
  const { data: org, error: orgError } = await admin
    .from("organizations")
    .select("id")
    .eq("id", organizationId)
    .maybeSingle();
  if (orgError || !org) throw new Error("Organization not found");

  const { data, error } = await admin
    .from("commercial_offboarding_states")
    .select("*")
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (data) return data as Record<string, unknown>;

  const seed = emptyRow(organizationId);
  const { data: inserted, error: insertError } = await admin
    .from("commercial_offboarding_states")
    .upsert(seed, { onConflict: "organization_id" })
    .select("*")
    .single();
  if (insertError || !inserted) {
    throw new Error(insertError?.message ?? "Failed to init offboarding state");
  }
  return inserted as Record<string, unknown>;
}

async function persist(
  organizationId: string,
  patch: Record<string, unknown>
): Promise<OffboardingSnapshot> {
  const admin = serviceClient();
  const { data, error } = await admin
    .from("commercial_offboarding_states")
    .upsert(
      {
        organization_id: organizationId,
        ...patch,
        updated_at: new Date().toISOString()
      },
      { onConflict: "organization_id" }
    )
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to persist offboarding");
  return mapRow(data as Record<string, unknown>);
}

async function setOrgCommercialStatus(
  organizationId: string,
  status: "cancelled" | "archived" | "active"
): Promise<void> {
  const admin = serviceClient();
  const { error } = await admin
    .from("organizations")
    .update({ commercial_status: status, updated_at: new Date().toISOString() })
    .eq("id", organizationId);
  if (error) throw new Error(error.message);
}

async function countTable(
  admin: AnyClient,
  table: string,
  organizationId: string
): Promise<number> {
  const { count, error } = await admin
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId);
  if (error) return 0;
  return count ?? 0;
}

export async function buildExportInventory(
  organizationId: string
): Promise<ExportInventory> {
  const admin = serviceClient();
  const [
    properties,
    units,
    tenants,
    leases,
    documents,
    memberships,
    openInvoices
  ] = await Promise.all([
    countTable(admin, "properties", organizationId),
    countTable(admin, "units", organizationId),
    countTable(admin, "tenants", organizationId),
    countTable(admin, "leases", organizationId),
    countTable(admin, "documents", organizationId).catch(() => 0),
    admin
      .from("organization_memberships")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .then((r: { count: number | null }) => r.count ?? 0),
    admin
      .from("saas_invoices")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .in("status", ["open", "draft"])
      .then((r: { count: number | null; error: unknown }) => (r.error ? 0 : r.count ?? 0))
  ]);

  return {
    properties,
    units,
    tenants,
    leases,
    documents,
    memberships,
    openInvoices,
    generatedAt: new Date().toISOString()
  };
}

export async function getOffboardingState(
  organizationId: string
): Promise<OffboardingSnapshot> {
  const row = await loadOrCreate(organizationId);
  return mapRow(row);
}

/** Gate helper for mutation surfaces (ops-minimum). */
export async function getOffboardingGate(organizationId: string): Promise<{
  stage: OffboardingStage;
  mutationsBlocked: boolean;
  exportOnlyAccess: boolean;
  purgeAllowed: boolean;
}> {
  const snap = await getOffboardingState(organizationId);
  return {
    stage: snap.stage,
    mutationsBlocked: snap.mutationsBlocked,
    exportOnlyAccess: snap.exportOnlyAccess,
    purgeAllowed: snap.purgeAllowed
  };
}

/**
 * Throws when freeze/archive blocks operational mutations (CD-04).
 * Export / offboarding / billing recovery actions should not call this.
 */
export async function assertCommercialMutationsAllowed(
  organizationId: string
): Promise<void> {
  const gate = await getOffboardingGate(organizationId);
  if (gate.mutationsBlocked) {
    throw new Error(
      `Organization mutations blocked during offboarding stage ${gate.stage}`
    );
  }
}

async function emitStage(
  organizationId: string,
  stage: OffboardingStage,
  actorUserId: string | null | undefined,
  summary: string,
  payload: Record<string, unknown>
): Promise<void> {
  await emitCommercialOpsEvent({
    eventType: "commercial.offboarding.stage_changed",
    organizationId,
    subjectType: "organization",
    subjectId: organizationId,
    actorUserId: actorUserId ?? null,
    summary,
    payload: { stage, purge_allowed: false, ...payload }
  });
}

export async function confirmCancellation(input: {
  organizationId: string;
  actorUserId?: string | null;
  reason?: string | null;
  skipRetentionOffer?: boolean;
}): Promise<OffboardingSnapshot> {
  const current = await getOffboardingState(input.organizationId);
  if (current.stage === "archived") {
    throw new Error("Archived organizations cannot re-enter cancellation");
  }
  if (current.stage === "recovered") {
    // Allow a new cancel cycle after prior recovery.
  } else if (
    current.stage !== "none" &&
    current.stage !== "cancel_confirmed" &&
    current.stage !== "retention_offer"
  ) {
    // Idempotent re-read for later stages.
    if (
      current.stage === "final_billing" ||
      current.stage === "export_window" ||
      current.stage === "frozen" ||
      current.stage === "archive_scheduled"
    ) {
      return current;
    }
  }

  const now = new Date().toISOString();
  const stage: OffboardingStage = input.skipRetentionOffer
    ? "final_billing"
    : "retention_offer";

  const snap = await persist(input.organizationId, {
    ...emptyRow(input.organizationId),
    stage,
    cancel_confirmed_at: current.cancelConfirmedAt ?? now,
    effective_cancel_at: current.effectiveCancelAt ?? now,
    cancel_reason: input.reason ?? current.cancelReason,
    retention_offer_status: input.skipRetentionOffer ? "skipped" : "offered",
    purge_allowed: false,
    legal_hold: current.legalHold,
    recovered_at: null
  });

  await setOrgCommercialStatus(input.organizationId, "cancelled");

  await appendCommunicationTimeline({
    organizationId: input.organizationId,
    channel: "system",
    entryType: "cancellation_warning",
    templateKey: "offboarding.cancel_confirmed",
    direction: "outbound",
    actorType: input.actorUserId ? "cs_user" : "system",
    actorUserId: input.actorUserId ?? null,
    deliveryStatus: "n_a",
    summary: "Cancellation confirmed — export/freeze path started (no purge)",
    metadata: { stage: snap.stage },
    actorEmitUserId: input.actorUserId ?? null
  });

  await emitStage(input.organizationId, snap.stage, input.actorUserId, "Offboarding cancel confirmed", {
    retention_offer_status: snap.retentionOfferStatus
  });

  return snap;
}

export async function recordRetentionOffer(input: {
  organizationId: string;
  status: Exclude<RetentionOfferStatus, "none">;
  notes?: string | null;
  actorUserId?: string | null;
}): Promise<OffboardingSnapshot> {
  const current = await getOffboardingState(input.organizationId);
  if (current.stage === "none") {
    throw new Error("Confirm cancellation before retention offers");
  }

  // Accepted retention offer = win-back before freeze — recover.
  if (input.status === "accepted") {
    return recoverWinBack({
      organizationId: input.organizationId,
      reason: "retention_offer_accepted",
      ...(input.actorUserId !== undefined ? { actorUserId: input.actorUserId } : {})
    });
  }

  const nextStage: OffboardingStage =
    input.status === "declined" || input.status === "skipped"
      ? "final_billing"
      : "retention_offer";

  const snap = await persist(input.organizationId, {
    stage: nextStage,
    retention_offer_status: input.status,
    retention_offer_notes: input.notes ?? current.retentionOfferNotes,
    purge_allowed: false
  });

  await emitStage(
    input.organizationId,
    snap.stage,
    input.actorUserId,
    `Retention offer ${input.status}`,
    { retention_offer_status: input.status }
  );
  return snap;
}

export async function coordinateFinalBilling(input: {
  organizationId: string;
  actorUserId?: string | null;
}): Promise<OffboardingSnapshot> {
  const current = await getOffboardingState(input.organizationId);
  if (
    current.stage !== "final_billing" &&
    current.stage !== "retention_offer" &&
    current.stage !== "cancel_confirmed" &&
    current.stage !== "export_window"
  ) {
    if (current.finalBillingCoordinatedAt) return current;
    throw new Error("Offboarding must reach final billing before coordination");
  }

  const billing = await requestSaasCancelAtPeriodEnd(
    input.organizationId,
    input.actorUserId ?? null
  );
  const now = new Date().toISOString();
  const exportEnds = addDays(now, EXPORT_WINDOW_DAYS);
  const inventory = await buildExportInventory(input.organizationId);

  const snap = await persist(input.organizationId, {
    stage: "export_window",
    final_billing_coordinated_at: now,
    billing_cancel_mode:
      billing.mode === "no_subscription" ? "immediate_mirror" : "cancel_at_period_end",
    export_window_ends_at: current.exportWindowEndsAt ?? exportEnds,
    export_ready_at: now,
    export_inventory: inventory,
    recovery_window_ends_at:
      current.recoveryWindowEndsAt ?? addDays(now, ARCHIVE_RETENTION_DAYS),
    purge_allowed: false
  });

  await appendCommunicationTimeline({
    organizationId: input.organizationId,
    channel: "system",
    entryType: "offboarding",
    templateKey: "offboarding.export_ready",
    direction: "outbound",
    actorType: "system",
    actorUserId: input.actorUserId ?? null,
    deliveryStatus: "n_a",
    summary: "Export window open — data inventory ready (no purge)",
    metadata: {
      export_window_ends_at: snap.exportWindowEndsAt,
      billing_mode: snap.billingCancelMode
    },
    actorEmitUserId: input.actorUserId ?? null
  });

  await emitCommercialOpsEvent({
    eventType: "commercial.offboarding.export_ready",
    organizationId: input.organizationId,
    subjectType: "organization",
    subjectId: input.organizationId,
    actorUserId: input.actorUserId ?? null,
    summary: "Offboarding export ready",
    payload: {
      stage: snap.stage,
      export_window_ends_at: snap.exportWindowEndsAt,
      billing_mode: snap.billingCancelMode,
      inventory_counts: {
        properties: inventory.properties,
        units: inventory.units,
        tenants: inventory.tenants
      }
    }
  });

  await emitStage(input.organizationId, snap.stage, input.actorUserId, "Final billing coordinated", {
    billing_mode: snap.billingCancelMode
  });

  return snap;
}

export async function refreshExportInventory(input: {
  organizationId: string;
  actorUserId?: string | null;
}): Promise<OffboardingSnapshot> {
  const current = await getOffboardingState(input.organizationId);
  if (
    current.stage !== "export_window" &&
    current.stage !== "frozen" &&
    current.stage !== "final_billing"
  ) {
    throw new Error("Export inventory only during export window / freeze");
  }
  const inventory = await buildExportInventory(input.organizationId);
  const now = new Date().toISOString();
  return persist(input.organizationId, {
    export_inventory: inventory,
    export_ready_at: current.exportReadyAt ?? now,
    stage: current.stage === "final_billing" ? "export_window" : current.stage,
    purge_allowed: false
  });
}

/**
 * Freeze requires export readiness (export_ready_at set). Never purges.
 */
export async function freezeOrganization(input: {
  organizationId: string;
  actorUserId?: string | null;
}): Promise<OffboardingSnapshot> {
  const current = await getOffboardingState(input.organizationId);
  if (current.stage === "frozen" || current.stage === "archive_scheduled") {
    return current;
  }
  if (current.stage === "archived") {
    throw new Error("Organization already archived");
  }
  if (!current.exportReadyAt && current.stage !== "export_window") {
    // Auto-run export readiness once before freeze (CD-02).
    const billingArgs: {
      organizationId: string;
      actorUserId?: string | null;
    } = { organizationId: input.organizationId };
    if (input.actorUserId !== undefined) {
      billingArgs.actorUserId = input.actorUserId;
    }
    await coordinateFinalBilling(billingArgs);
  }
  const refreshed = await getOffboardingState(input.organizationId);
  if (!refreshed.exportReadyAt) {
    throw new Error("Export must be ready before freeze");
  }

  const now = new Date().toISOString();
  const archiveAt =
    refreshed.archiveScheduledAt ?? addDays(now, ARCHIVE_RETENTION_DAYS);
  const deletionAt = refreshed.deletionScheduledAt ?? archiveAt;

  const snap = await persist(input.organizationId, {
    stage: "frozen",
    frozen_at: refreshed.frozenAt ?? now,
    archive_scheduled_at: archiveAt,
    deletion_scheduled_at: deletionAt,
    recovery_window_ends_at: refreshed.recoveryWindowEndsAt ?? archiveAt,
    purge_allowed: false
  });

  await setOrgCommercialStatus(input.organizationId, "cancelled");

  await appendCommunicationTimeline({
    organizationId: input.organizationId,
    channel: "system",
    entryType: "offboarding",
    templateKey: "offboarding.freeze_warning",
    direction: "outbound",
    actorType: "system",
    actorUserId: input.actorUserId ?? null,
    deliveryStatus: "n_a",
    summary: "Account frozen — mutations blocked; export-only; no purge",
    metadata: { stage: "frozen", archive_scheduled_at: snap.archiveScheduledAt },
    actorEmitUserId: input.actorUserId ?? null
  });

  await emitCommercialOpsEvent({
    eventType: "commercial.offboarding.frozen",
    organizationId: input.organizationId,
    subjectType: "organization",
    subjectId: input.organizationId,
    actorUserId: input.actorUserId ?? null,
    summary: "Organization frozen",
    payload: {
      stage: "frozen",
      purge_allowed: false,
      archive_scheduled_at: snap.archiveScheduledAt
    }
  });

  return snap;
}

export async function archiveOrganization(input: {
  organizationId: string;
  actorUserId?: string | null;
  force?: boolean;
}): Promise<OffboardingSnapshot> {
  const current = await getOffboardingState(input.organizationId);
  if (current.stage === "archived") return current;
  if (current.legalHold) {
    throw new Error("Legal hold pauses archive / deletion");
  }
  if (current.stage !== "frozen" && current.stage !== "archive_scheduled") {
    throw new Error("Freeze before archive");
  }
  if (!input.force && current.archiveScheduledAt) {
    const scheduled = Date.parse(current.archiveScheduledAt);
    if (Number.isFinite(scheduled) && scheduled > Date.now()) {
      // Mark scheduled only — do not archive early.
      return persist(input.organizationId, {
        stage: "archive_scheduled",
        purge_allowed: false
      });
    }
  }

  const now = new Date().toISOString();
  // Deletion remains scheduled and gated — purge_allowed stays false unless explicitly released later.
  const snap = await persist(input.organizationId, {
    stage: "archived",
    archived_at: now,
    archive_scheduled_at: current.archiveScheduledAt ?? now,
    deletion_scheduled_at: current.deletionScheduledAt ?? now,
    purge_allowed: false
  });

  await setOrgCommercialStatus(input.organizationId, "archived");

  await appendCommunicationTimeline({
    organizationId: input.organizationId,
    channel: "system",
    entryType: "offboarding",
    templateKey: "offboarding.archive_notice",
    direction: "outbound",
    actorType: "system",
    actorUserId: input.actorUserId ?? null,
    deliveryStatus: "n_a",
    summary: "Organization archived — historical records preserved; purge still gated",
    metadata: {
      stage: "archived",
      deletion_scheduled_at: snap.deletionScheduledAt,
      purge_allowed: false
    },
    actorEmitUserId: input.actorUserId ?? null
  });

  await emitCommercialOpsEvent({
    eventType: "commercial.offboarding.archived",
    organizationId: input.organizationId,
    subjectType: "organization",
    subjectId: input.organizationId,
    actorUserId: input.actorUserId ?? null,
    summary: "Organization archived",
    payload: {
      stage: "archived",
      purge_allowed: false,
      legal_hold: snap.legalHold
    }
  });

  return snap;
}

export async function setLegalHold(input: {
  organizationId: string;
  legalHold: boolean;
  actorUserId?: string | null;
}): Promise<OffboardingSnapshot> {
  const snap = await persist(input.organizationId, {
    legal_hold: input.legalHold,
    purge_allowed: false
  });
  await emitStage(
    input.organizationId,
    snap.stage,
    input.actorUserId,
    input.legalHold ? "Legal hold enabled" : "Legal hold cleared",
    { legal_hold: input.legalHold }
  );
  return snap;
}

/** Recovery-window win-back — same organization (pre-Archive). */
export async function recoverWinBack(input: {
  organizationId: string;
  actorUserId?: string | null;
  reason?: string;
}): Promise<OffboardingSnapshot> {
  const current = await getOffboardingState(input.organizationId);
  if (current.stage === "archived") {
    throw new Error("Archived orgs require a new commercial lifecycle (not win-back)");
  }
  if (current.legalHold) {
    throw new Error("Legal hold blocks win-back restore");
  }
  if (!current.canWinBack && current.stage !== "recovered" && current.stage !== "none") {
    throw new Error("Win-back not available in the current offboarding stage");
  }

  const now = new Date().toISOString();
  const snap = await persist(input.organizationId, {
    stage: "recovered",
    recovered_at: now,
    purge_allowed: false,
    frozen_at: null
  });
  await setOrgCommercialStatus(input.organizationId, "active");

  await appendCommunicationTimeline({
    organizationId: input.organizationId,
    channel: "system",
    entryType: "customer_success_check_in",
    templateKey: "offboarding.win_back_restored",
    direction: "outbound",
    actorType: input.actorUserId ? "cs_user" : "system",
    actorUserId: input.actorUserId ?? null,
    deliveryStatus: "n_a",
    summary: "Win-back restore — same organization reactivated",
    metadata: { reason: input.reason ?? "win_back" },
    actorEmitUserId: input.actorUserId ?? null
  });

  await emitCommercialOpsEvent({
    eventType: "commercial.offboarding.recovered",
    organizationId: input.organizationId,
    subjectType: "organization",
    subjectId: input.organizationId,
    actorUserId: input.actorUserId ?? null,
    summary: "Offboarding win-back recovered",
    payload: { stage: "recovered", reason: input.reason ?? "win_back" }
  });

  return snap;
}

/** Pure helper — cancel never enables purge. */
export function cancelEnablesPurge(): false {
  return false;
}
