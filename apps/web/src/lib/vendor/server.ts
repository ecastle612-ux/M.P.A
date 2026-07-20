import { createAuthServerComponentClient } from "../auth/server";
import type { Database, Json } from "@mpa/supabase";
import {
  assignVendorToWorkOrder,
  getVendorAssignmentsForWorkOrder as getVendorAssignmentsForWorkOrderBase,
  updateVendorAssignmentStatus
} from "./assignments";
import type {
  CreateVendorInput,
  UpdateVendorInput,
  VendorAssignmentRecord,
  VendorContactRecord,
  VendorRecord,
  VendorServiceAreaRecord,
  VendorStatus,
  WorkOrderVendorMutationInput
} from "./contracts";

type VendorRow = {
  id: string;
  organization_id: string;
  business_name: string;
  primary_contact_name: string | null;
  phone: string | null;
  email: string | null;
  address_line_1: string | null;
  address_line_2: string | null;
  city: string | null;
  state_region: string | null;
  postal_code: string | null;
  country_code: string;
  website: string | null;
  license_number: string | null;
  insurance_expiration: string | null;
  tax_id_placeholder: string | null;
  emergency_availability: string | null;
  after_hours_availability: string | null;
  preferred_vendor: boolean;
  rating: number | null;
  internal_notes: string | null;
  status: VendorRecord["status"];
  services: string[];
  metadata: Json | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  deleted_at: string | null;
};

type VendorContactRow = {
  id: string;
  organization_id: string;
  vendor_id: string;
  name: string;
  role_title: string | null;
  phone: string | null;
  email: string | null;
  is_primary: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type VendorServiceAreaRow = {
  id: string;
  organization_id: string;
  vendor_id: string;
  label: string;
  city: string | null;
  state_region: string | null;
  postal_code: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type VendorDetailRow = VendorRow & {
  vendor_contacts: VendorContactRow[] | null;
  vendor_service_areas: VendorServiceAreaRow[] | null;
};

type VendorAssignmentRow = {
  id: string;
  organization_id: string;
  work_order_id: string;
  vendor_id: string;
  assignment_status: VendorAssignmentRecord["assignmentStatus"];
  assigned_at: string;
  accepted_at: string | null;
  arrived_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  completion_notes: string | null;
  cancellation_reason: string | null;
  is_current: boolean;
  created_at: string;
  updated_at: string;
};

type VendorAssignmentRelationRow = VendorAssignmentRow & {
  maintenance_work_orders: {
    work_order_number: string;
    title: string;
  } | null;
};

type VendorAssignmentSampleRow = VendorAssignmentRow & {
  vendors: { business_name: string } | null;
  maintenance_work_orders: {
    work_order_number: string;
    title: string;
  } | null;
};

export type VendorDetail = VendorRecord & {
  contacts: VendorContactRecord[];
  serviceAreas: VendorServiceAreaRecord[];
};

export type VendorAssignmentListItem = VendorAssignmentRecord & {
  vendorBusinessName: string;
};

export type VendorAssignmentHistoryItem = VendorAssignmentRecord & {
  workOrderNumber: string;
  workOrderTitle: string;
};

export type VendorAssignmentSample = VendorAssignmentRecord & {
  vendorBusinessName: string;
  workOrderNumber: string;
  workOrderTitle: string;
};

export type VendorDashboardMetrics = {
  openAssignments: number;
  awaitingResponse: number;
  inProgress: number;
  completedToday: number;
  preferredVendorCount: number;
  averageRating: number | null;
  assignmentSamples: VendorAssignmentSample[];
};

export type VendorListOptions = {
  search?: string;
  status?: VendorStatus | "all";
  service?: string;
  preferredVendor?: boolean;
  preferredOnly?: boolean;
  sortBy?: "updated_at" | "business_name" | "created_at" | "rating";
  sortOrder?: "asc" | "desc";
  limit?: number;
  offset?: number;
};

export type VendorPerformanceSummary = {
  totalAssignments: number;
  completedAssignments: number;
  cancelledAssignments: number;
  completionRate: number | null;
};

type SupabaseClientType = Awaited<ReturnType<typeof createAuthServerComponentClient>>;
type VendorUpdate = Database["public"]["Tables"]["vendors"]["Update"];

const VENDOR_SELECT =
  "id, organization_id, business_name, primary_contact_name, phone, email, address_line_1, address_line_2, city, state_region, postal_code, country_code, website, license_number, insurance_expiration, tax_id_placeholder, emergency_availability, after_hours_availability, preferred_vendor, rating, internal_notes, status, services, metadata, created_at, updated_at, archived_at, deleted_at";

const VENDOR_DETAIL_SELECT = `${VENDOR_SELECT}, vendor_contacts(id, organization_id, vendor_id, name, role_title, phone, email, is_primary, notes, created_at, updated_at, deleted_at), vendor_service_areas(id, organization_id, vendor_id, label, city, state_region, postal_code, notes, created_at, updated_at, deleted_at)`;

const ASSIGNMENT_SELECT =
  "id, organization_id, work_order_id, vendor_id, assignment_status, assigned_at, accepted_at, arrived_at, completed_at, cancelled_at, completion_notes, cancellation_reason, is_current, created_at, updated_at";

const OPEN_ASSIGNMENT_STATUSES: VendorAssignmentRecord["assignmentStatus"][] = [
  "pending",
  "awaiting_response",
  "accepted",
  "en_route",
  "arrived",
  "in_progress"
];

const IN_PROGRESS_ASSIGNMENT_STATUSES: VendorAssignmentRecord["assignmentStatus"][] = [
  "accepted",
  "en_route",
  "arrived",
  "in_progress"
];

export async function getVendorsForOrganization(
  organizationId: string,
  options: VendorListOptions = {},
  client?: SupabaseClientType
): Promise<VendorRecord[]> {
  const supabase = await resolveClient(client);
  let query = supabase
    .from("vendors")
    .select(VENDOR_SELECT)
    .eq("organization_id", organizationId)
    .is("deleted_at", null);

  if (options.status && options.status !== "all") {
    query = query.eq("status", options.status);
  }

  if (options.service) {
    query = query.contains("services", [options.service]);
  }

  if (options.preferredVendor === true || options.preferredOnly === true) {
    query = query.eq("preferred_vendor", true);
  }

  const trimmedSearch = options.search?.trim();
  if (trimmedSearch) {
    const escaped = escapeLike(trimmedSearch);
    query = query.or(
      `business_name.ilike.%${escaped}%,email.ilike.%${escaped}%,phone.ilike.%${escaped}%,primary_contact_name.ilike.%${escaped}%`
    );
  }

  const sortBy = options.sortBy ?? "updated_at";
  const ascending = (options.sortOrder ?? "desc") === "asc";
  query = query.order(sortBy, { ascending });

  if (options.limit !== undefined) {
    const from = options.offset ?? 0;
    query = query.range(from, from + options.limit - 1);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as VendorRow[]).map(toVendorRecord);
}

export async function getVendorForOrganization(
  organizationId: string,
  vendorId: string,
  client?: SupabaseClientType
): Promise<VendorDetail | null> {
  const supabase = await resolveClient(client);
  const { data, error } = await supabase
    .from("vendors")
    .select(VENDOR_DETAIL_SELECT)
    .eq("organization_id", organizationId)
    .eq("id", vendorId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? toVendorDetail(data as VendorDetailRow) : null;
}

export async function createVendor(
  organizationId: string,
  userId: string,
  input: CreateVendorInput,
  client?: SupabaseClientType
): Promise<VendorRecord> {
  const supabase = await resolveClient(client);
  const { data, error } = await supabase
    .from("vendors")
    .insert({
      organization_id: organizationId,
      business_name: input.businessName,
      primary_contact_name: input.primaryContactName,
      phone: input.phone,
      email: input.email,
      address_line_1: input.addressLine1,
      address_line_2: input.addressLine2,
      city: input.city,
      state_region: input.stateRegion,
      postal_code: input.postalCode,
      country_code: input.countryCode,
      website: input.website,
      license_number: input.licenseNumber,
      insurance_expiration: input.insuranceExpiration,
      tax_id_placeholder: input.taxIdPlaceholder,
      emergency_availability: input.emergencyAvailability,
      after_hours_availability: input.afterHoursAvailability,
      preferred_vendor: input.preferredVendor,
      rating: input.rating,
      internal_notes: input.internalNotes,
      status: input.status,
      services: input.services,
      metadata: input.metadata as Json,
      created_by: userId,
      updated_by: userId
    })
    .select(VENDOR_SELECT)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Vendor creation failed");
  }

  return toVendorRecord(data as VendorRow);
}

export async function updateVendor(
  organizationId: string,
  vendorId: string,
  userId: string,
  updates: UpdateVendorInput,
  client?: SupabaseClientType
): Promise<VendorRecord | null> {
  const supabase = await resolveClient(client);
  const patch: VendorUpdate = { updated_by: userId };

  if (updates.businessName !== undefined) patch.business_name = updates.businessName;
  if (updates.primaryContactName !== undefined) patch.primary_contact_name = updates.primaryContactName;
  if (updates.phone !== undefined) patch.phone = updates.phone;
  if (updates.email !== undefined) patch.email = updates.email;
  if (updates.addressLine1 !== undefined) patch.address_line_1 = updates.addressLine1;
  if (updates.addressLine2 !== undefined) patch.address_line_2 = updates.addressLine2;
  if (updates.city !== undefined) patch.city = updates.city;
  if (updates.stateRegion !== undefined) patch.state_region = updates.stateRegion;
  if (updates.postalCode !== undefined) patch.postal_code = updates.postalCode;
  if (updates.countryCode !== undefined) patch.country_code = updates.countryCode;
  if (updates.website !== undefined) patch.website = updates.website;
  if (updates.licenseNumber !== undefined) patch.license_number = updates.licenseNumber;
  if (updates.insuranceExpiration !== undefined) patch.insurance_expiration = updates.insuranceExpiration;
  if (updates.taxIdPlaceholder !== undefined) patch.tax_id_placeholder = updates.taxIdPlaceholder;
  if (updates.emergencyAvailability !== undefined) patch.emergency_availability = updates.emergencyAvailability;
  if (updates.afterHoursAvailability !== undefined) patch.after_hours_availability = updates.afterHoursAvailability;
  if (updates.preferredVendor !== undefined) patch.preferred_vendor = updates.preferredVendor;
  if (updates.rating !== undefined) patch.rating = updates.rating;
  if (updates.internalNotes !== undefined) patch.internal_notes = updates.internalNotes;
  if (updates.status !== undefined) patch.status = updates.status;
  if (updates.services !== undefined) patch.services = updates.services;
  if (updates.metadata !== undefined) patch.metadata = updates.metadata as Json;

  const { data, error } = await supabase
    .from("vendors")
    .update(patch)
    .eq("organization_id", organizationId)
    .eq("id", vendorId)
    .is("deleted_at", null)
    .select(VENDOR_SELECT)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? toVendorRecord(data as VendorRow) : null;
}

export async function archiveVendor(
  organizationId: string,
  vendorId: string,
  userId: string,
  client?: SupabaseClientType
): Promise<VendorRecord | null> {
  const supabase = await resolveClient(client);
  const { data, error } = await supabase
    .from("vendors")
    .update({
      status: "archived",
      archived_at: new Date().toISOString(),
      archived_by: userId,
      updated_by: userId
    })
    .eq("organization_id", organizationId)
    .eq("id", vendorId)
    .is("deleted_at", null)
    .select(VENDOR_SELECT)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? toVendorRecord(data as VendorRow) : null;
}

export async function restoreVendor(
  organizationId: string,
  vendorId: string,
  userId: string,
  client?: SupabaseClientType
): Promise<VendorRecord | null> {
  const supabase = await resolveClient(client);
  const { data, error } = await supabase
    .from("vendors")
    .update({
      status: "active",
      archived_at: null,
      archived_by: null,
      deleted_at: null,
      deleted_by: null,
      updated_by: userId
    })
    .eq("organization_id", organizationId)
    .eq("id", vendorId)
    .select(VENDOR_SELECT)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? toVendorRecord(data as VendorRow) : null;
}

export async function softDeleteVendor(
  organizationId: string,
  vendorId: string,
  userId: string,
  client?: SupabaseClientType
): Promise<VendorRecord | null> {
  const supabase = await resolveClient(client);
  const { data, error } = await supabase
    .from("vendors")
    .update({
      status: "archived",
      deleted_at: new Date().toISOString(),
      deleted_by: userId,
      updated_by: userId
    })
    .eq("organization_id", organizationId)
    .eq("id", vendorId)
    .is("deleted_at", null)
    .select(VENDOR_SELECT)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? toVendorRecord(data as VendorRow) : null;
}

export async function getVendorAssignmentHistoryForVendor(
  organizationId: string,
  vendorId: string,
  client?: SupabaseClientType
): Promise<VendorAssignmentHistoryItem[]> {
  const supabase = await resolveClient(client);
  const { data, error } = await supabase
    .from("maintenance_vendor_assignments")
    .select(
      `${ASSIGNMENT_SELECT}, maintenance_work_orders!maintenance_vendor_assignments_work_order_fk(work_order_number, title)`
    )
    .eq("organization_id", organizationId)
    .eq("vendor_id", vendorId)
    .order("assigned_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as VendorAssignmentRelationRow[]).map(toVendorAssignmentHistoryItem);
}

export async function getVendorAssignmentsForVendor(
  organizationId: string,
  vendorId: string,
  client?: SupabaseClientType
): Promise<VendorAssignmentRecord[]> {
  const history = await getVendorAssignmentHistoryForVendor(organizationId, vendorId, client);
  return history.map((item) => ({
    id: item.id,
    organizationId: item.organizationId,
    workOrderId: item.workOrderId,
    vendorId: item.vendorId,
    assignmentStatus: item.assignmentStatus,
    assignedAt: item.assignedAt,
    acceptedAt: item.acceptedAt,
    arrivedAt: item.arrivedAt,
    completedAt: item.completedAt,
    cancelledAt: item.cancelledAt,
    completionNotes: item.completionNotes,
    cancellationReason: item.cancellationReason,
    isCurrent: item.isCurrent,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  }));
}

export async function getVendorPerformanceSummary(
  organizationId: string,
  vendorId: string,
  client?: SupabaseClientType
): Promise<VendorPerformanceSummary> {
  const assignments = await getVendorAssignmentsForVendor(organizationId, vendorId, client);
  const totalAssignments = assignments.length;
  const completedAssignments = assignments.filter((entry) => entry.assignmentStatus === "completed").length;
  const cancelledAssignments = assignments.filter((entry) => entry.assignmentStatus === "cancelled").length;
  const completionRate =
    totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : null;

  return {
    totalAssignments,
    completedAssignments,
    cancelledAssignments,
    completionRate
  };
}

export async function getVendorDashboardMetrics(
  organizationId: string,
  client?: SupabaseClientType
): Promise<VendorDashboardMetrics> {
  const supabase = await resolveClient(client);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayIso = todayStart.toISOString();

  const [
    { count: openCount, error: openError },
    { count: awaitingCount, error: awaitingError },
    { count: inProgressCount, error: inProgressError },
    { count: completedTodayCount, error: completedTodayError },
    { count: preferredCount, error: preferredError },
    { data: ratingRows, error: ratingError },
    { data: sampleRows, error: sampleError }
  ] = await Promise.all([
    supabase
      .from("maintenance_vendor_assignments")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("is_current", true)
      .in("assignment_status", OPEN_ASSIGNMENT_STATUSES),
    supabase
      .from("maintenance_vendor_assignments")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("is_current", true)
      .eq("assignment_status", "awaiting_response"),
    supabase
      .from("maintenance_vendor_assignments")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("is_current", true)
      .in("assignment_status", IN_PROGRESS_ASSIGNMENT_STATUSES),
    supabase
      .from("maintenance_vendor_assignments")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("assignment_status", "completed")
      .gte("completed_at", todayIso),
    supabase
      .from("vendors")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .eq("preferred_vendor", true)
      .eq("status", "active"),
    supabase
      .from("vendors")
      .select("rating")
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .not("rating", "is", null),
    supabase
      .from("maintenance_vendor_assignments")
      .select(
        `${ASSIGNMENT_SELECT}, vendors(business_name), maintenance_work_orders!maintenance_vendor_assignments_work_order_fk(work_order_number, title)`
      )
      .eq("organization_id", organizationId)
      .eq("is_current", true)
      .in("assignment_status", OPEN_ASSIGNMENT_STATUSES)
      .order("assigned_at", { ascending: false })
      .limit(5)
  ]);

  assertNoError(openError);
  assertNoError(awaitingError);
  assertNoError(inProgressError);
  assertNoError(completedTodayError);
  assertNoError(preferredError);
  assertNoError(ratingError);
  assertNoError(sampleError);

  const ratings = ((ratingRows ?? []) as Array<{ rating: number | null }>)
    .map((row) => row.rating)
    .filter((value): value is number => value !== null);
  const averageRating =
    ratings.length > 0 ? Math.round((ratings.reduce((sum, value) => sum + value, 0) / ratings.length) * 100) / 100 : null;

  return {
    openAssignments: openCount ?? 0,
    awaitingResponse: awaitingCount ?? 0,
    inProgress: inProgressCount ?? 0,
    completedToday: completedTodayCount ?? 0,
    preferredVendorCount: preferredCount ?? 0,
    averageRating,
    assignmentSamples: ((sampleRows ?? []) as VendorAssignmentSampleRow[]).map(toVendorAssignmentSample)
  };
}

export async function getVendorAssignmentsForWorkOrder(
  organizationId: string,
  workOrderId: string,
  client?: SupabaseClientType
): Promise<VendorAssignmentListItem[]> {
  const supabase = await resolveClient(client);
  const assignments = await getVendorAssignmentsForWorkOrderBase(organizationId, workOrderId, supabase);
  const vendorNames = await getVendorNamesById(
    organizationId,
    assignments.map((assignment) => assignment.vendorId),
    supabase
  );

  return assignments.map((assignment) => ({
    ...assignment,
    vendorBusinessName: vendorNames.get(assignment.vendorId) ?? "Unknown vendor"
  }));
}

export async function mutateWorkOrderVendor(
  organizationId: string,
  workOrderId: string,
  userId: string,
  mutation: WorkOrderVendorMutationInput,
  client?: SupabaseClientType
): Promise<{
  assignment: VendorAssignmentListItem;
  assignments: VendorAssignmentListItem[];
  currentAssignment: VendorAssignmentListItem | null;
}> {
  const supabase = await resolveClient(client);

  if (mutation.action === "assign_vendor") {
    const assignment = await assignVendorToWorkOrder(
      organizationId,
      workOrderId,
      mutation.vendorId,
      userId,
      supabase,
      false
    );
    const assignments = await getVendorAssignmentsForWorkOrder(organizationId, workOrderId, supabase);
    const currentAssignment = assignments.find((entry) => entry.id === assignment.id) ?? toAssignmentListItem(assignment);
    return { assignment: currentAssignment, assignments, currentAssignment };
  }

  if (mutation.action === "reassign_vendor") {
    const assignment = await assignVendorToWorkOrder(
      organizationId,
      workOrderId,
      mutation.vendorId,
      userId,
      supabase,
      true
    );
    const assignments = await getVendorAssignmentsForWorkOrder(organizationId, workOrderId, supabase);
    const currentAssignment = assignments.find((entry) => entry.id === assignment.id) ?? toAssignmentListItem(assignment);
    return { assignment: currentAssignment, assignments, currentAssignment };
  }

  const statusInput: {
    assignmentStatus: typeof mutation.assignmentStatus;
    completionNotes?: string | null;
    cancellationReason?: string | null;
  } = {
    assignmentStatus: mutation.assignmentStatus
  };
  if (mutation.completionNotes !== undefined) {
    statusInput.completionNotes = mutation.completionNotes;
  }
  if (mutation.cancellationReason !== undefined) {
    statusInput.cancellationReason = mutation.cancellationReason;
  }

  const assignment = await updateVendorAssignmentStatus(
    organizationId,
    workOrderId,
    userId,
    statusInput,
    supabase
  );

  if (!assignment) {
    throw new Error("No current vendor assignment to update.");
  }

  const assignments = await getVendorAssignmentsForWorkOrder(organizationId, workOrderId, supabase);
  const assignmentItem = assignments.find((entry) => entry.id === assignment.id) ?? toAssignmentListItem(assignment);
  const currentAssignment = assignments.find((entry) => entry.isCurrent) ?? null;

  return {
    assignment: assignmentItem,
    assignments,
    currentAssignment
  };
}

function toVendorRecord(row: VendorRow): VendorRecord {
  return {
    id: row.id,
    organizationId: row.organization_id,
    businessName: row.business_name,
    primaryContactName: row.primary_contact_name,
    phone: row.phone,
    email: row.email,
    addressLine1: row.address_line_1,
    addressLine2: row.address_line_2,
    city: row.city,
    stateRegion: row.state_region,
    postalCode: row.postal_code,
    countryCode: row.country_code,
    website: row.website,
    licenseNumber: row.license_number,
    insuranceExpiration: row.insurance_expiration,
    taxIdPlaceholder: row.tax_id_placeholder,
    emergencyAvailability: row.emergency_availability,
    afterHoursAvailability: row.after_hours_availability,
    preferredVendor: row.preferred_vendor,
    rating: row.rating,
    internalNotes: row.internal_notes,
    status: row.status,
    services: row.services ?? [],
    metadata:
      row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
        ? (row.metadata as Record<string, unknown>)
        : {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
    deletedAt: row.deleted_at
  };
}

function toVendorContactRecord(row: VendorContactRow): VendorContactRecord {
  return {
    id: row.id,
    organizationId: row.organization_id,
    vendorId: row.vendor_id,
    name: row.name,
    roleTitle: row.role_title,
    phone: row.phone,
    email: row.email,
    isPrimary: row.is_primary,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at
  };
}

function toVendorServiceAreaRecord(row: VendorServiceAreaRow): VendorServiceAreaRecord {
  return {
    id: row.id,
    organizationId: row.organization_id,
    vendorId: row.vendor_id,
    label: row.label,
    city: row.city,
    stateRegion: row.state_region,
    postalCode: row.postal_code,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at
  };
}

function toVendorDetail(row: VendorDetailRow): VendorDetail {
  return {
    ...toVendorRecord(row),
    contacts: (row.vendor_contacts ?? [])
      .filter((contact) => !contact.deleted_at)
      .map(toVendorContactRecord),
    serviceAreas: (row.vendor_service_areas ?? [])
      .filter((area) => !area.deleted_at)
      .map(toVendorServiceAreaRecord)
  };
}

function toVendorAssignmentRecord(row: VendorAssignmentRow): VendorAssignmentRecord {
  return {
    id: row.id,
    organizationId: row.organization_id,
    workOrderId: row.work_order_id,
    vendorId: row.vendor_id,
    assignmentStatus: row.assignment_status,
    assignedAt: row.assigned_at,
    acceptedAt: row.accepted_at,
    arrivedAt: row.arrived_at,
    completedAt: row.completed_at,
    cancelledAt: row.cancelled_at,
    completionNotes: row.completion_notes,
    cancellationReason: row.cancellation_reason,
    isCurrent: row.is_current,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function toVendorAssignmentHistoryItem(row: VendorAssignmentRelationRow): VendorAssignmentHistoryItem {
  return {
    ...toVendorAssignmentRecord(row),
    workOrderNumber: row.maintenance_work_orders?.work_order_number ?? "",
    workOrderTitle: row.maintenance_work_orders?.title ?? ""
  };
}

function toVendorAssignmentSample(row: VendorAssignmentSampleRow): VendorAssignmentSample {
  return {
    ...toVendorAssignmentRecord(row),
    vendorBusinessName: row.vendors?.business_name ?? "",
    workOrderNumber: row.maintenance_work_orders?.work_order_number ?? "",
    workOrderTitle: row.maintenance_work_orders?.title ?? ""
  };
}

function toAssignmentListItem(assignment: VendorAssignmentRecord): VendorAssignmentListItem {
  return {
    ...assignment,
    vendorBusinessName: "Unknown vendor"
  };
}

async function getVendorNamesById(
  organizationId: string,
  vendorIds: string[],
  client: SupabaseClientType
): Promise<Map<string, string>> {
  const uniqueIds = Array.from(new Set(vendorIds));
  if (uniqueIds.length === 0) {
    return new Map();
  }

  const { data, error } = await client
    .from("vendors")
    .select("id, business_name")
    .eq("organization_id", organizationId)
    .in("id", uniqueIds);

  if (error) {
    throw new Error(error.message);
  }

  return new Map(((data ?? []) as Array<{ id: string; business_name: string }>).map((row) => [row.id, row.business_name]));
}

function escapeLike(value: string): string {
  return value.replaceAll("%", "\\%").replaceAll("_", "\\_");
}

function assertNoError(error: { message: string } | null): void {
  if (error) {
    throw new Error(error.message);
  }
}

async function resolveClient(client?: SupabaseClientType): Promise<SupabaseClientType> {
  return client ?? (await createAuthServerComponentClient());
}
