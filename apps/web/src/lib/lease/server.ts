import { createAuthServerComponentClient } from "../auth/server";
import type { Database, Json } from "@mpa/supabase";
import type {
  CreateLeaseInput,
  LeaseDocumentRecord,
  LeaseEventRecord,
  LeaseEventType,
  LeaseMutationInput,
  LeaseRecord,
  LeaseStatus,
  UpdateLeaseInput
} from "./contracts";
import {
  assertLeaseLifecycleTransition,
  buildRenewedEndDate,
  defaultMoveOutDate,
  leaseLifecycleSummary,
  recordLeaseEvent
} from "./events";

type LeaseRow = {
  id: string;
  organization_id: string;
  lease_number: string;
  property_id: string;
  unit_id: string;
  primary_tenant_id: string;
  co_tenant_placeholder: string | null;
  lease_type: LeaseRecord["leaseType"];
  status: LeaseRecord["status"];
  start_date: string;
  end_date: string;
  move_in_date: string | null;
  move_out_date: string | null;
  rent_amount: number;
  security_deposit: number;
  late_fee_placeholder: string | null;
  renewal_option: boolean;
  notice_period_days: number | null;
  renewal_status: LeaseRecord["renewalStatus"];
  internal_notes: string | null;
  signed_at: string | null;
  activated_at: string | null;
  expired_at: string | null;
  terminated_at: string | null;
  metadata: Json | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  deleted_at: string | null;
};

type LeaseRelationRow = LeaseRow & {
  properties: { name: string } | null;
  units: { unit_number: string; property_id: string } | null;
  tenants: { first_name: string; last_name: string; preferred_name: string | null } | null;
};

type LeaseDocumentRow = {
  id: string;
  organization_id: string;
  lease_id: string;
  document_type: LeaseDocumentRecord["documentType"];
  title: string;
  file_url_placeholder: string | null;
  ocr_ready: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type LeaseEventRow = {
  id: string;
  organization_id: string;
  lease_id: string;
  event_type: LeaseEventType;
  summary: string;
  payload: Json | null;
  created_by: string;
  created_at: string;
};

export type LeaseListItem = LeaseRecord & {
  propertyName: string | null;
  unitNumber: string | null;
  tenantName: string | null;
};

export type LeaseDetail = LeaseListItem & {
  documents: LeaseDocumentRecord[];
  events: LeaseEventRecord[];
};

export type LeaseDashboardMetrics = {
  activeLeases: number;
  upcomingExpirations: number;
  upcomingRenewals: number;
  upcomingMoveIns: number;
  upcomingMoveOuts: number;
  expiredLeases: number;
  renewalNeeded: number;
  occupiedUnitsFromLeases: number;
  expirationSample: LeaseListItem[];
  renewalSample: LeaseListItem[];
  moveInSample: LeaseListItem[];
  moveOutSample: LeaseListItem[];
  recentEvents: LeaseEventRecord[];
};

export type LeaseListOptions = {
  search?: string;
  status?: LeaseStatus | "all";
  renewalStatus?: LeaseRecord["renewalStatus"] | "all";
  propertyId?: string;
  unitId?: string;
  tenantId?: string;
  expiringWithinDays?: number;
  sortBy?: "updated_at" | "end_date" | "created_at" | "lease_number";
  sortOrder?: "asc" | "desc";
  limit?: number;
  offset?: number;
};

type SupabaseClientType = Awaited<ReturnType<typeof createAuthServerComponentClient>>;
type LeaseUpdate = Database["public"]["Tables"]["leases"]["Update"];

const LEASE_SELECT =
  "id, organization_id, lease_number, property_id, unit_id, primary_tenant_id, co_tenant_placeholder, lease_type, status, start_date, end_date, move_in_date, move_out_date, rent_amount, security_deposit, late_fee_placeholder, renewal_option, notice_period_days, renewal_status, internal_notes, signed_at, activated_at, expired_at, terminated_at, metadata, created_at, updated_at, archived_at, deleted_at";

const LEASE_LIST_SELECT = `${LEASE_SELECT}, properties(name), units(unit_number, property_id), tenants(first_name, last_name, preferred_name)`;

const EXPIRATION_WINDOW_DAYS = 60;
const MOVE_WINDOW_DAYS = 30;

export async function getLeasesForOrganization(
  organizationId: string,
  options: LeaseListOptions = {},
  client?: SupabaseClientType
): Promise<LeaseListItem[]> {
  const supabase = await resolveClient(client);
  let query = supabase
    .from("leases")
    .select(LEASE_LIST_SELECT)
    .eq("organization_id", organizationId)
    .is("deleted_at", null);

  const trimmedSearch = options.search?.trim();
  if (trimmedSearch) {
    const escaped = escapeLike(trimmedSearch);
    query = query.or(`lease_number.ilike.%${escaped}%,internal_notes.ilike.%${escaped}%`);
  }

  if (options.status && options.status !== "all") {
    query = query.eq("status", options.status);
  }
  if (options.renewalStatus && options.renewalStatus !== "all") {
    query = query.eq("renewal_status", options.renewalStatus);
  }
  if (options.propertyId) query = query.eq("property_id", options.propertyId);
  if (options.unitId) query = query.eq("unit_id", options.unitId);
  if (options.tenantId) query = query.eq("primary_tenant_id", options.tenantId);

  if (options.expiringWithinDays !== undefined) {
    const today = new Date().toISOString().slice(0, 10);
    const horizon = addDays(today, options.expiringWithinDays);
    query = query.gte("end_date", today).lte("end_date", horizon).eq("status", "active");
  }

  const sortBy = options.sortBy ?? "updated_at";
  const ascending = (options.sortOrder ?? "desc") === "asc";
  query = query.order(sortBy, { ascending });

  if (options.limit !== undefined) {
    const from = options.offset ?? 0;
    query = query.range(from, from + options.limit - 1);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as LeaseRelationRow[]).map(toLeaseListItem);
}

export async function getLeaseForOrganization(
  organizationId: string,
  leaseId: string,
  client?: SupabaseClientType
): Promise<LeaseDetail | null> {
  const supabase = await resolveClient(client);
  const { data, error } = await supabase
    .from("leases")
    .select(LEASE_LIST_SELECT)
    .eq("organization_id", organizationId)
    .eq("id", leaseId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const [documents, events] = await Promise.all([
    getLeaseDocuments(organizationId, leaseId, supabase),
    getLeaseEvents(organizationId, leaseId, supabase)
  ]);

  return {
    ...toLeaseListItem(data as unknown as LeaseRelationRow),
    documents,
    events
  };
}

export async function createLease(
  organizationId: string,
  userId: string,
  input: CreateLeaseInput,
  client?: SupabaseClientType
): Promise<LeaseRecord> {
  const supabase = await resolveClient(client);
  if (input.endDate < input.startDate) {
    throw new Error("End date must be on or after start date.");
  }
  await assertLeaseAssignment({
    organizationId,
    propertyId: input.propertyId,
    unitId: input.unitId,
    tenantId: input.primaryTenantId,
    client: supabase
  });

  const leaseNumber = input.leaseNumber?.trim() || (await generateLeaseNumber(organizationId, supabase));

  const { data, error } = await supabase
    .from("leases")
    .insert({
      organization_id: organizationId,
      lease_number: leaseNumber,
      property_id: input.propertyId,
      unit_id: input.unitId,
      primary_tenant_id: input.primaryTenantId,
      co_tenant_placeholder: input.coTenantPlaceholder,
      lease_type: input.leaseType,
      status: input.status,
      start_date: input.startDate,
      end_date: input.endDate,
      move_in_date: input.moveInDate,
      move_out_date: input.moveOutDate,
      rent_amount: input.rentAmount,
      security_deposit: input.securityDeposit,
      late_fee_placeholder: input.lateFeePlaceholder,
      renewal_option: input.renewalOption,
      notice_period_days: input.noticePeriodDays,
      renewal_status: input.renewalStatus,
      internal_notes: input.internalNotes,
      metadata: input.metadata as Json,
      created_by: userId,
      updated_by: userId
    })
    .select(LEASE_SELECT)
    .single();

  if (error) throw new Error(error.message);
  const lease = toLeaseRecord(data as LeaseRow);
  await recordLeaseEvent(
    organizationId,
    lease.id,
    userId,
    "lease_created",
    `Lease ${lease.leaseNumber} created`,
    { status: lease.status },
    supabase
  );
  await seedLeaseDocumentPlaceholders(organizationId, lease.id, userId, supabase);
  return lease;
}

export async function updateLease(
  organizationId: string,
  leaseId: string,
  userId: string,
  updates: UpdateLeaseInput,
  client?: SupabaseClientType
): Promise<LeaseRecord | null> {
  const supabase = await resolveClient(client);
  const existing = await getLeaseRecord(organizationId, leaseId, supabase);
  if (!existing) return null;
  if (existing.status !== "draft" && existing.status !== "signed") {
    throw new Error("Only draft or signed leases can be edited.");
  }

  const propertyId = updates.propertyId ?? existing.propertyId;
  const unitId = updates.unitId ?? existing.unitId;
  const tenantId = updates.primaryTenantId ?? existing.primaryTenantId;
  await assertLeaseAssignment({ organizationId, propertyId, unitId, tenantId, client: supabase });

  const startDate = updates.startDate ?? existing.startDate;
  const endDate = updates.endDate ?? existing.endDate;
  if (endDate < startDate) throw new Error("End date must be on or after start date.");

  const payload: LeaseUpdate = {
    updated_by: userId
  };
  if (updates.propertyId !== undefined) payload.property_id = updates.propertyId;
  if (updates.unitId !== undefined) payload.unit_id = updates.unitId;
  if (updates.primaryTenantId !== undefined) payload.primary_tenant_id = updates.primaryTenantId;
  if (updates.coTenantPlaceholder !== undefined) payload.co_tenant_placeholder = updates.coTenantPlaceholder;
  if (updates.leaseType !== undefined) payload.lease_type = updates.leaseType;
  if (updates.startDate !== undefined) payload.start_date = updates.startDate;
  if (updates.endDate !== undefined) payload.end_date = updates.endDate;
  if (updates.moveInDate !== undefined) payload.move_in_date = updates.moveInDate;
  if (updates.moveOutDate !== undefined) payload.move_out_date = updates.moveOutDate;
  if (updates.rentAmount !== undefined) payload.rent_amount = updates.rentAmount;
  if (updates.securityDeposit !== undefined) payload.security_deposit = updates.securityDeposit;
  if (updates.lateFeePlaceholder !== undefined) payload.late_fee_placeholder = updates.lateFeePlaceholder;
  if (updates.renewalOption !== undefined) payload.renewal_option = updates.renewalOption;
  if (updates.noticePeriodDays !== undefined) payload.notice_period_days = updates.noticePeriodDays;
  if (updates.internalNotes !== undefined) payload.internal_notes = updates.internalNotes;

  const { data, error } = await supabase
    .from("leases")
    .update(payload)
    .eq("organization_id", organizationId)
    .eq("id", leaseId)
    .is("deleted_at", null)
    .select(LEASE_SELECT)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? toLeaseRecord(data as LeaseRow) : null;
}

export async function applyLeaseMutation(
  organizationId: string,
  leaseId: string,
  userId: string,
  mutation: LeaseMutationInput,
  client?: SupabaseClientType
): Promise<LeaseRecord | null> {
  const supabase = await resolveClient(client);
  if (mutation.action === "archive") return archiveLease(organizationId, leaseId, userId, supabase);
  if (mutation.action === "restore") return restoreLease(organizationId, leaseId, userId, supabase);
  if (mutation.action === "soft_delete") return softDeleteLease(organizationId, leaseId, userId, supabase);
  if (mutation.action === "update") return updateLease(organizationId, leaseId, userId, mutation.updates, supabase);

  const existing = await getLeaseRecord(organizationId, leaseId, supabase);
  if (!existing) return null;

  assertLeaseLifecycleTransition(existing.status, mutation.action);

  const now = new Date().toISOString();
  const payload: LeaseUpdate = { updated_by: userId };

  if (mutation.action === "sign") {
    payload.status = "signed";
    payload.signed_at = now;
  } else if (mutation.action === "activate") {
    await assertNoActiveLeaseOnUnit(organizationId, existing.unitId, leaseId, supabase);
    payload.status = "active";
    payload.activated_at = now;
    if (!existing.signedAt) payload.signed_at = now;
  } else if (mutation.action === "offer_renewal") {
    payload.renewal_status = "offered";
  } else if (mutation.action === "renew") {
    payload.end_date = buildRenewedEndDate(existing.endDate, mutation.extensionMonths ?? 12);
    payload.renewal_status = "renewed";
    payload.status = "active";
    payload.expired_at = null;
    payload.terminated_at = null;
  } else if (mutation.action === "give_notice") {
    payload.renewal_status = "notice_given";
  } else if (mutation.action === "expire") {
    payload.status = "expired";
    payload.expired_at = now;
    payload.renewal_status = existing.renewalStatus === "notice_given" ? "notice_given" : existing.renewalStatus;
  } else if (mutation.action === "terminate") {
    payload.status = "terminated";
    payload.terminated_at = now;
  } else if (mutation.action === "move_out") {
    payload.move_out_date = mutation.moveOutDate ?? defaultMoveOutDate();
    if (existing.status === "active") {
      payload.status = "terminated";
      payload.terminated_at = now;
    }
  }

  const { data, error } = await supabase
    .from("leases")
    .update(payload)
    .eq("organization_id", organizationId)
    .eq("id", leaseId)
    .is("deleted_at", null)
    .select(LEASE_SELECT)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const lease = toLeaseRecord(data as LeaseRow);
  const eventType = lifecycleActionToEventType(mutation.action);
  if (eventType) {
    await recordLeaseEvent(
      organizationId,
      leaseId,
      userId,
      eventType,
      leaseLifecycleSummary(mutation.action, lease),
      { action: mutation.action, status: lease.status },
      supabase
    );
  }

  if (mutation.action === "activate") {
    await syncUnitOccupancyFromLease(organizationId, lease.unitId, "occupied", userId, supabase);
  }
  if (mutation.action === "expire" || mutation.action === "terminate" || mutation.action === "move_out") {
    await syncUnitOccupancyFromActiveLeases(organizationId, lease.unitId, userId, supabase);
  }

  return lease;
}

export async function getLeaseDashboardMetrics(
  organizationId: string,
  client?: SupabaseClientType
): Promise<LeaseDashboardMetrics> {
  const supabase = await resolveClient(client);
  const today = new Date().toISOString().slice(0, 10);
  const expirationHorizon = addDays(today, EXPIRATION_WINDOW_DAYS);
  const moveHorizon = addDays(today, MOVE_WINDOW_DAYS);

  const [
    { count: activeLeases, error: activeError },
    { count: expiredLeases, error: expiredError },
    { count: upcomingExpirations, error: expiringError },
    { count: upcomingRenewals, error: renewalError },
    { count: upcomingMoveIns, error: moveInError },
    { count: upcomingMoveOuts, error: moveOutError },
    { count: renewalNeeded, error: renewalNeededError },
    { data: expirationRows, error: expirationSampleError },
    { data: renewalRows, error: renewalSampleError },
    { data: moveInRows, error: moveInSampleError },
    { data: moveOutRows, error: moveOutSampleError },
    { data: eventRows, error: eventsError }
  ] = await Promise.all([
    supabase.from("leases").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("status", "active").is("deleted_at", null),
    supabase.from("leases").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("status", "expired").is("deleted_at", null),
    supabase.from("leases").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("status", "active").is("deleted_at", null).gte("end_date", today).lte("end_date", expirationHorizon),
    supabase.from("leases").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("status", "active").is("deleted_at", null).in("renewal_status", ["offered", "pending"]),
    supabase.from("leases").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).is("deleted_at", null).in("status", ["draft", "signed", "active"]).not("move_in_date", "is", null).gte("move_in_date", today).lte("move_in_date", moveHorizon),
    supabase.from("leases").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).is("deleted_at", null).in("status", ["active", "expired", "terminated"]).not("move_out_date", "is", null).gte("move_out_date", today).lte("move_out_date", moveHorizon),
    supabase.from("leases").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("status", "active").is("deleted_at", null).lte("end_date", expirationHorizon).in("renewal_status", ["none", "declined"]),
    supabase.from("leases").select(LEASE_LIST_SELECT).eq("organization_id", organizationId).eq("status", "active").is("deleted_at", null).gte("end_date", today).lte("end_date", expirationHorizon).order("end_date", { ascending: true }).limit(5),
    supabase.from("leases").select(LEASE_LIST_SELECT).eq("organization_id", organizationId).eq("status", "active").is("deleted_at", null).in("renewal_status", ["offered", "pending", "notice_given"]).order("end_date", { ascending: true }).limit(5),
    supabase.from("leases").select(LEASE_LIST_SELECT).eq("organization_id", organizationId).is("deleted_at", null).in("status", ["draft", "signed", "active"]).not("move_in_date", "is", null).gte("move_in_date", today).lte("move_in_date", moveHorizon).order("move_in_date", { ascending: true }).limit(5),
    supabase.from("leases").select(LEASE_LIST_SELECT).eq("organization_id", organizationId).is("deleted_at", null).not("move_out_date", "is", null).gte("move_out_date", today).lte("move_out_date", moveHorizon).order("move_out_date", { ascending: true }).limit(5),
    supabase.from("lease_events").select("id, organization_id, lease_id, event_type, summary, payload, created_by, created_at").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(8)
  ]);

  for (const error of [activeError, expiredError, expiringError, renewalError, moveInError, moveOutError, renewalNeededError, expirationSampleError, renewalSampleError, moveInSampleError, moveOutSampleError, eventsError]) {
    if (error) throw new Error(error.message);
  }

  return {
    activeLeases: activeLeases ?? 0,
    upcomingExpirations: upcomingExpirations ?? 0,
    upcomingRenewals: upcomingRenewals ?? 0,
    upcomingMoveIns: upcomingMoveIns ?? 0,
    upcomingMoveOuts: upcomingMoveOuts ?? 0,
    expiredLeases: expiredLeases ?? 0,
    renewalNeeded: renewalNeeded ?? 0,
    occupiedUnitsFromLeases: activeLeases ?? 0,
    expirationSample: ((expirationRows ?? []) as unknown as LeaseRelationRow[]).map(toLeaseListItem),
    renewalSample: ((renewalRows ?? []) as unknown as LeaseRelationRow[]).map(toLeaseListItem),
    moveInSample: ((moveInRows ?? []) as unknown as LeaseRelationRow[]).map(toLeaseListItem),
    moveOutSample: ((moveOutRows ?? []) as unknown as LeaseRelationRow[]).map(toLeaseListItem),
    recentEvents: ((eventRows ?? []) as LeaseEventRow[]).map(toLeaseEventRecord)
  };
}

export async function archiveLease(
  organizationId: string,
  leaseId: string,
  userId: string,
  client?: SupabaseClientType
): Promise<LeaseRecord | null> {
  const supabase = await resolveClient(client);
  const { data, error } = await supabase
    .from("leases")
    .update({ archived_at: new Date().toISOString(), archived_by: userId, updated_by: userId })
    .eq("organization_id", organizationId)
    .eq("id", leaseId)
    .is("deleted_at", null)
    .select(LEASE_SELECT)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toLeaseRecord(data as LeaseRow) : null;
}

export async function restoreLease(
  organizationId: string,
  leaseId: string,
  userId: string,
  client?: SupabaseClientType
): Promise<LeaseRecord | null> {
  const supabase = await resolveClient(client);
  const { data, error } = await supabase
    .from("leases")
    .update({ archived_at: null, archived_by: null, updated_by: userId })
    .eq("organization_id", organizationId)
    .eq("id", leaseId)
    .is("deleted_at", null)
    .select(LEASE_SELECT)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toLeaseRecord(data as LeaseRow) : null;
}

export async function softDeleteLease(
  organizationId: string,
  leaseId: string,
  userId: string,
  client?: SupabaseClientType
): Promise<LeaseRecord | null> {
  const supabase = await resolveClient(client);
  const existing = await getLeaseRecord(organizationId, leaseId, supabase);
  if (!existing) return null;
  if (existing.status === "active") {
    throw new Error("Active leases must be terminated or expired before deletion.");
  }

  const { data, error } = await supabase
    .from("leases")
    .update({ deleted_at: new Date().toISOString(), deleted_by: userId, updated_by: userId })
    .eq("organization_id", organizationId)
    .eq("id", leaseId)
    .select(LEASE_SELECT)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toLeaseRecord(data as LeaseRow) : null;
}

async function getLeaseRecord(organizationId: string, leaseId: string, client: SupabaseClientType) {
  const { data, error } = await client
    .from("leases")
    .select(LEASE_SELECT)
    .eq("organization_id", organizationId)
    .eq("id", leaseId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toLeaseRecord(data as LeaseRow) : null;
}

async function getLeaseDocuments(organizationId: string, leaseId: string, client: SupabaseClientType) {
  const { data, error } = await client
    .from("lease_documents")
    .select("id, organization_id, lease_id, document_type, title, file_url_placeholder, ocr_ready, notes, created_at, updated_at, deleted_at")
    .eq("organization_id", organizationId)
    .eq("lease_id", leaseId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return ((data ?? []) as LeaseDocumentRow[]).map(toLeaseDocumentRecord);
}

async function getLeaseEvents(organizationId: string, leaseId: string, client: SupabaseClientType) {
  const { data, error } = await client
    .from("lease_events")
    .select("id, organization_id, lease_id, event_type, summary, payload, created_by, created_at")
    .eq("organization_id", organizationId)
    .eq("lease_id", leaseId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as LeaseEventRow[]).map(toLeaseEventRecord);
}

async function seedLeaseDocumentPlaceholders(
  organizationId: string,
  leaseId: string,
  userId: string,
  client: SupabaseClientType
) {
  const placeholders = [
    { document_type: "lease_pdf", title: "Lease PDF (placeholder)" },
    { document_type: "signed_lease", title: "Signed lease (placeholder)" },
    { document_type: "amendment", title: "Amendments (placeholder)" },
    { document_type: "addendum", title: "Addendums (placeholder)" }
  ];

  const { error } = await client.from("lease_documents").insert(
    placeholders.map((entry) => ({
      organization_id: organizationId,
      lease_id: leaseId,
      document_type: entry.document_type,
      title: entry.title,
      file_url_placeholder: null,
      ocr_ready: false,
      notes: "Reserved for future document upload and OCR integration.",
      created_by: userId,
      updated_by: userId
    }))
  );
  if (error) throw new Error(error.message);
}

async function assertLeaseAssignment({
  organizationId,
  propertyId,
  unitId,
  tenantId,
  client
}: {
  organizationId: string;
  propertyId: string;
  unitId: string;
  tenantId: string;
  client: SupabaseClientType;
}) {
  const { data: property, error: propertyError } = await client
    .from("properties")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("id", propertyId)
    .is("deleted_at", null)
    .maybeSingle();
  if (propertyError) throw new Error(propertyError.message);
  if (!property) throw new Error("Property not found in organization.");

  const { data: unit, error: unitError } = await client
    .from("units")
    .select("id, property_id")
    .eq("organization_id", organizationId)
    .eq("id", unitId)
    .is("deleted_at", null)
    .maybeSingle();
  if (unitError) throw new Error(unitError.message);
  if (!unit || unit.property_id !== propertyId) throw new Error("Unit must belong to the selected property.");

  const { data: tenant, error: tenantError } = await client
    .from("tenants")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("id", tenantId)
    .is("deleted_at", null)
    .maybeSingle();
  if (tenantError) throw new Error(tenantError.message);
  if (!tenant) throw new Error("Tenant not found in organization.");
}

async function assertNoActiveLeaseOnUnit(
  organizationId: string,
  unitId: string,
  leaseId: string,
  client: SupabaseClientType
) {
  const { data, error } = await client
    .from("leases")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("unit_id", unitId)
    .eq("status", "active")
    .neq("id", leaseId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (data) throw new Error("Unit already has an active lease.");
}

async function syncUnitOccupancyFromLease(
  organizationId: string,
  unitId: string,
  occupancyStatus: "occupied" | "vacant_ready" | "vacant_not_ready",
  userId: string,
  client: SupabaseClientType
) {
  const { error } = await client
    .from("units")
    .update({ occupancy_status: occupancyStatus, updated_by: userId })
    .eq("organization_id", organizationId)
    .eq("id", unitId)
    .is("deleted_at", null);
  if (error) throw new Error(error.message);
}

async function syncUnitOccupancyFromActiveLeases(
  organizationId: string,
  unitId: string,
  userId: string,
  client: SupabaseClientType
) {
  const { data, error } = await client
    .from("leases")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("unit_id", unitId)
    .eq("status", "active")
    .is("deleted_at", null)
    .limit(1);
  if (error) throw new Error(error.message);

  const nextStatus = (data ?? []).length > 0 ? "occupied" : "vacant_ready";
  await syncUnitOccupancyFromLease(organizationId, unitId, nextStatus, userId, client);
}

async function generateLeaseNumber(organizationId: string, client: SupabaseClientType): Promise<string> {
  const year = new Date().getUTCFullYear();
  const prefix = `LS-${year}-`;
  const { data, error } = await client
    .from("leases")
    .select("lease_number")
    .eq("organization_id", organizationId)
    .like("lease_number", `${prefix}%`)
    .order("lease_number", { ascending: false })
    .limit(1);
  if (error) throw new Error(error.message);
  const latest = (data?.[0] as { lease_number?: string } | undefined)?.lease_number;
  const latestSequence = latest ? Number.parseInt(latest.replace(prefix, ""), 10) : 0;
  const nextSequence = Number.isFinite(latestSequence) ? latestSequence + 1 : 1;
  return `${prefix}${String(nextSequence).padStart(4, "0")}`;
}

function lifecycleActionToEventType(action: LeaseMutationInput["action"]): LeaseEventType | null {
  const map: Partial<Record<LeaseMutationInput["action"], LeaseEventType>> = {
    sign: "signed",
    activate: "activated",
    offer_renewal: "renewal_offered",
    renew: "renewed",
    give_notice: "notice_given",
    expire: "expired",
    terminate: "terminated",
    move_out: "move_out"
  };
  return map[action] ?? null;
}

function toLeaseRecord(row: LeaseRow): LeaseRecord {
  return {
    id: row.id,
    organizationId: row.organization_id,
    leaseNumber: row.lease_number,
    propertyId: row.property_id,
    unitId: row.unit_id,
    primaryTenantId: row.primary_tenant_id,
    coTenantPlaceholder: row.co_tenant_placeholder,
    leaseType: row.lease_type,
    status: row.status,
    startDate: row.start_date,
    endDate: row.end_date,
    moveInDate: row.move_in_date,
    moveOutDate: row.move_out_date,
    rentAmount: Number(row.rent_amount),
    securityDeposit: Number(row.security_deposit),
    lateFeePlaceholder: row.late_fee_placeholder,
    renewalOption: row.renewal_option,
    noticePeriodDays: row.notice_period_days,
    renewalStatus: row.renewal_status,
    internalNotes: row.internal_notes,
    signedAt: row.signed_at,
    activatedAt: row.activated_at,
    expiredAt: row.expired_at,
    terminatedAt: row.terminated_at,
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
    deletedAt: row.deleted_at
  };
}

function toLeaseListItem(row: LeaseRelationRow): LeaseListItem {
  const tenant = row.tenants;
  const tenantName = tenant
    ? tenant.preferred_name || `${tenant.first_name} ${tenant.last_name}`.trim()
    : null;
  return {
    ...toLeaseRecord(row),
    propertyName: row.properties?.name ?? null,
    unitNumber: row.units?.unit_number ?? null,
    tenantName
  };
}

function toLeaseDocumentRecord(row: LeaseDocumentRow): LeaseDocumentRecord {
  return {
    id: row.id,
    organizationId: row.organization_id,
    leaseId: row.lease_id,
    documentType: row.document_type,
    title: row.title,
    fileUrlPlaceholder: row.file_url_placeholder,
    ocrReady: row.ocr_ready,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at
  };
}

function toLeaseEventRecord(row: LeaseEventRow): LeaseEventRecord {
  return {
    id: row.id,
    organizationId: row.organization_id,
    leaseId: row.lease_id,
    eventType: row.event_type,
    summary: row.summary,
    payload: (row.payload ?? {}) as Record<string, unknown>,
    createdBy: row.created_by,
    createdAt: row.created_at
  };
}

function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function escapeLike(value: string): string {
  return value.replace(/[%_\\]/g, "\\$&");
}

async function resolveClient(client?: SupabaseClientType): Promise<SupabaseClientType> {
  return client ?? (await createAuthServerComponentClient());
}
