import { createAuthServerComponentClient } from "../auth/server";
import type { Database, Json } from "@mpa/supabase";
import { getScreeningProvider } from "../integrations/screening/registry";
import { getSignatureProvider } from "../integrations/signature/registry";
import { createTenant } from "../tenant/server";
import { transferVaultDocuments } from "../vault/server";
import type {
  ApplicantEventRecord,
  ApplicantNoteRecord,
  ApplicantRecord,
  ApplicantStatus,
  ApplicantTaskRecord,
  CreateApplicantInput,
  UpdateApplicantInput
} from "./contracts";
import { parseApplicantProfile } from "./contracts";
import {
  applicantLifecycleSummary,
  assertApplicantLifecycleTransition,
  recordApplicantEvent
} from "./events";

type ApplicantRow = {
  id: string;
  organization_id: string;
  application_number: string;
  application_group_id: string;
  is_primary: boolean;
  property_id: string | null;
  unit_id: string | null;
  assigned_pm_id: string | null;
  tenant_id: string | null;
  status: ApplicantStatus;
  first_name: string;
  last_name: string;
  preferred_name: string | null;
  email: string;
  phone: string | null;
  date_of_birth: string | null;
  planned_move_in_date: string | null;
  profile: Json | null;
  internal_notes: string | null;
  metadata: Json | null;
  submitted_at: string | null;
  approved_at: string | null;
  declined_at: string | null;
  converted_at: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  deleted_at: string | null;
};

type ApplicantRelationRow = ApplicantRow & {
  properties: { name: string } | null;
  units: { unit_number: string; property_id: string } | null;
};

type SupabaseClientType = Awaited<ReturnType<typeof createAuthServerComponentClient>>;
type ApplicantUpdate = Database["public"]["Tables"]["applicants"]["Update"];

export type ApplicantListItem = ApplicantRecord & {
  propertyName: string | null;
  unitNumber: string | null;
};

export type ApplicantDashboardMetrics = {
  pendingApplications: number;
  screeningQueue: number;
  awaitingDocuments: number;
  awaitingSignatures: number;
  recentlyApproved: number;
  moveInsThisWeek: number;
  pendingSample: ApplicantDashboardSample[];
  screeningSample: ApplicantDashboardSample[];
  awaitingDocumentsSample: ApplicantDashboardSample[];
  awaitingSignaturesSample: Array<ApplicantDashboardSample & { requestNumber: string }>;
  recentlyApprovedSample: ApplicantDashboardSample[];
  moveInSample: ApplicantDashboardSample[];
  recentEvents: Array<{
    id: string;
    applicantId: string;
    applicationNumber: string;
    eventType: string;
    summary: string;
    createdAt: string;
    href: string;
  }>;
};

type ApplicantDashboardSample = {
  id: string;
  applicationNumber: string;
  applicantName: string;
  status: string;
  propertyName: string | null;
  href: string;
};

type ApplicantListOptions = {
  search?: string;
  status?: ApplicantStatus;
  sortBy?: "updated_at" | "last_name" | "created_at" | "application_number";
  sortOrder?: "asc" | "desc";
  limit?: number;
  offset?: number;
};

const APPLICANT_SELECT =
  "id, organization_id, application_number, application_group_id, is_primary, property_id, unit_id, assigned_pm_id, tenant_id, status, first_name, last_name, preferred_name, email, phone, date_of_birth, planned_move_in_date, profile, internal_notes, metadata, submitted_at, approved_at, declined_at, converted_at, created_at, updated_at, archived_at, deleted_at";

const APPLICANT_LIST_SELECT = `${APPLICANT_SELECT}, properties(name), units(unit_number, property_id)`;

export async function getApplicantsForOrganization(
  organizationId: string,
  options: ApplicantListOptions = {},
  client?: SupabaseClientType
): Promise<ApplicantListItem[]> {
  const supabase = await resolveClient(client);
  let query = supabase
    .from("applicants")
    .select(APPLICANT_LIST_SELECT)
    .eq("organization_id", organizationId)
    .is("deleted_at", null);

  if (options.status) query = query.eq("status", options.status);

  const trimmedSearch = options.search?.trim();
  if (trimmedSearch) {
    const escaped = escapeLike(trimmedSearch);
    query = query.or(
      `first_name.ilike.%${escaped}%,last_name.ilike.%${escaped}%,preferred_name.ilike.%${escaped}%,email.ilike.%${escaped}%,application_number.ilike.%${escaped}%`
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
  if (error) throw new Error(error.message);
  return ((data ?? []) as ApplicantRelationRow[]).map(toApplicantListItem);
}

export async function getApplicantForOrganization(
  organizationId: string,
  applicantId: string,
  client?: SupabaseClientType
): Promise<ApplicantListItem | null> {
  const supabase = await resolveClient(client);
  const { data, error } = await supabase
    .from("applicants")
    .select(APPLICANT_LIST_SELECT)
    .eq("organization_id", organizationId)
    .eq("id", applicantId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? toApplicantListItem(data as ApplicantRelationRow) : null;
}

export async function getApplicantEvents(
  organizationId: string,
  applicantId: string,
  client?: SupabaseClientType
): Promise<ApplicantEventRecord[]> {
  const supabase = await resolveClient(client);
  const { data, error } = await supabase
    .from("applicant_events")
    .select("id, organization_id, applicant_id, event_type, summary, payload, created_by, created_at")
    .eq("organization_id", organizationId)
    .eq("applicant_id", applicantId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    id: row.id,
    organizationId: row.organization_id,
    applicantId: row.applicant_id,
    eventType: row.event_type,
    summary: row.summary,
    payload:
      row.payload && typeof row.payload === "object" && !Array.isArray(row.payload)
        ? (row.payload as Record<string, unknown>)
        : {},
    createdBy: row.created_by,
    createdAt: row.created_at
  }));
}

export async function getApplicantNotes(
  organizationId: string,
  applicantId: string,
  client?: SupabaseClientType
): Promise<ApplicantNoteRecord[]> {
  const supabase = await resolveClient(client);
  const { data, error } = await supabase
    .from("applicant_notes")
    .select("id, organization_id, applicant_id, body, created_by, created_at")
    .eq("organization_id", organizationId)
    .eq("applicant_id", applicantId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    id: row.id,
    organizationId: row.organization_id,
    applicantId: row.applicant_id,
    body: row.body,
    createdBy: row.created_by,
    createdAt: row.created_at
  }));
}

export async function getApplicantTasks(
  organizationId: string,
  applicantId: string,
  client?: SupabaseClientType
): Promise<ApplicantTaskRecord[]> {
  const supabase = await resolveClient(client);
  const { data, error } = await supabase
    .from("applicant_tasks")
    .select(
      "id, organization_id, applicant_id, title, description, status, due_date, assigned_to, completed_at, created_by, created_at, updated_at"
    )
    .eq("organization_id", organizationId)
    .eq("applicant_id", applicantId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    id: row.id,
    organizationId: row.organization_id,
    applicantId: row.applicant_id,
    title: row.title,
    description: row.description,
    status: row.status as ApplicantTaskRecord["status"],
    dueDate: row.due_date,
    assignedTo: row.assigned_to,
    completedAt: row.completed_at,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
}

export async function createApplicant(
  organizationId: string,
  userId: string,
  input: CreateApplicantInput,
  client?: SupabaseClientType
): Promise<ApplicantRecord> {
  const supabase = await resolveClient(client);
  await assertApplicantAssignment({
    organizationId,
    propertyId: input.propertyId,
    unitId: input.unitId,
    client: supabase
  });

  const applicationNumber = input.applicationNumber?.trim() || (await generateApplicationNumber(organizationId, supabase));

  const { data, error } = await supabase
    .from("applicants")
    .insert({
      organization_id: organizationId,
      application_number: applicationNumber,
      application_group_id: input.applicationGroupId,
      is_primary: input.isPrimary,
      property_id: input.propertyId,
      unit_id: input.unitId,
      assigned_pm_id: input.assignedPmId,
      status: input.status,
      first_name: input.firstName,
      last_name: input.lastName,
      preferred_name: input.preferredName,
      email: input.email,
      phone: input.phone,
      date_of_birth: input.dateOfBirth,
      planned_move_in_date: input.plannedMoveInDate,
      profile: input.profile as Json,
      internal_notes: input.internalNotes,
      metadata: input.metadata as Json,
      created_by: userId,
      updated_by: userId
    })
    .select(APPLICANT_SELECT)
    .single();

  if (error || !data) throw new Error(error?.message ?? "Applicant creation failed");

  const applicant = toApplicantRecord(data as ApplicantRow);
  await recordApplicantEvent(
    organizationId,
    applicant.id,
    userId,
    "application_created",
    `Application ${applicant.applicationNumber} created for ${applicant.firstName} ${applicant.lastName}`,
    { status: applicant.status },
    supabase
  );

  return applicant;
}

export async function updateApplicant(
  organizationId: string,
  applicantId: string,
  userId: string,
  updates: UpdateApplicantInput,
  client?: SupabaseClientType
): Promise<ApplicantRecord | null> {
  const supabase = await resolveClient(client);
  const existing = await getApplicantForOrganization(organizationId, applicantId, supabase);
  if (!existing) return null;

  const nextPropertyId = updates.propertyId !== undefined ? updates.propertyId : existing.propertyId;
  const nextUnitId = updates.unitId !== undefined ? updates.unitId : existing.unitId;
  await assertApplicantAssignment({
    organizationId,
    propertyId: nextPropertyId,
    unitId: nextUnitId,
    client: supabase
  });

  const patch: ApplicantUpdate = { updated_by: userId };
  if (updates.propertyId !== undefined) patch.property_id = updates.propertyId;
  if (updates.unitId !== undefined) patch.unit_id = updates.unitId;
  if (updates.assignedPmId !== undefined) patch.assigned_pm_id = updates.assignedPmId;
  if (updates.firstName !== undefined) patch.first_name = updates.firstName;
  if (updates.lastName !== undefined) patch.last_name = updates.lastName;
  if (updates.preferredName !== undefined) patch.preferred_name = updates.preferredName;
  if (updates.email !== undefined) patch.email = updates.email;
  if (updates.phone !== undefined) patch.phone = updates.phone;
  if (updates.dateOfBirth !== undefined) patch.date_of_birth = updates.dateOfBirth;
  if (updates.plannedMoveInDate !== undefined) patch.planned_move_in_date = updates.plannedMoveInDate;
  if (updates.profile !== undefined) patch.profile = updates.profile as Json;
  if (updates.internalNotes !== undefined) patch.internal_notes = updates.internalNotes;
  if (updates.metadata !== undefined) patch.metadata = updates.metadata as Json;
  if (updates.status !== undefined) patch.status = updates.status;

  const { data, error } = await supabase
    .from("applicants")
    .update(patch)
    .eq("organization_id", organizationId)
    .eq("id", applicantId)
    .is("deleted_at", null)
    .select(APPLICANT_SELECT)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? toApplicantRecord(data as ApplicantRow) : null;
}

export async function transitionApplicantStatus(
  organizationId: string,
  applicantId: string,
  userId: string,
  action: string,
  options: { reason?: string } = {},
  client?: SupabaseClientType
): Promise<ApplicantRecord | null> {
  const supabase = await resolveClient(client);
  const existing = await getApplicantForOrganization(organizationId, applicantId, supabase);
  if (!existing) return null;

  assertApplicantLifecycleTransition(existing.status, action);

  const statusMap: Record<string, ApplicantStatus> = {
    submit: "submitted",
    request_documents: "awaiting_documents",
    start_screening: "screening_in_progress",
    mark_pending_review: "pending_review",
    approve: "approved",
    decline: "declined",
    withdraw: "withdrawn"
  };

  const nextStatus = statusMap[action];
  if (!nextStatus) throw new Error(`Unknown lifecycle action: ${action}`);

  const patch: ApplicantUpdate = {
    status: nextStatus,
    updated_by: userId
  };
  const now = new Date().toISOString();
  if (action === "submit") patch.submitted_at = now;
  if (action === "approve") patch.approved_at = now;
  if (action === "decline") patch.declined_at = now;

  const { data, error } = await supabase
    .from("applicants")
    .update(patch)
    .eq("organization_id", organizationId)
    .eq("id", applicantId)
    .is("deleted_at", null)
    .select(APPLICANT_SELECT)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const applicant = toApplicantRecord(data as ApplicantRow);
  const eventTypeMap: Record<string, string> = {
    submit: "submitted",
    request_documents: "documents_requested",
    start_screening: "screening_started",
    mark_pending_review: "pending_review",
    approve: "approved",
    decline: "declined",
    withdraw: "withdrawn"
  };

  await recordApplicantEvent(
    organizationId,
    applicantId,
    userId,
    eventTypeMap[action] as Parameters<typeof recordApplicantEvent>[3],
    applicantLifecycleSummary(action, applicant),
    { previousStatus: existing.status, nextStatus, reason: options.reason ?? null },
    supabase
  );

  if (action === "start_screening") {
    await createScreeningCase(organizationId, applicantId, userId, {}, supabase);
  }

  return applicant;
}

export async function convertApplicantToResident(
  organizationId: string,
  applicantId: string,
  userId: string,
  client?: SupabaseClientType
): Promise<{ applicant: ApplicantRecord; tenantId: string }> {
  const supabase = await resolveClient(client);
  const existing = await getApplicantForOrganization(organizationId, applicantId, supabase);
  if (!existing) throw new Error("Applicant not found");
  assertApplicantLifecycleTransition(existing.status, "convert_to_resident");

  if (existing.tenantId) {
    throw new Error("Applicant has already been converted to a resident.");
  }

  const tenant = await createTenant(
    organizationId,
    userId,
    {
      propertyId: existing.propertyId,
      unitId: existing.unitId,
      firstName: existing.firstName,
      lastName: existing.lastName,
      preferredName: existing.preferredName,
      email: existing.email,
      phone: existing.phone,
      dateOfBirth: existing.dateOfBirth,
      moveInDate: existing.plannedMoveInDate,
      moveOutDate: null,
      documentsPlaceholder: null,
      emergencyContactName: existing.profile.emergency.name,
      emergencyContactPhone: existing.profile.emergency.phone,
      notes: existing.internalNotes,
      status: "active",
      avatarUrl: null,
      metadata: {
        convertedFromApplicantId: existing.id,
        applicationNumber: existing.applicationNumber
      }
    },
    supabase
  );

  await transferVaultDocuments(
    organizationId,
    "applicant",
    applicantId,
    "tenant",
    tenant.id,
    userId,
    supabase
  );

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("applicants")
    .update({
      status: "converted_to_resident",
      tenant_id: tenant.id,
      converted_at: now,
      updated_by: userId,
      metadata: {
        ...existing.metadata,
        moveInChecklist: existing.profile.moveInChecklist
      } as Json
    })
    .eq("organization_id", organizationId)
    .eq("id", applicantId)
    .select(APPLICANT_SELECT)
    .single();

  if (error || !data) throw new Error(error?.message ?? "Conversion failed");

  const applicant = toApplicantRecord(data as ApplicantRow);
  await recordApplicantEvent(
    organizationId,
    applicantId,
    userId,
    "converted_to_resident",
    applicantLifecycleSummary("convert_to_resident", applicant),
    { tenantId: tenant.id },
    supabase
  );

  return { applicant, tenantId: tenant.id };
}

export async function addApplicantNote(
  organizationId: string,
  applicantId: string,
  userId: string,
  body: string,
  client?: SupabaseClientType
): Promise<ApplicantNoteRecord> {
  const supabase = await resolveClient(client);
  const { data, error } = await supabase
    .from("applicant_notes")
    .insert({
      organization_id: organizationId,
      applicant_id: applicantId,
      body,
      created_by: userId
    })
    .select("id, organization_id, applicant_id, body, created_by, created_at")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to add note");

  await recordApplicantEvent(
    organizationId,
    applicantId,
    userId,
    "note_added",
    "Internal note added",
    {},
    supabase
  );

  return {
    id: data.id,
    organizationId: data.organization_id,
    applicantId: data.applicant_id,
    body: data.body,
    createdBy: data.created_by,
    createdAt: data.created_at
  };
}

export async function addApplicantTask(
  organizationId: string,
  applicantId: string,
  userId: string,
  input: { title: string; description?: string; dueDate?: string },
  client?: SupabaseClientType
): Promise<ApplicantTaskRecord> {
  const supabase = await resolveClient(client);
  const { data, error } = await supabase
    .from("applicant_tasks")
    .insert({
      organization_id: organizationId,
      applicant_id: applicantId,
      title: input.title,
      description: input.description ?? null,
      due_date: input.dueDate ?? null,
      created_by: userId,
      updated_by: userId
    })
    .select(
      "id, organization_id, applicant_id, title, description, status, due_date, assigned_to, completed_at, created_by, created_at, updated_at"
    )
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to add task");

  return {
    id: data.id,
    organizationId: data.organization_id,
    applicantId: data.applicant_id,
    title: data.title,
    description: data.description,
    status: data.status as ApplicantTaskRecord["status"],
    dueDate: data.due_date,
    assignedTo: data.assigned_to,
    completedAt: data.completed_at,
    createdBy: data.created_by,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
}

export async function completeApplicantTask(
  organizationId: string,
  applicantId: string,
  taskId: string,
  userId: string,
  client?: SupabaseClientType
): Promise<ApplicantTaskRecord | null> {
  const supabase = await resolveClient(client);
  const { data, error } = await supabase
    .from("applicant_tasks")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      updated_by: userId
    })
    .eq("organization_id", organizationId)
    .eq("applicant_id", applicantId)
    .eq("id", taskId)
    .select(
      "id, organization_id, applicant_id, title, description, status, due_date, assigned_to, completed_at, created_by, created_at, updated_at"
    )
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  await recordApplicantEvent(
    organizationId,
    applicantId,
    userId,
    "task_completed",
    `Task completed: ${data.title}`,
    { taskId },
    supabase
  );

  return {
    id: data.id,
    organizationId: data.organization_id,
    applicantId: data.applicant_id,
    title: data.title,
    description: data.description,
    status: data.status as ApplicantTaskRecord["status"],
    dueDate: data.due_date,
    assignedTo: data.assigned_to,
    completedAt: data.completed_at,
    createdBy: data.created_by,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
}

export async function createScreeningCase(
  organizationId: string,
  applicantId: string,
  userId: string,
  input: { provider?: string } = {},
  client?: SupabaseClientType
) {
  const supabase = await resolveClient(client);
  const caseNumber = await generateScreeningCaseNumber(organizationId, supabase);
  const provider = getScreeningProvider(input.provider ?? "noop");
  const result = await provider.initiateScreening({ organizationId, applicantId, caseNumber });

  const { data, error } = await supabase
    .from("screening_cases")
    .insert({
      organization_id: organizationId,
      applicant_id: applicantId,
      case_number: caseNumber,
      provider: provider.id,
      status: result.status,
      external_reference: result.externalReference,
      result_summary: result.resultSummary,
      created_by: userId,
      updated_by: userId
    })
    .select("*")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Screening case creation failed");
  return data;
}

export async function createSignatureRequest(
  organizationId: string,
  applicantId: string,
  userId: string,
  input: { provider?: string; requestType?: string } = {},
  client?: SupabaseClientType
) {
  const supabase = await resolveClient(client);
  const requestNumber = await generateSignatureRequestNumber(organizationId, supabase);
  const provider = getSignatureProvider(input.provider ?? "noop");
  const requestType = (input.requestType ?? "lease_agreement") as "lease_agreement" | "application_consent" | "addendum" | "other";
  const result = await provider.createSignatureRequest({
    organizationId,
    applicantId,
    requestNumber,
    requestType
  });

  const { data, error } = await supabase
    .from("signature_requests")
    .insert({
      organization_id: organizationId,
      applicant_id: applicantId,
      request_number: requestNumber,
      provider: provider.id,
      request_type: requestType,
      status: result.status,
      external_reference: result.externalReference,
      created_by: userId,
      updated_by: userId
    })
    .select("*")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Signature request creation failed");

  await recordApplicantEvent(
    organizationId,
    applicantId,
    userId,
    "signature_requested",
    `Signature request ${requestNumber} created`,
    { requestNumber, requestType },
    supabase
  );

  return data;
}

export async function archiveApplicant(
  organizationId: string,
  applicantId: string,
  userId: string,
  client?: SupabaseClientType
): Promise<ApplicantRecord | null> {
  const supabase = await resolveClient(client);
  const { data, error } = await supabase
    .from("applicants")
    .update({
      archived_at: new Date().toISOString(),
      archived_by: userId,
      updated_by: userId
    })
    .eq("organization_id", organizationId)
    .eq("id", applicantId)
    .is("deleted_at", null)
    .select(APPLICANT_SELECT)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? toApplicantRecord(data as ApplicantRow) : null;
}

export async function restoreApplicant(
  organizationId: string,
  applicantId: string,
  userId: string,
  client?: SupabaseClientType
): Promise<ApplicantRecord | null> {
  const supabase = await resolveClient(client);
  const { data, error } = await supabase
    .from("applicants")
    .update({
      archived_at: null,
      archived_by: null,
      updated_by: userId
    })
    .eq("organization_id", organizationId)
    .eq("id", applicantId)
    .select(APPLICANT_SELECT)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? toApplicantRecord(data as ApplicantRow) : null;
}

export async function softDeleteApplicant(
  organizationId: string,
  applicantId: string,
  userId: string,
  client?: SupabaseClientType
): Promise<ApplicantRecord | null> {
  const supabase = await resolveClient(client);
  const { data, error } = await supabase
    .from("applicants")
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: userId,
      updated_by: userId
    })
    .eq("organization_id", organizationId)
    .eq("id", applicantId)
    .is("deleted_at", null)
    .select(APPLICANT_SELECT)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? toApplicantRecord(data as ApplicantRow) : null;
}

export async function getApplicantDashboardMetrics(
  organizationId: string,
  client?: SupabaseClientType
): Promise<ApplicantDashboardMetrics> {
  const supabase = await resolveClient(client);
  const weekStart = getWeekStartDate();
  const weekEnd = getWeekEndDate();

  const [
    { count: pendingCount },
    { count: screeningCount },
    { count: awaitingDocsCount },
    { count: awaitingSigCount },
    { count: approvedCount },
    { count: moveInCount },
    { data: pendingRows },
    { data: screeningRows },
    { data: awaitingDocsRows },
    { data: sigRows },
    { data: approvedRows },
    { data: moveInRows },
    { data: eventRows }
  ] = await Promise.all([
    supabase
      .from("applicants")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .in("status", ["submitted", "pending_review"]),
    supabase
      .from("applicants")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .eq("status", "screening_in_progress"),
    supabase
      .from("applicants")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .eq("status", "awaiting_documents"),
    supabase
      .from("signature_requests")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .in("status", ["pending", "sent", "viewed"]),
    supabase
      .from("applicants")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .eq("status", "approved"),
    supabase
      .from("applicants")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .eq("status", "approved")
      .gte("planned_move_in_date", weekStart)
      .lte("planned_move_in_date", weekEnd),
    supabase
      .from("applicants")
      .select(`${APPLICANT_LIST_SELECT}`)
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .in("status", ["submitted", "pending_review"])
      .order("updated_at", { ascending: false })
      .limit(5),
    supabase
      .from("applicants")
      .select(`${APPLICANT_LIST_SELECT}`)
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .eq("status", "screening_in_progress")
      .order("updated_at", { ascending: false })
      .limit(5),
    supabase
      .from("applicants")
      .select(`${APPLICANT_LIST_SELECT}`)
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .eq("status", "awaiting_documents")
      .order("updated_at", { ascending: false })
      .limit(5),
    supabase
      .from("signature_requests")
      .select("id, request_number, status, applicant_id, applicants(id, application_number, first_name, last_name, status, properties(name))")
      .eq("organization_id", organizationId)
      .in("status", ["pending", "sent", "viewed"])
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("applicants")
      .select(`${APPLICANT_LIST_SELECT}`)
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .eq("status", "approved")
      .order("approved_at", { ascending: false })
      .limit(5),
    supabase
      .from("applicants")
      .select(`${APPLICANT_LIST_SELECT}`)
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .eq("status", "approved")
      .gte("planned_move_in_date", weekStart)
      .lte("planned_move_in_date", weekEnd)
      .order("planned_move_in_date", { ascending: true })
      .limit(5),
    supabase
      .from("applicant_events")
      .select("id, applicant_id, event_type, summary, created_at, applicants(application_number)")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(8)
  ]);

  return {
    pendingApplications: pendingCount ?? 0,
    screeningQueue: screeningCount ?? 0,
    awaitingDocuments: awaitingDocsCount ?? 0,
    awaitingSignatures: awaitingSigCount ?? 0,
    recentlyApproved: approvedCount ?? 0,
    moveInsThisWeek: moveInCount ?? 0,
    pendingSample: ((pendingRows ?? []) as ApplicantRelationRow[]).map(toDashboardSample),
    screeningSample: ((screeningRows ?? []) as ApplicantRelationRow[]).map(toDashboardSample),
    awaitingDocumentsSample: ((awaitingDocsRows ?? []) as ApplicantRelationRow[]).map(toDashboardSample),
    awaitingSignaturesSample: (sigRows ?? []).map((row) => {
      const applicant = row.applicants as ApplicantRelationRow | null;
      return {
        id: row.applicant_id as string,
        applicationNumber: applicant?.application_number ?? "—",
        applicantName: applicant ? `${applicant.first_name} ${applicant.last_name}` : "Applicant",
        status: row.status as string,
        propertyName: applicant?.properties?.name ?? null,
        requestNumber: row.request_number as string,
        href: `/applicants/${row.applicant_id}`
      };
    }),
    recentlyApprovedSample: ((approvedRows ?? []) as ApplicantRelationRow[]).map(toDashboardSample),
    moveInSample: ((moveInRows ?? []) as ApplicantRelationRow[]).map(toDashboardSample),
    recentEvents: (eventRows ?? []).map((row) => ({
      id: row.id,
      applicantId: row.applicant_id,
      applicationNumber:
        (row.applicants as { application_number?: string } | null)?.application_number ?? "—",
      eventType: row.event_type,
      summary: row.summary,
      createdAt: row.created_at,
      href: `/applicants/${row.applicant_id}`
    }))
  };
}

function toApplicantRecord(row: ApplicantRow): ApplicantRecord {
  return {
    id: row.id,
    organizationId: row.organization_id,
    applicationNumber: row.application_number,
    applicationGroupId: row.application_group_id,
    isPrimary: row.is_primary,
    propertyId: row.property_id,
    unitId: row.unit_id,
    assignedPmId: row.assigned_pm_id,
    tenantId: row.tenant_id,
    status: row.status,
    firstName: row.first_name,
    lastName: row.last_name,
    preferredName: row.preferred_name,
    email: row.email,
    phone: row.phone,
    dateOfBirth: row.date_of_birth,
    plannedMoveInDate: row.planned_move_in_date,
    profile: parseApplicantProfile(row.profile),
    internalNotes: row.internal_notes,
    metadata:
      row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
        ? (row.metadata as Record<string, unknown>)
        : {},
    submittedAt: row.submitted_at,
    approvedAt: row.approved_at,
    declinedAt: row.declined_at,
    convertedAt: row.converted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
    deletedAt: row.deleted_at
  };
}

function toApplicantListItem(row: ApplicantRelationRow): ApplicantListItem {
  return {
    ...toApplicantRecord(row),
    propertyName: row.properties?.name ?? null,
    unitNumber: row.units?.unit_number ?? null
  };
}

function toDashboardSample(row: ApplicantRelationRow): ApplicantDashboardSample {
  return {
    id: row.id,
    applicationNumber: row.application_number,
    applicantName: `${row.first_name} ${row.last_name}`,
    status: row.status,
    propertyName: row.properties?.name ?? null,
    href: `/applicants/${row.id}`
  };
}

async function generateApplicationNumber(organizationId: string, client: SupabaseClientType): Promise<string> {
  const prefix = `APP-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}`;
  const { data } = await client
    .from("applicants")
    .select("application_number")
    .eq("organization_id", organizationId)
    .like("application_number", `${prefix}%`)
    .order("application_number", { ascending: false })
    .limit(1);

  const latest = (data?.[0] as { application_number?: string } | undefined)?.application_number;
  const sequence = latest ? Number.parseInt(latest.slice(-4), 10) + 1 : 1;
  return `${prefix}-${String(sequence).padStart(4, "0")}`;
}

async function generateScreeningCaseNumber(organizationId: string, client: SupabaseClientType): Promise<string> {
  const prefix = "SCR";
  const { count } = await client
    .from("screening_cases")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId);
  return `${prefix}-${String((count ?? 0) + 1).padStart(5, "0")}`;
}

async function generateSignatureRequestNumber(organizationId: string, client: SupabaseClientType): Promise<string> {
  const prefix = "SIG";
  const { count } = await client
    .from("signature_requests")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId);
  return `${prefix}-${String((count ?? 0) + 1).padStart(5, "0")}`;
}

async function assertApplicantAssignment({
  organizationId,
  propertyId,
  unitId,
  client
}: {
  organizationId: string;
  propertyId: string | null;
  unitId: string | null;
  client: SupabaseClientType;
}) {
  if (unitId && !propertyId) throw new Error("A property must be selected when assigning a unit.");

  if (propertyId) {
    const { data: property, error } = await client
      .from("properties")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("id", propertyId)
      .is("deleted_at", null)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!property) throw new Error("Selected property is not available in this organization.");
  }

  if (unitId) {
    const { data: unit, error } = await client
      .from("units")
      .select("id, property_id")
      .eq("organization_id", organizationId)
      .eq("id", unitId)
      .is("deleted_at", null)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!unit) throw new Error("Selected unit is not available in this organization.");
    if (propertyId && unit.property_id !== propertyId) {
      throw new Error("Selected unit does not belong to the selected property.");
    }
  }
}

function getWeekStartDate(): string {
  const now = new Date();
  const day = now.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  now.setUTCDate(now.getUTCDate() + diff);
  return now.toISOString().slice(0, 10);
}

function getWeekEndDate(): string {
  const start = new Date(`${getWeekStartDate()}T00:00:00.000Z`);
  start.setUTCDate(start.getUTCDate() + 6);
  return start.toISOString().slice(0, 10);
}

function escapeLike(value: string): string {
  return value.replaceAll("%", "\\%").replaceAll("_", "\\_");
}

async function resolveClient(client?: SupabaseClientType): Promise<SupabaseClientType> {
  return client ?? (await createAuthServerComponentClient());
}
