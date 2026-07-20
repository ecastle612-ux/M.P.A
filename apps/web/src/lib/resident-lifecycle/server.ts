import type { Json } from "@mpa/supabase";
import { createAuthServerComponentClient } from "../auth/server";
import { convertApplicantToResident, getApplicantForOrganization } from "../applicant/server";
import { applyLeaseMutation, createLease } from "../lease/server";
import { notify } from "../notifications/service";
import { createTenant, getTenantForOrganization, updateTenant } from "../tenant/server";
import type { TenantRecord } from "../tenant/contracts";
import type { LeaseRecord } from "../lease/contracts";
import {
  emptyMoveInChecklist,
  emptyMoveOutChecklist,
  type BulkLifecycleAction,
  type MoveInChecklist,
  type MoveInDraftInput,
  type MoveOutChecklist,
  type MoveOutDraftInput,
  type ResidentLifecycleOpsMetrics,
  type ResidentLifecycleStatus,
  type TransferUnitInput
} from "./contracts";

type SupabaseClientType = Awaited<ReturnType<typeof createAuthServerComponentClient>>;

/** Loose table access for tables not yet in generated Database types (e.g. rent_charges). */
function db(client: SupabaseClientType) {
  return client as unknown as {
    from: (table: string) => ReturnType<SupabaseClientType["from"]>;
  };
}

export type MoveInPreview = {
  unit: {
    id: string;
    unitNumber: string;
    occupancyStatus: string;
    rentAmount: number | null;
    depositAmount: number | null;
    propertyId: string;
    propertyName: string | null;
  };
  hasActiveLease: boolean;
  activeLeaseId: string | null;
  occupiedBlocked: boolean;
};

export type MoveInResult = {
  tenant: TenantRecord;
  lease: LeaseRecord;
  checklist: MoveInChecklist;
  invitationSent: boolean;
  welcomeSent: boolean;
};

export type MoveOutResult = {
  tenant: TenantRecord;
  lease: LeaseRecord | null;
  checklist: MoveOutChecklist;
};

export async function getMoveInPreview(
  organizationId: string,
  propertyId: string,
  unitId: string,
  client?: SupabaseClientType
): Promise<MoveInPreview> {
  const supabase = await resolveClient(client);
  const { data: unit, error } = await supabase
    .from("units")
    .select("id, unit_number, occupancy_status, rent_amount, deposit_amount, property_id, properties(name)")
    .eq("organization_id", organizationId)
    .eq("id", unitId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!unit) throw new Error("Unit not found.");
  if (unit.property_id !== propertyId) throw new Error("Selected unit does not belong to the selected property.");

  const { data: activeLease } = await supabase
    .from("leases")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("unit_id", unitId)
    .eq("status", "active")
    .is("deleted_at", null)
    .maybeSingle();

  const occupancyStatus = String(unit.occupancy_status);
  const occupiedBlocked = occupancyStatus === "occupied" || Boolean(activeLease);

  return {
    unit: {
      id: unit.id as string,
      unitNumber: String(unit.unit_number),
      occupancyStatus,
      rentAmount: unit.rent_amount != null ? Number(unit.rent_amount) : null,
      depositAmount: unit.deposit_amount != null ? Number(unit.deposit_amount) : null,
      propertyId: unit.property_id as string,
      propertyName: (unit.properties as { name: string } | null)?.name ?? null
    },
    hasActiveLease: Boolean(activeLease),
    activeLeaseId: (activeLease?.id as string | undefined) ?? null,
    occupiedBlocked
  };
}

export async function buildMoveInChecklist(
  organizationId: string,
  tenantId: string,
  leaseId: string | null,
  client?: SupabaseClientType
): Promise<MoveInChecklist> {
  const supabase = await resolveClient(client);
  const checklist = emptyMoveInChecklist();

  const tenant = await getTenantForOrganization(organizationId, tenantId, supabase);
  if (!tenant) return checklist;

  const applicantId =
    typeof tenant.metadata["convertedFromApplicantId"] === "string"
      ? tenant.metadata["convertedFromApplicantId"]
      : null;

  if (applicantId) {
    const { data: screening } = await supabase
      .from("screening_cases")
      .select("id, status, result_summary")
      .eq("organization_id", organizationId)
      .eq("applicant_id", applicantId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const status = screening?.status ? String(screening.status).toLowerCase() : "";
    const summary = screening?.result_summary ? String(screening.result_summary).toLowerCase() : "";
    checklist.screeningComplete =
      status.includes("complete") ||
      status.includes("decid") ||
      status === "ready_for_review" ||
      summary.includes("approv");
  }

  if (leaseId) {
    const { data: lease } = await supabase
      .from("leases")
      .select("id, status, signed_at, security_deposit")
      .eq("organization_id", organizationId)
      .eq("id", leaseId)
      .is("deleted_at", null)
      .maybeSingle();
    if (lease) {
      checklist.leaseGenerated = true;
      checklist.leaseSigned = Boolean(lease.signed_at) || lease.status === "signed" || lease.status === "active";

      if (Number(lease.security_deposit) <= 0) {
        checklist.depositReceived = true;
      } else {
        const { data: depositChargeRaw } = await db(supabase)
          .from("rent_charges")
          .select("id, outstanding_balance, status")
          .eq("organization_id", organizationId)
          .eq("lease_id", leaseId)
          .eq("charge_type", "security_deposit")
          .is("deleted_at", null)
          .maybeSingle();
        const depositCharge = depositChargeRaw as unknown as {
          outstanding_balance: number;
          status: string;
        } | null;
        checklist.depositReceived =
          !depositCharge ||
          Number(depositCharge.outstanding_balance) <= 0 ||
          depositCharge.status === "paid";
      }
    }
  }

  const { count: docCount } = await supabase
    .from("vault_documents")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("entity_type", "tenant")
    .eq("entity_id", tenantId)
    .is("deleted_at", null);
  checklist.documentsUploaded = (docCount ?? 0) > 0 || Boolean(tenant.documentsPlaceholder);

  const { data: invitation } = await supabase
    .from("organization_invitations")
    .select("id, status")
    .eq("organization_id", organizationId)
    .eq("email", tenant.email.toLowerCase())
    .in("status", ["pending", "accepted"])
    .limit(1)
    .maybeSingle();

  const { data: tenantRow } = await supabase
    .from("tenants")
    .select("user_id")
    .eq("organization_id", organizationId)
    .eq("id", tenantId)
    .maybeSingle();

  checklist.portalReady = Boolean(tenantRow?.user_id) || invitation?.status === "accepted";
  checklist.welcomeEmail = Boolean(tenant.metadata["welcomeEmailSentAt"]);
  checklist.welcomeSms = Boolean(tenant.metadata["welcomeSmsSentAt"]);
  checklist.pushEnabled = Boolean(tenant.metadata["pushEnabled"]) || Boolean(tenantRow?.user_id);

  return checklist;
}

export async function completeResidentMoveIn(
  organizationId: string,
  userId: string,
  input: MoveInDraftInput,
  options: { canOverrideOccupied: boolean },
  client?: SupabaseClientType
): Promise<MoveInResult> {
  const supabase = await resolveClient(client);
  const preview = await getMoveInPreview(organizationId, input.propertyId, input.unitId, supabase);
  if (preview.occupiedBlocked && !input.overrideOccupied) {
    throw new Error("Selected unit is occupied. Enable override to continue.");
  }
  if (preview.occupiedBlocked && input.overrideOccupied && !options.canOverrideOccupied) {
    throw new Error("You do not have permission to assign an occupied unit.");
  }

  let tenant: TenantRecord;

  if (input.source === "applicant") {
    if (!input.applicantId) throw new Error("Applicant is required.");
    const applicant = await getApplicantForOrganization(organizationId, input.applicantId, supabase);
    if (!applicant) throw new Error("Applicant not found.");

    if (applicant.tenantId) {
      const existing = await getTenantForOrganization(organizationId, applicant.tenantId, supabase);
      if (!existing) throw new Error("Linked resident not found.");
      const updated = await updateTenant(
        organizationId,
        existing.id,
        userId,
        {
          propertyId: input.propertyId,
          unitId: input.unitId,
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          phone: input.phone ?? null,
          emergencyContactName: input.emergencyContactName ?? null,
          emergencyContactPhone: input.emergencyContactPhone ?? null,
          moveInDate: input.moveInDate,
          notes: mergeNotes(existing.notes, input),
          lifecycleStatus: "awaiting_move_in",
          metadata: {
            ...existing.metadata,
            pets: input.pets,
            vehicles: input.vehicles,
            coResidents: input.coResidents,
            guarantors: input.guarantors,
            moveInSource: "applicant"
          }
        },
        supabase
      );
      if (!updated) throw new Error("Could not update resident.");
      tenant = updated;
    } else {
      const converted = await convertApplicantToResident(organizationId, input.applicantId, userId, supabase);
      const updated = await updateTenant(
        organizationId,
        converted.tenantId,
        userId,
        {
          propertyId: input.propertyId,
          unitId: input.unitId,
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          phone: input.phone ?? null,
          emergencyContactName: input.emergencyContactName ?? null,
          emergencyContactPhone: input.emergencyContactPhone ?? null,
          moveInDate: input.moveInDate,
          notes: mergeNotes(null, input),
          lifecycleStatus: "awaiting_move_in",
          metadata: {
            pets: input.pets,
            vehicles: input.vehicles,
            coResidents: input.coResidents,
            guarantors: input.guarantors,
            moveInSource: "applicant",
            convertedFromApplicantId: input.applicantId
          }
        },
        supabase
      );
      if (!updated) throw new Error("Could not update converted resident.");
      tenant = updated;
    }
  } else {
    tenant = await createTenant(
      organizationId,
      userId,
      {
        propertyId: input.propertyId,
        unitId: input.unitId,
        firstName: input.firstName,
        lastName: input.lastName,
        preferredName: null,
        email: input.email,
        avatarUrl: null,
        avatarMediaAssetId: null,
        phone: input.phone ?? null,
        dateOfBirth: null,
        moveInDate: input.moveInDate,
        moveOutDate: null,
        documentsPlaceholder: null,
        emergencyContactName: input.emergencyContactName ?? null,
        emergencyContactPhone: input.emergencyContactPhone ?? null,
        notes: mergeNotes(null, input),
        status: "active",
        lifecycleStatus: "awaiting_move_in",
        metadata: {
          pets: input.pets,
          vehicles: input.vehicles,
          coResidents: input.coResidents,
          guarantors: input.guarantors,
          moveInSource: "direct"
        }
      },
      supabase
    );
  }

  await ensureResidentDocumentFolder(organizationId, tenant.id, userId, supabase);

  let lease = await findOpenLeaseForTenant(organizationId, tenant.id, supabase);
  if (!lease) {
    lease = await createLease(
      organizationId,
      userId,
      {
        propertyId: input.propertyId,
        unitId: input.unitId,
        primaryTenantId: tenant.id,
        coTenantPlaceholder: input.coResidents ?? null,
        leaseType: "residential",
        status: "draft",
        startDate: input.leaseStartDate,
        endDate: input.leaseEndDate,
        moveInDate: input.moveInDate,
        moveOutDate: null,
        rentAmount: input.rentAmount,
        securityDeposit: input.securityDeposit,
        lateFeePlaceholder: null,
        renewalOption: false,
        noticePeriodDays: 30,
        renewalStatus: "none",
        internalNotes: null,
        metadata: { createdVia: "resident_move_in_wizard" },
      },
      supabase
    );
  }

  await recordLifecycleEvent(
    organizationId,
    tenant.id,
    lease.id,
    userId,
    "move_in_started",
    `Move-in started for ${tenant.firstName} ${tenant.lastName}`,
    { source: input.source, unitId: input.unitId },
    supabase
  );

  if (input.activateLease !== false) {
    if (lease.status === "draft") {
      const signed = await applyLeaseMutation(organizationId, lease.id, userId, { action: "sign" }, supabase);
      if (signed) lease = signed;
    }
    if (lease.status === "signed" || lease.status === "draft") {
      const activated = await applyLeaseMutation(organizationId, lease.id, userId, { action: "activate" }, supabase);
      if (activated) lease = activated;
    }
  } else {
    await updateTenant(
      organizationId,
      tenant.id,
      userId,
      { lifecycleStatus: "awaiting_signature" },
      supabase
    );
  }

  const invitationSent = await inviteResidentPortal(organizationId, tenant.email, userId, supabase);
  let welcomeSent = false;
  if (input.sendWelcome !== false) {
    welcomeSent = await sendWelcomeNotifications(organizationId, userId, tenant, lease, supabase);
  }

  const activatedTenant = await updateTenant(
    organizationId,
    tenant.id,
    userId,
    {
      status: "active",
      lifecycleStatus: input.activateLease === false ? "awaiting_signature" : "active",
      moveInDate: input.moveInDate,
      propertyId: input.propertyId,
      unitId: input.unitId,
      metadata: {
        ...tenant.metadata,
        pets: input.pets,
        vehicles: input.vehicles,
        coResidents: input.coResidents,
        guarantors: input.guarantors,
        welcomeEmailSentAt: welcomeSent ? new Date().toISOString() : tenant.metadata["welcomeEmailSentAt"],
        portalInviteSentAt: invitationSent ? new Date().toISOString() : tenant.metadata["portalInviteSentAt"],
        moveInCompletedAt: new Date().toISOString()
      }
    },
    supabase
  );

  const finalTenant = activatedTenant ?? tenant;
  const checklist = await buildMoveInChecklist(organizationId, finalTenant.id, lease.id, supabase);
  checklist.leaseGenerated = true;
  checklist.leaseSigned = lease.status === "signed" || lease.status === "active" || Boolean(lease.signedAt);
  checklist.portalReady = checklist.portalReady || invitationSent;
  checklist.welcomeEmail = checklist.welcomeEmail || welcomeSent;

  await updateTenant(
    organizationId,
    finalTenant.id,
    userId,
    {
      metadata: {
        ...finalTenant.metadata,
        moveInChecklist: checklist
      }
    },
    supabase
  );

  await recordLifecycleEvent(
    organizationId,
    finalTenant.id,
    lease.id,
    userId,
    "move_in_completed",
    `Resident activated: ${finalTenant.firstName} ${finalTenant.lastName}`,
    {
      leaseId: lease.id,
      invitationSent,
      welcomeSent,
      checklist,
      occupancyUpdated: true
    },
    supabase
  );

  if (finalTenant.propertyId) {
    const { ingestResidentMovedIn } = await import("../facility/ingest");
    await ingestResidentMovedIn({
      organizationId,
      userId,
      tenantId: finalTenant.id,
      propertyId: finalTenant.propertyId,
      unitId: finalTenant.unitId,
      residentName: `${finalTenant.firstName} ${finalTenant.lastName}`,
      client: supabase
    });
  }

  return {
    tenant: (await getTenantForOrganization(organizationId, finalTenant.id, supabase)) ?? finalTenant,
    lease,
    checklist,
    invitationSent,
    welcomeSent
  };
}

export async function getMoveOutContext(
  organizationId: string,
  tenantId: string,
  client?: SupabaseClientType
): Promise<{
  tenant: TenantRecord & { propertyName: string | null; unitNumber: string | null };
  lease: LeaseRecord | null;
  balance: number;
}> {
  const supabase = await resolveClient(client);
  const tenant = await getTenantForOrganization(organizationId, tenantId, supabase);
  if (!tenant) throw new Error("Resident not found.");

  const { data: leaseRows } = await supabase
    .from("leases")
    .select("id, status")
    .eq("organization_id", organizationId)
    .eq("primary_tenant_id", tenantId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  const preferred =
    (leaseRows ?? []).find((row) => row.status === "active") ?? (leaseRows ?? [])[0] ?? null;
  const lease = preferred
    ? await (await import("../lease/server")).getLeaseForOrganization(organizationId, preferred.id as string, supabase)
    : null;

  let balance = 0;
  if (lease) {
    const { data: charges } = await db(supabase)
      .from("rent_charges")
      .select("outstanding_balance")
      .eq("organization_id", organizationId)
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .gt("outstanding_balance", 0);
    balance = ((charges ?? []) as unknown as Array<{ outstanding_balance: number }>).reduce(
      (sum, row) => sum + Number(row.outstanding_balance),
      0
    );
  }

  return { tenant, lease, balance };
}

export async function completeResidentMoveOut(
  organizationId: string,
  userId: string,
  input: MoveOutDraftInput,
  client?: SupabaseClientType
): Promise<MoveOutResult> {
  const supabase = await resolveClient(client);
  const context = await getMoveOutContext(organizationId, input.tenantId, supabase);
  const leaseId = input.leaseId ?? context.lease?.id ?? null;

  await updateTenant(
    organizationId,
    input.tenantId,
    userId,
    {
      lifecycleStatus: "moving_out",
      moveOutDate: input.moveOutDate,
      metadata: {
        ...context.tenant.metadata,
        moveOutReason: input.reason,
        forwardingAddress: input.forwardingAddress,
        depositDisposition: input.depositDisposition,
        finalChargesAmount: input.finalChargesAmount,
        finalChargesNote: input.finalChargesNote
      }
    },
    supabase
  );

  await recordLifecycleEvent(
    organizationId,
    input.tenantId,
    leaseId,
    userId,
    "move_out_started",
    `Move-out started for ${context.tenant.firstName} ${context.tenant.lastName}`,
    { moveOutDate: input.moveOutDate, reason: input.reason },
    supabase
  );

  let lease: LeaseRecord | null = context.lease;
  if (leaseId) {
    const moved = await applyLeaseMutation(
      organizationId,
      leaseId,
      userId,
      { action: "move_out", moveOutDate: input.moveOutDate },
      supabase
    );
    if (moved) lease = moved;
  }

  const accessDisabled = await disableResidentPortalAccess(
    organizationId,
    input.tenantId,
    userId,
    supabase
  );

  await archiveResidentConversations(organizationId, input.tenantId, userId, supabase);
  await archiveResidentDocuments(organizationId, input.tenantId, userId, supabase);

  const checklist: MoveOutChecklist = {
    ...emptyMoveOutChecklist(),
    ...input.checklist,
    documentsArchived: true,
    accessDisabled,
    depositResolved: Boolean(input.depositDisposition && input.depositDisposition !== "pending"),
    finalBalanceSettled:
      context.balance <= 0 || Boolean(input.checklist?.finalBalanceSettled) || Boolean(input.finalChargesAmount != null)
  };

  const tenant = await updateTenant(
    organizationId,
    input.tenantId,
    userId,
    {
      status: "inactive",
      lifecycleStatus: "former",
      moveOutDate: input.moveOutDate,
      unitId: null,
      metadata: {
        ...context.tenant.metadata,
        moveOutReason: input.reason,
        forwardingAddress: input.forwardingAddress,
        depositDisposition: input.depositDisposition,
        finalChargesAmount: input.finalChargesAmount,
        finalChargesNote: input.finalChargesNote,
        moveOutChecklist: checklist,
        moveOutCompletedAt: new Date().toISOString(),
        archivedPropertyId: context.tenant.propertyId,
        archivedUnitId: context.tenant.unitId
      }
    },
    supabase
  );

  if (!tenant) throw new Error("Could not complete move-out.");

  await recordLifecycleEvent(
    organizationId,
    tenant.id,
    lease?.id ?? null,
    userId,
    "move_out_completed",
    `Former resident archived: ${tenant.firstName} ${tenant.lastName}`,
    {
      checklist,
      leaseClosed: Boolean(lease),
      occupancyUpdated: true,
      historicalRecordsPreserved: true
    },
    supabase
  );

  const archivedPropertyId =
    typeof tenant.metadata["archivedPropertyId"] === "string"
      ? tenant.metadata["archivedPropertyId"]
      : context.tenant.propertyId;
  const archivedUnitId =
    typeof tenant.metadata["archivedUnitId"] === "string"
      ? tenant.metadata["archivedUnitId"]
      : context.tenant.unitId;
  if (archivedPropertyId) {
    const { ingestResidentMovedOut } = await import("../facility/ingest");
    await ingestResidentMovedOut({
      organizationId,
      userId,
      tenantId: tenant.id,
      propertyId: archivedPropertyId,
      unitId: archivedUnitId,
      residentName: `${tenant.firstName} ${tenant.lastName}`,
      client: supabase
    });
  }

  await notifyStaffOfMoveOut(organizationId, userId, tenant, lease, supabase);

  return { tenant, lease, checklist };
}

export async function getResidentLifecycleOpsMetrics(
  organizationId: string,
  client?: SupabaseClientType
): Promise<ResidentLifecycleOpsMetrics> {
  const supabase = await resolveClient(client);
  const today = new Date().toISOString().slice(0, 10);
  const horizon = addDays(today, 60);

  const [
    pendingMoveIns,
    pendingMoveOuts,
    awaitingInvitation,
    tenants,
    leasesExpiring,
    unitsVacating
  ] = await Promise.all([
    countTenantsByLifecycle(organizationId, ["awaiting_move_in", "awaiting_signature"], supabase),
    countTenantsByLifecycle(organizationId, ["notice_given", "moving_out"], supabase),
    countAwaitingInvitation(organizationId, supabase),
    supabase
      .from("tenants")
      .select("id, lifecycle_status, user_id, documents_placeholder, metadata")
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .neq("lifecycle_status", "former"),
    supabase
      .from("leases")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("status", "active")
      .is("deleted_at", null)
      .gte("end_date", today)
      .lte("end_date", horizon),
    supabase
      .from("leases")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("status", "active")
      .is("deleted_at", null)
      .not("move_out_date", "is", null)
      .gte("move_out_date", today)
      .lte("move_out_date", horizon)
  ]);

  const tenantRows = (tenants.data ?? []) as Array<{
    id: string;
    lifecycle_status: string;
    user_id: string | null;
    documents_placeholder: string | null;
    metadata: Record<string, unknown> | null;
  }>;

  const tenantIds = tenantRows.map((row) => row.id);
  const { data: leaseRows } = tenantIds.length
    ? await supabase
        .from("leases")
        .select("id, primary_tenant_id, security_deposit, status")
        .eq("organization_id", organizationId)
        .in("primary_tenant_id", tenantIds)
        .is("deleted_at", null)
    : { data: [] as Array<{ id: string; primary_tenant_id: string; security_deposit: number; status: string }> };

  const leasesByTenant = new Map<string, Array<{ id: string; security_deposit: number; status: string }>>();
  for (const row of (leaseRows ?? []) as Array<{
    id: string;
    primary_tenant_id: string;
    security_deposit: number;
    status: string;
  }>) {
    const list = leasesByTenant.get(row.primary_tenant_id) ?? [];
    list.push({ id: row.id, security_deposit: Number(row.security_deposit), status: row.status });
    leasesByTenant.set(row.primary_tenant_id, list);
  }

  let missingLease = 0;
  let missingDeposit = 0;
  let missingDocuments = 0;

  for (const tenant of tenantRows) {
    const leases = leasesByTenant.get(tenant.id) ?? [];
    if (leases.length === 0) missingLease += 1;

    const activeOrSigned = leases.find((lease) => lease.status === "active" || lease.status === "signed");
    if (activeOrSigned && activeOrSigned.security_deposit > 0) {
      const { data: depositRaw } = await db(supabase)
        .from("rent_charges")
        .select("outstanding_balance, status")
        .eq("organization_id", organizationId)
        .eq("lease_id", activeOrSigned.id)
        .eq("charge_type", "security_deposit")
        .is("deleted_at", null)
        .maybeSingle();
      const deposit = depositRaw as unknown as { outstanding_balance: number; status: string } | null;
      if (deposit && Number(deposit.outstanding_balance) > 0 && deposit.status !== "paid") {
        missingDeposit += 1;
      } else if (!deposit) {
        missingDeposit += 1;
      }
    }

    const { count: docs } = await supabase
      .from("vault_documents")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("entity_type", "tenant")
      .eq("entity_id", tenant.id)
      .is("deleted_at", null);
    if ((docs ?? 0) === 0 && !tenant.documents_placeholder) {
      missingDocuments += 1;
    }
  }

  return {
    pendingMoveIns,
    pendingMoveOuts,
    awaitingInvitation,
    missingLease,
    missingDeposit,
    missingDocuments,
    unitsBecomingVacant: unitsVacating.count ?? 0,
    upcomingLeaseExpirations: leasesExpiring.count ?? 0
  };
}

export async function runBulkLifecycleAction(
  organizationId: string,
  userId: string,
  input: BulkLifecycleAction,
  client?: SupabaseClientType
): Promise<{ processed: number; results: Array<{ tenantId: string; ok: boolean; message: string }> }> {
  const supabase = await resolveClient(client);
  const results: Array<{ tenantId: string; ok: boolean; message: string }> = [];

  for (const tenantId of input.tenantIds) {
    try {
      const tenant = await getTenantForOrganization(organizationId, tenantId, supabase);
      if (!tenant) {
        results.push({ tenantId, ok: false, message: "Not found" });
        continue;
      }

      if (input.action === "invite" || input.action === "activate_portal") {
        const sent = await inviteResidentPortal(organizationId, tenant.email, userId, supabase);
        await updateTenant(
          organizationId,
          tenantId,
          userId,
          {
            metadata: {
              ...tenant.metadata,
              portalInviteSentAt: new Date().toISOString()
            }
          },
          supabase
        );
        await recordLifecycleEvent(
          organizationId,
          tenantId,
          null,
          userId,
          "portal_invite_sent",
          `Portal invitation ${sent ? "sent" : "already pending"} for ${tenant.email}`,
          { bulk: true, action: input.action },
          supabase
        );
        results.push({ tenantId, ok: true, message: sent ? "Invite sent" : "Invite already pending/accepted" });
      } else if (input.action === "send_welcome") {
        const lease = await findOpenLeaseForTenant(organizationId, tenantId, supabase);
        if (!lease) {
          results.push({ tenantId, ok: false, message: "No lease to welcome against" });
          continue;
        }
        const welcomeSent = await sendWelcomeNotifications(organizationId, userId, tenant, lease, supabase);
        await updateTenant(
          organizationId,
          tenantId,
          userId,
          {
            metadata: {
              ...tenant.metadata,
              welcomeEmailSentAt: new Date().toISOString()
            }
          },
          supabase
        );
        await recordLifecycleEvent(
          organizationId,
          tenantId,
          lease.id,
          userId,
          "welcome_sent",
          `Welcome workflow ${welcomeSent ? "sent" : "queued"} for ${tenant.firstName} ${tenant.lastName}`,
          { bulk: true },
          supabase
        );
        results.push({ tenantId, ok: true, message: welcomeSent ? "Welcome sent" : "Welcome recorded" });
      } else if (input.action === "mark_awaiting_move_in") {
        await updateTenant(
          organizationId,
          tenantId,
          userId,
          { lifecycleStatus: "awaiting_move_in", status: "active" },
          supabase
        );
        await recordLifecycleEvent(
          organizationId,
          tenantId,
          null,
          userId,
          "lifecycle_updated",
          "Marked awaiting move-in (bulk)",
          { bulk: true },
          supabase
        );
        results.push({ tenantId, ok: true, message: "Marked awaiting move-in" });
      }
    } catch (error) {
      results.push({
        tenantId,
        ok: false,
        message: error instanceof Error ? error.message : "Failed"
      });
    }
  }

  return { processed: results.filter((row) => row.ok).length, results };
}

export async function transferResidentUnit(
  organizationId: string,
  userId: string,
  input: TransferUnitInput,
  options: { canOverrideOccupied: boolean },
  client?: SupabaseClientType
): Promise<{ tenant: TenantRecord; leaseId: string | null; previousUnitId: string | null }> {
  const supabase = await resolveClient(client);
  const tenant = await getTenantForOrganization(organizationId, input.tenantId, supabase);
  if (!tenant) throw new Error("Resident not found.");
  if (tenant.lifecycleStatus === "former") {
    throw new Error("Former residents cannot be transferred. Move them in again instead.");
  }

  const preview = await getMoveInPreview(organizationId, input.propertyId, input.unitId, supabase);
  if (preview.occupiedBlocked && input.unitId !== tenant.unitId) {
    if (!input.overrideOccupied) {
      throw new Error("Destination unit is occupied. Enable override to continue.");
    }
    if (!options.canOverrideOccupied) {
      throw new Error("You do not have permission to transfer into an occupied unit.");
    }
  }

  const previousUnitId = tenant.unitId;
  const lease =
    (input.leaseId
      ? await (await import("../lease/server")).getLeaseForOrganization(organizationId, input.leaseId, supabase)
      : null) ?? (await findOpenLeaseForTenant(organizationId, tenant.id, supabase));

  if (lease && lease.status === "active" && lease.unitId !== input.unitId) {
    const { data: conflict } = await supabase
      .from("leases")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("unit_id", input.unitId)
      .eq("status", "active")
      .neq("id", lease.id)
      .is("deleted_at", null)
      .maybeSingle();
    if (conflict && !input.overrideOccupied) {
      throw new Error("Destination unit already has an active lease.");
    }
  }

  const updatedTenant = await updateTenant(
    organizationId,
    tenant.id,
    userId,
    {
      propertyId: input.propertyId,
      unitId: input.unitId,
      metadata: {
        ...tenant.metadata,
        lastTransferAt: new Date().toISOString(),
        lastTransferReason: input.reason,
        previousUnitId
      }
    },
    supabase
  );
  if (!updatedTenant) throw new Error("Could not update resident assignment.");

  if (lease) {
    const { error: leaseError } = await supabase
      .from("leases")
      .update({
        property_id: input.propertyId,
        unit_id: input.unitId,
        updated_by: userId
      })
      .eq("organization_id", organizationId)
      .eq("id", lease.id)
      .is("deleted_at", null);
    if (leaseError) throw new Error(leaseError.message);

    // Occupancy: destination occupied; previous unit refreshed from active leases
    await supabase
      .from("units")
      .update({ occupancy_status: "occupied", updated_by: userId })
      .eq("organization_id", organizationId)
      .eq("id", input.unitId)
      .is("deleted_at", null);

    if (previousUnitId && previousUnitId !== input.unitId) {
      const { data: stillActive } = await supabase
        .from("leases")
        .select("id")
        .eq("organization_id", organizationId)
        .eq("unit_id", previousUnitId)
        .eq("status", "active")
        .is("deleted_at", null)
        .limit(1);
      if (!stillActive?.length) {
        await supabase
          .from("units")
          .update({ occupancy_status: "vacant_ready", updated_by: userId })
          .eq("organization_id", organizationId)
          .eq("id", previousUnitId)
          .is("deleted_at", null);
      }
    }
  }

  await recordLifecycleEvent(
    organizationId,
    tenant.id,
    lease?.id ?? null,
    userId,
    "unit_transferred",
    `Transferred ${tenant.firstName} ${tenant.lastName} to a new unit`,
    {
      previousUnitId,
      propertyId: input.propertyId,
      unitId: input.unitId,
      reason: input.reason,
      leaseId: lease?.id ?? null
    },
    supabase
  );

  await notify(
    {
      organizationId,
      actorUserId: userId,
      eventKey: `resident.transfer:${tenant.id}:${input.unitId}`,
      recipientUserIds: [userId],
      category: "leases",
      priority: "normal",
      title: "Unit transfer completed",
      body: `${tenant.firstName} ${tenant.lastName} moved to a new unit.`,
      href: `/tenants/${tenant.id}`,
      sourceEntityType: "tenant",
      sourceEntityId: tenant.id,
      propertyId: input.propertyId,
      unitId: input.unitId
    },
    supabase
  ).catch(() => undefined);

  return {
    tenant: (await getTenantForOrganization(organizationId, tenant.id, supabase)) ?? updatedTenant,
    leaseId: lease?.id ?? null,
    previousUnitId
  };
}

export async function syncTenantLifecycleFromLeaseAction(
  organizationId: string,
  tenantId: string,
  userId: string,
  action: string,
  client?: SupabaseClientType
): Promise<void> {
  const supabase = await resolveClient(client);
  const map: Record<string, ResidentLifecycleStatus | undefined> = {
    sign: "awaiting_move_in",
    activate: "active",
    give_notice: "notice_given",
    move_out: "former",
    terminate: "former",
    expire: "former"
  };
  const next = map[action];
  if (!next) return;

  const patch: {
    lifecycleStatus: ResidentLifecycleStatus;
    status?: "active" | "inactive" | "archived";
    moveOutDate?: string | null;
  } = { lifecycleStatus: next };

  if (next === "former") {
    patch.status = "inactive";
  } else if (next === "active") {
    patch.status = "active";
  }

  await updateTenant(organizationId, tenantId, userId, patch, supabase);
  await recordLifecycleEvent(
    organizationId,
    tenantId,
    null,
    userId,
    "lifecycle_synced",
    `Lifecycle set to ${next} from lease action ${action}`,
    { action, lifecycleStatus: next },
    supabase
  );
}

async function findOpenLeaseForTenant(
  organizationId: string,
  tenantId: string,
  client: SupabaseClientType
): Promise<LeaseRecord | null> {
  const { data } = await client
    .from("leases")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("primary_tenant_id", tenantId)
    .in("status", ["draft", "signed", "active"])
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data?.id) return null;
  const { getLeaseForOrganization } = await import("../lease/server");
  return getLeaseForOrganization(organizationId, data.id as string, client);
}

async function ensureResidentDocumentFolder(
  organizationId: string,
  tenantId: string,
  userId: string,
  client: SupabaseClientType
): Promise<void> {
  const { count } = await client
    .from("vault_documents")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("entity_type", "tenant")
    .eq("entity_id", tenantId)
    .is("deleted_at", null);

  if ((count ?? 0) > 0) return;

  // Lightweight folder marker — preserves vault linkage without requiring uploads
  await client
    .from("tenants")
    .update({
      documents_placeholder: "Resident document folder ready",
      updated_by: userId
    })
    .eq("organization_id", organizationId)
    .eq("id", tenantId);
}

async function inviteResidentPortal(
  organizationId: string,
  email: string,
  userId: string,
  client: SupabaseClientType
): Promise<boolean> {
  const normalized = email.toLowerCase();
  const { data: existing } = await client
    .from("organization_invitations")
    .select("id, status")
    .eq("organization_id", organizationId)
    .eq("email", normalized)
    .in("status", ["pending", "accepted"])
    .limit(1)
    .maybeSingle();
  if (existing) return false;

  const { data: invitation, error } = await client
    .from("organization_invitations")
    .insert({
      organization_id: organizationId,
      email: normalized,
      roles: ["tenant"],
      invited_by: userId
    })
    .select("id, token, email, roles")
    .single();
  if (error && !error.message.toLowerCase().includes("duplicate")) {
    throw new Error(error.message);
  }
  if (!error && invitation?.token) {
    const { sendInvitationEmail } = await import("../integrations/email/delivery");
    await sendInvitationEmail({
      organizationId,
      email: normalized,
      token: invitation.token as string,
      roles: Array.isArray(invitation.roles) ? (invitation.roles as string[]) : ["tenant"],
      invitationId: invitation.id as string
    }).catch(() => undefined);
  }
  return !error;
}

async function sendWelcomeNotifications(
  organizationId: string,
  actorUserId: string,
  tenant: TenantRecord,
  lease: LeaseRecord,
  client: SupabaseClientType
): Promise<boolean> {
  const { data: tenantRow } = await client
    .from("tenants")
    .select("user_id")
    .eq("organization_id", organizationId)
    .eq("id", tenant.id)
    .maybeSingle();

  const recipients = new Set<string>();
  if (tenantRow?.user_id) recipients.add(tenantRow.user_id as string);

  const { data: memberships } = await client
    .from("organization_memberships")
    .select("user_id, roles")
    .eq("organization_id", organizationId)
    .eq("status", "active");
  for (const row of (memberships ?? []) as Array<{ user_id: string; roles: string[] | null }>) {
    if (Array.isArray(row.roles) && row.roles.includes("property_manager") && row.user_id !== actorUserId) {
      recipients.add(row.user_id);
    }
  }

  if (recipients.size === 0) {
    // Still record welcome intent for ops audit even if no linked user yet
    return true;
  }

  await notify(
    {
      organizationId,
      actorUserId,
      eventKey: `resident.welcome:${tenant.id}`,
      recipientUserIds: [...recipients],
      category: "leases",
      priority: "high",
      title: "Welcome to your new home",
      body: `${tenant.firstName} ${tenant.lastName} — lease ${lease.leaseNumber} is ready.`,
      href: `/tenants/${tenant.id}`,
      sourceEntityType: "tenant",
      sourceEntityId: tenant.id,
      propertyId: tenant.propertyId,
      unitId: tenant.unitId
    },
    client
  ).catch(() => undefined);

  return true;
}

async function disableResidentPortalAccess(
  organizationId: string,
  tenantId: string,
  userId: string,
  client: SupabaseClientType
): Promise<boolean> {
  const { data: tenant } = await client
    .from("tenants")
    .select("user_id, email")
    .eq("organization_id", organizationId)
    .eq("id", tenantId)
    .maybeSingle();

  if (tenant?.user_id) {
    await client
      .from("organization_memberships")
      .update({ status: "inactive", updated_at: new Date().toISOString() })
      .eq("organization_id", organizationId)
      .eq("user_id", tenant.user_id as string)
      .contains("roles", ["tenant"]);
  }

  if (tenant?.email) {
    await client
      .from("organization_invitations")
      .update({ status: "revoked", updated_at: new Date().toISOString() })
      .eq("organization_id", organizationId)
      .eq("email", String(tenant.email).toLowerCase())
      .eq("status", "pending");
  }

  await client
    .from("tenants")
    .update({ updated_by: userId })
    .eq("organization_id", organizationId)
    .eq("id", tenantId);

  return true;
}

async function archiveResidentConversations(
  organizationId: string,
  tenantId: string,
  userId: string,
  client: SupabaseClientType
): Promise<void> {
  const now = new Date().toISOString();
  await client
    .from("conversation_threads")
    .update({
      status: "archived",
      archived_at: now,
      archived_by: userId,
      updated_by: userId
    })
    .eq("organization_id", organizationId)
    .eq("source_entity_type", "resident")
    .eq("source_entity_id", tenantId)
    .is("deleted_at", null)
    .neq("status", "archived");
}

async function archiveResidentDocuments(
  organizationId: string,
  tenantId: string,
  userId: string,
  client: SupabaseClientType
): Promise<void> {
  const { data: docs } = await client
    .from("vault_documents")
    .select("id, metadata")
    .eq("organization_id", organizationId)
    .eq("entity_type", "tenant")
    .eq("entity_id", tenantId)
    .is("deleted_at", null);

  for (const doc of (docs ?? []) as Array<{ id: string; metadata: Record<string, unknown> | null }>) {
    await client
      .from("vault_documents")
      .update({
        metadata: {
          ...(doc.metadata ?? {}),
          archivedAt: new Date().toISOString(),
          archivedReason: "resident_move_out",
          archivedBy: userId
        },
        updated_by: userId
      })
      .eq("organization_id", organizationId)
      .eq("id", doc.id);
  }
}

async function notifyStaffOfMoveOut(
  organizationId: string,
  actorUserId: string,
  tenant: TenantRecord,
  lease: LeaseRecord | null,
  client: SupabaseClientType
): Promise<void> {
  const { data: memberships } = await client
    .from("organization_memberships")
    .select("user_id, roles")
    .eq("organization_id", organizationId)
    .eq("status", "active");

  const recipients = ((memberships ?? []) as Array<{ user_id: string; roles: string[] | null }>)
    .filter((row) => Array.isArray(row.roles) && row.roles.includes("property_manager") && row.user_id !== actorUserId)
    .map((row) => row.user_id);

  if (recipients.length === 0) return;

  await notify(
    {
      organizationId,
      actorUserId,
      eventKey: `resident.move_out:${tenant.id}`,
      recipientUserIds: recipients,
      category: "leases",
      priority: "normal",
      title: "Resident move-out completed",
      body: `${tenant.firstName} ${tenant.lastName}${lease ? ` · lease ${lease.leaseNumber}` : ""}`,
      href: `/tenants/${tenant.id}`,
      sourceEntityType: "tenant",
      sourceEntityId: tenant.id,
      propertyId: tenant.propertyId,
      unitId: tenant.unitId
    },
    client
  ).catch(() => undefined);
}

async function recordLifecycleEvent(
  organizationId: string,
  tenantId: string,
  leaseId: string | null,
  actorUserId: string,
  eventType: string,
  summary: string,
  payload: Record<string, unknown>,
  client: SupabaseClientType
): Promise<void> {
  await client.from("resident_lifecycle_events").insert({
    organization_id: organizationId,
    tenant_id: tenantId,
    lease_id: leaseId,
    event_type: eventType,
    summary,
    payload: payload as Json,
    actor_user_id: actorUserId
  });
}

async function countTenantsByLifecycle(
  organizationId: string,
  statuses: ResidentLifecycleStatus[],
  client: SupabaseClientType
): Promise<number> {
  const { count, error } = await client
    .from("tenants")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .in("lifecycle_status", statuses);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

async function countAwaitingInvitation(
  organizationId: string,
  client: SupabaseClientType
): Promise<number> {
  const { data, error } = await client
    .from("tenants")
    .select("id, email, user_id")
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .in("lifecycle_status", ["awaiting_move_in", "awaiting_signature", "active"])
    .is("user_id", null);
  if (error) throw new Error(error.message);

  let count = 0;
  for (const tenant of (data ?? []) as Array<{ id: string; email: string; user_id: string | null }>) {
    const { data: invite } = await client
      .from("organization_invitations")
      .select("id, status")
      .eq("organization_id", organizationId)
      .eq("email", tenant.email.toLowerCase())
      .eq("status", "accepted")
      .limit(1)
      .maybeSingle();
    if (!invite) count += 1;
  }
  return count;
}

function mergeNotes(existing: string | null, input: MoveInDraftInput): string | null {
  const parts = [
    existing,
    input.notes,
    input.pets ? `Pets: ${input.pets}` : null,
    input.vehicles ? `Vehicles: ${input.vehicles}` : null,
    input.guarantors ? `Guarantors: ${input.guarantors}` : null
  ].filter((part): part is string => Boolean(part && part.trim()));
  return parts.length ? parts.join("\n") : null;
}

function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

async function resolveClient(client?: SupabaseClientType): Promise<SupabaseClientType> {
  return client ?? (await createAuthServerComponentClient());
}
