/**
 * CORE-004 Phase 5 — Vendor workflow transitions (server).
 * Single carrier: vendors.workflow_stage. Maintenance jobs stay on Phase 2.
 */

import type { Json } from "@mpa/supabase";
import {
  createAuthServerComponentClient,
  createServiceRoleServerClient
} from "../auth/server";
import { emitOpsDomainEvent } from "../ops/emit";
import type { OpsDbClient } from "../ops/types";
import { notify } from "../notifications/service";
import {
  canTransitionVendorWorkflow,
  evaluateVendorAdvanceGates,
  isVendorWorkflowStage,
  legacyVendorStatusToWorkflowStage,
  VENDOR_WORKFLOW_DEFINITIONS,
  workflowStageToLegacyVendorStatus,
  type VendorAdvanceGateContext,
  type VendorWorkflowStage
} from "./workflow";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UntypedDb = { from: (table: string) => any };
type SupabaseClientType = Awaited<ReturnType<typeof createAuthServerComponentClient>>;

function privilegedClient(fallback: SupabaseClientType): SupabaseClientType {
  return (createServiceRoleServerClient() as SupabaseClientType | null) ?? fallback;
}

type VendorRow = {
  id: string;
  organization_id: string;
  business_name: string;
  phone: string | null;
  email: string | null;
  insurance_expiration: string | null;
  license_number: string | null;
  preferred_vendor: boolean;
  status: string;
  workflow_stage?: string | null;
  metadata: Json | null;
};

function metadataOf(value: Json | null): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return { ...(value as Record<string, unknown>) };
  }
  return {};
}

function vendorStage(row: VendorRow): VendorWorkflowStage {
  if (isVendorWorkflowStage(row.workflow_stage)) return row.workflow_stage;
  return legacyVendorStatusToWorkflowStage(row.status, row.preferred_vendor);
}

async function loadVendor(
  organizationId: string,
  vendorId: string,
  supabase: SupabaseClientType
): Promise<VendorRow | null> {
  const { data, error } = await (supabase as unknown as UntypedDb)
    .from("vendors")
    .select(
      "id, organization_id, business_name, phone, email, insurance_expiration, license_number, preferred_vendor, status, workflow_stage, metadata"
    )
    .eq("organization_id", organizationId)
    .eq("id", vendorId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as VendorRow | null) ?? null;
}

async function insertWorkflowEvent(input: {
  organizationId: string;
  vendorId: string;
  actorUserId: string;
  fromStage: VendorWorkflowStage | null;
  toStage: VendorWorkflowStage;
  reason: string | null;
  automation: Record<string, unknown>;
  payload: Record<string, unknown>;
  supabase: SupabaseClientType;
}): Promise<void> {
  const { error } = await (input.supabase as unknown as UntypedDb)
    .from("vendor_workflow_events")
    .insert({
      organization_id: input.organizationId,
      vendor_id: input.vendorId,
      from_stage: input.fromStage,
      to_stage: input.toStage,
      actor_user_id: input.actorUserId,
      reason: input.reason,
      automation: input.automation as Json,
      payload: input.payload as Json
    });
  if (error) throw new Error(error.message ?? "Vendor workflow audit insert failed.");
}

async function emitAndNotify(input: {
  organizationId: string;
  actorUserId: string;
  fromStage: VendorWorkflowStage;
  toStage: VendorWorkflowStage;
  vendorId: string;
  summary: string;
  supabase: SupabaseClientType;
}): Promise<void> {
  const definition = VENDOR_WORKFLOW_DEFINITIONS[input.toStage];
  const href = `/vendors/${input.vendorId}`;
  try {
    await emitOpsDomainEvent(input.supabase as unknown as OpsDbClient, {
      eventType: "vendor.workflow.transitioned",
      organizationId: input.organizationId,
      actor: { actor_type: "user", principal_id: input.actorUserId },
      subject: { type: "vendor", id: input.vendorId },
      href,
      summary: input.summary,
      payload: {
        fromStage: input.fromStage,
        toStage: input.toStage,
        notifyCategory: "vendors"
      },
      visibility: "ops",
      sensitivity: "normal"
    });
  } catch {
    /* bus optional */
  }

  const notifyStages: VendorWorkflowStage[] = [
    "application_submitted",
    "approved",
    "available",
    "assigned",
    "invoice_submitted",
    "payment_pending",
    "paid",
    "suspended"
  ];
  if (notifyStages.includes(input.toStage)) {
    try {
      await notify({
        organizationId: input.organizationId,
        recipientUserIds: [input.actorUserId],
        category: "vendors",
        priority:
          input.toStage === "suspended" || input.toStage === "invoice_submitted"
            ? "high"
            : "normal",
        title: `Vendor: ${definition.label}`,
        body: `Workflow moved to ${definition.label}.`,
        eventKey: `vendor.workflow.${input.toStage}.${input.vendorId}.${Date.now()}`,
        href,
        sourceEntityType: "vendor",
        sourceEntityId: input.vendorId,
        actorUserId: input.actorUserId,
        channels: { inApp: true }
      });
    } catch {
      /* optional */
    }
  }
}

function gateContext(
  vendor: VendorRow,
  extras?: Partial<VendorAdvanceGateContext>
): VendorAdvanceGateContext {
  const insuranceExpiration = vendor.insurance_expiration;
  const insuranceCurrent =
    Boolean(insuranceExpiration) &&
    insuranceExpiration! >= new Date().toISOString().slice(0, 10);
  const meta = metadataOf(vendor.metadata);
  return {
    hasBusinessName: Boolean(vendor.business_name?.trim()),
    hasContact: Boolean(vendor.email || vendor.phone),
    insuranceOnFile: Boolean(insuranceExpiration || meta["insuranceOnFile"]),
    insuranceCurrent: insuranceCurrent || Boolean(meta["insuranceVerified"]),
    complianceComplete: Boolean(
      extras?.complianceComplete ?? meta["complianceComplete"] ?? vendor.license_number
    ),
    hasOpenAssignment: Boolean(extras?.hasOpenAssignment),
    invoiceSubmitted: Boolean(extras?.invoiceSubmitted ?? meta["invoiceSubmitted"]),
    invoiceApproved: Boolean(extras?.invoiceApproved ?? meta["invoiceApproved"]),
    paymentRecorded: Boolean(extras?.paymentRecorded ?? meta["paymentRecorded"])
  };
}

export type TransitionVendorWorkflowInput = {
  organizationId: string;
  vendorId: string;
  actorUserId: string;
  toStage: VendorWorkflowStage;
  reason?: string | null;
  force?: boolean;
  gates?: Partial<VendorAdvanceGateContext>;
};

export async function transitionVendorWorkflow(
  input: TransitionVendorWorkflowInput,
  client?: SupabaseClientType
): Promise<{
  fromStage: VendorWorkflowStage;
  toStage: VendorWorkflowStage;
  vendorId: string;
  automation: Record<string, unknown>;
}> {
  const supabase = privilegedClient(client ?? (await createAuthServerComponentClient()));
  const vendor = await loadVendor(input.organizationId, input.vendorId, supabase);
  if (!vendor) throw new Error("Vendor not found.");

  const fromStage = vendorStage(vendor);
  const toStage = input.toStage;
  if (fromStage === toStage) {
    return { fromStage, toStage, vendorId: vendor.id, automation: {} };
  }

  if (!input.force && !canTransitionVendorWorkflow(fromStage, toStage)) {
    throw new Error(
      `Transition ${fromStage} → ${toStage} is not allowed. No undocumented transitions.`
    );
  }

  const gate = input.force
    ? ({ ok: true } as const)
    : evaluateVendorAdvanceGates(toStage, gateContext(vendor, input.gates));
  if (!gate.ok) throw new Error(gate.message);

  const nowIso = new Date().toISOString();
  const automation: Record<string, unknown> = {};
  const nextMeta: Record<string, unknown> = {
    ...metadataOf(vendor.metadata),
    vendorWorkflowStage: toStage,
    vendorWorkflowUpdatedAt: nowIso
  };

  if (toStage === "approved" || toStage === "available") {
    automation["availableAt"] = nowIso;
    nextMeta["availableAt"] = nowIso;
  }
  if (toStage === "preferred_vendor") {
    nextMeta["preferredMarkedAt"] = nowIso;
  }
  if (toStage === "suspended") {
    nextMeta["suspendedAt"] = nowIso;
  }

  const patch: Record<string, unknown> = {
    workflow_stage: toStage,
    status: workflowStageToLegacyVendorStatus(toStage),
    preferred_vendor: toStage === "preferred_vendor" ? true : vendor.preferred_vendor,
    metadata: nextMeta as Json,
    updated_by: input.actorUserId,
    updated_at: nowIso
  };
  if (toStage === "available" && fromStage === "preferred_vendor") {
    // keep preferred flag unless explicitly leaving preferred via other paths
  }
  if (toStage === "archived") {
    patch["archived_at"] = nowIso;
  }

  const { error } = await (supabase as unknown as UntypedDb)
    .from("vendors")
    .update(patch)
    .eq("organization_id", input.organizationId)
    .eq("id", vendor.id)
    .is("deleted_at", null);
  if (error) throw new Error(error.message ?? "Vendor workflow update failed.");

  await insertWorkflowEvent({
    organizationId: input.organizationId,
    vendorId: vendor.id,
    actorUserId: input.actorUserId,
    fromStage,
    toStage,
    reason: input.reason ?? null,
    automation,
    payload: { definition: VENDOR_WORKFLOW_DEFINITIONS[toStage].label },
    supabase
  });

  await emitAndNotify({
    organizationId: input.organizationId,
    actorUserId: input.actorUserId,
    fromStage,
    toStage,
    vendorId: vendor.id,
    summary: `${fromStage} → ${toStage}`,
    supabase
  });

  // Approved → Available automation (eliminates manual coordination).
  if (toStage === "approved" && input.reason !== "approval_automation") {
    await runVendorApprovedAutomation({
      organizationId: input.organizationId,
      vendorId: vendor.id,
      actorUserId: input.actorUserId,
      client: supabase
    });
    return { fromStage, toStage: "available", vendorId: vendor.id, automation };
  }

  return { fromStage, toStage, vendorId: vendor.id, automation };
}

/** After vendor approval — make available for Maintenance assignments. */
export async function runVendorApprovedAutomation(input: {
  organizationId: string;
  vendorId: string;
  actorUserId: string;
  client?: SupabaseClientType;
}): Promise<void> {
  const supabase = privilegedClient(input.client ?? (await createAuthServerComponentClient()));
  await transitionVendorWorkflow(
    {
      organizationId: input.organizationId,
      vendorId: input.vendorId,
      actorUserId: input.actorUserId,
      toStage: "available",
      reason: "approval_automation",
      force: true
    },
    supabase
  );
}

/** Sync vendor focus stage from maintenance assignment status. */
export async function syncVendorWorkflowFromAssignment(input: {
  organizationId: string;
  vendorId: string;
  actorUserId: string;
  assignmentStatus: string;
  client?: SupabaseClientType;
}): Promise<void> {
  const supabase = privilegedClient(input.client ?? (await createAuthServerComponentClient()));
  const vendor = await loadVendor(input.organizationId, input.vendorId, supabase);
  if (!vendor) return;
  const stage = vendorStage(vendor);
  if (stage === "suspended" || stage === "inactive" || stage === "archived") return;

  let toStage: VendorWorkflowStage | null = null;
  switch (input.assignmentStatus) {
    case "pending":
    case "awaiting_response":
    case "accepted":
    case "en_route":
    case "arrived":
      toStage = "assigned";
      break;
    case "in_progress":
      toStage = "work_in_progress";
      break;
    case "completed":
      toStage = stage === "invoice_submitted" || stage === "payment_pending" || stage === "paid"
        ? null
        : "work_in_progress";
      break;
    case "cancelled":
      toStage = vendor.preferred_vendor ? "preferred_vendor" : "available";
      break;
    default:
      break;
  }
  if (!toStage || toStage === stage) return;
  await transitionVendorWorkflow(
    {
      organizationId: input.organizationId,
      vendorId: input.vendorId,
      actorUserId: input.actorUserId,
      toStage,
      reason: `assignment_${input.assignmentStatus}`,
      force: true,
      gates: { hasOpenAssignment: true }
    },
    supabase
  );
}

/** Invoice submitted / approved / paid automations. */
export async function advanceVendorFromInvoiceEvent(input: {
  organizationId: string;
  vendorId: string;
  actorUserId: string;
  event: "submitted" | "approved" | "paid";
  client?: SupabaseClientType;
}): Promise<void> {
  const supabase = privilegedClient(input.client ?? (await createAuthServerComponentClient()));
  const map: Record<typeof input.event, VendorWorkflowStage> = {
    submitted: "invoice_submitted",
    approved: "payment_pending",
    paid: "paid"
  };
  await transitionVendorWorkflow(
    {
      organizationId: input.organizationId,
      vendorId: input.vendorId,
      actorUserId: input.actorUserId,
      toStage: map[input.event],
      reason: `invoice_${input.event}`,
      force: true,
      gates: {
        invoiceSubmitted: true,
        invoiceApproved: input.event !== "submitted",
        paymentRecorded: input.event === "paid"
      }
    },
    supabase
  );
  if (input.event === "paid") {
    await transitionVendorWorkflow(
      {
        organizationId: input.organizationId,
        vendorId: input.vendorId,
        actorUserId: input.actorUserId,
        toStage: "performance_review",
        reason: "paid_automation",
        force: true
      },
      supabase
    );
  }
}

export async function listVendorWorkflowEvents(
  organizationId: string,
  options: { vendorId?: string; limit?: number } = {},
  client?: SupabaseClientType
): Promise<
  Array<{
    id: string;
    fromStage: string | null;
    toStage: string;
    reason: string | null;
    createdAt: string;
    vendorId: string;
  }>
> {
  const supabase = client ?? (await createAuthServerComponentClient());
  let query = (supabase as unknown as UntypedDb)
    .from("vendor_workflow_events")
    .select("id, from_stage, to_stage, reason, created_at, vendor_id")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(options.limit ?? 50);
  if (options.vendorId) query = query.eq("vendor_id", options.vendorId);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return ((data as Array<Record<string, unknown>>) ?? []).map((row) => ({
    id: String(row["id"]),
    fromStage: (row["from_stage"] as string | null) ?? null,
    toStage: String(row["to_stage"]),
    reason: (row["reason"] as string | null) ?? null,
    createdAt: String(row["created_at"]),
    vendorId: String(row["vendor_id"])
  }));
}
