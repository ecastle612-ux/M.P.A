import { appendFacilityTimelineEvent } from "./timeline";

// Accept any Supabase-shaped client from source modules (auth / communication / financial).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type IngestClient = any;

/** Best-effort timeline ingest — never blocks source workflows. */
export async function ingestTimelineEventSafe(
  organizationId: string,
  input: Parameters<typeof appendFacilityTimelineEvent>[1],
  client?: IngestClient
): Promise<void> {
  try {
    await appendFacilityTimelineEvent(organizationId, input, client);
  } catch {
    // Timeline is additive memory; source-of-record workflows must not fail.
  }
}

export async function ingestResidentMovedIn(params: {
  organizationId: string;
  userId: string;
  tenantId: string;
  propertyId: string;
  unitId: string | null;
  residentName: string;
  client?: IngestClient;
}): Promise<void> {
  await ingestTimelineEventSafe(
    params.organizationId,
    {
      propertyId: params.propertyId,
      unitId: params.unitId,
      eventType: "resident.moved_in",
      title: "Resident Move In",
      summary: `${params.residentName} moved in`,
      actorUserId: params.userId,
      performedByLabel: "Property staff",
      sourceEntityType: "tenant",
      sourceEntityId: `${params.tenantId}:moved_in`,
      href: `/tenants/${params.tenantId}`,
      payload: { tenantId: params.tenantId }
    },
    params.client
  );
}

export async function ingestResidentMovedOut(params: {
  organizationId: string;
  userId: string;
  tenantId: string;
  propertyId: string;
  unitId: string | null;
  residentName: string;
  client?: IngestClient;
}): Promise<void> {
  await ingestTimelineEventSafe(
    params.organizationId,
    {
      propertyId: params.propertyId,
      unitId: params.unitId,
      eventType: "resident.moved_out",
      title: "Resident Move Out",
      summary: `${params.residentName} moved out`,
      actorUserId: params.userId,
      performedByLabel: "Property staff",
      sourceEntityType: "tenant",
      sourceEntityId: `${params.tenantId}:moved_out`,
      href: `/tenants/${params.tenantId}`,
      payload: { tenantId: params.tenantId }
    },
    params.client
  );
}

export async function ingestLeaseLifecycle(params: {
  organizationId: string;
  userId: string;
  leaseId: string;
  propertyId: string;
  unitId: string | null;
  action: "sign" | "activate" | "renew";
  leaseNumber: string;
  client?: IngestClient;
}): Promise<void> {
  const map = {
    sign: { eventType: "lease.signed", title: "Lease Signed" },
    activate: { eventType: "lease.activated", title: "Lease Activated" },
    renew: { eventType: "lease.renewed", title: "Lease Renewed" }
  } as const;
  const config = map[params.action];
  await ingestTimelineEventSafe(
    params.organizationId,
    {
      propertyId: params.propertyId,
      unitId: params.unitId,
      eventType: config.eventType,
      title: config.title,
      summary: `${params.leaseNumber} · ${config.title}`,
      actorUserId: params.userId,
      performedByLabel: "Property staff",
      sourceEntityType: "lease",
      sourceEntityId: `${params.leaseId}:${params.action}`,
      href: `/leases/${params.leaseId}`,
      payload: { leaseId: params.leaseId, action: params.action }
    },
    params.client
  );
}

export async function ingestAnnouncementPublished(params: {
  organizationId: string;
  userId: string;
  announcementId: string;
  propertyId: string;
  title: string;
  client?: IngestClient;
}): Promise<void> {
  await ingestTimelineEventSafe(
    params.organizationId,
    {
      propertyId: params.propertyId,
      eventType: "ops.announcement_published",
      title: "Property Announcement",
      summary: params.title,
      actorUserId: params.userId,
      performedByLabel: "Property staff",
      sourceEntityType: "announcement",
      sourceEntityId: params.announcementId,
      href: `/communications/${params.announcementId}`,
      payload: { announcementId: params.announcementId }
    },
    params.client
  );
}

export async function ingestMajorExpense(params: {
  organizationId: string;
  userId: string;
  expenseId: string;
  propertyId: string;
  amount: number;
  description: string;
  expenseNumber: string;
  vendorId?: string | null;
  vendorName?: string | null;
  client?: IngestClient;
}): Promise<void> {
  // Threshold for "major" operational expense visibility on the property timeline.
  if (params.amount < 250) return;
  await ingestTimelineEventSafe(
    params.organizationId,
    {
      propertyId: params.propertyId,
      eventType: "financial.major_expense",
      title: "Major Expense",
      summary: `${params.expenseNumber} · ${params.description} · $${params.amount.toFixed(2)}`,
      actorUserId: params.userId,
      performedByLabel: params.vendorName ?? "Accounting",
      serviceProviderDisplayName: params.vendorName ?? null,
      sourceEntityType: "expense",
      sourceEntityId: params.expenseId,
      legacyVendorId: params.vendorId ?? null,
      href: `/financials/expenses`,
      payload: {
        expenseId: params.expenseId,
        amount: params.amount,
        // Future hooks: capital planning, property health cost factors
        futureHooks: ["capitalPlanning", "propertyHealth"]
      }
    },
    params.client
  );
}
