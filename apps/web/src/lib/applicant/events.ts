import type { createAuthServerComponentClient } from "../auth/server";
import type { Json } from "@mpa/supabase";
import type { ApplicantEventRecord, ApplicantRecord, ApplicantStatus } from "./contracts";

type SupabaseClientType = Awaited<ReturnType<typeof createAuthServerComponentClient>>;

export const APPLICANT_EVENT_TYPES = [
  "application_created",
  "submitted",
  "documents_requested",
  "documents_received",
  "screening_started",
  "screening_completed",
  "pending_review",
  "approved",
  "declined",
  "withdrawn",
  "signature_requested",
  "signature_completed",
  "converted_to_resident",
  "note_added",
  "task_completed",
  "status_changed",
  "assignment_changed"
] as const;

export type ApplicantEventType = (typeof APPLICANT_EVENT_TYPES)[number];

export async function recordApplicantEvent(
  organizationId: string,
  applicantId: string,
  userId: string,
  eventType: ApplicantEventType,
  summary: string,
  payload: Record<string, unknown> = {},
  client: SupabaseClientType
): Promise<ApplicantEventRecord> {
  const { data, error } = await client
    .from("applicant_events")
    .insert({
      organization_id: organizationId,
      applicant_id: applicantId,
      event_type: eventType,
      summary,
      payload: payload as Json,
      created_by: userId
    })
    .select("id, organization_id, applicant_id, event_type, summary, payload, created_by, created_at")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to record applicant event");
  }

  return toApplicantEventRecord(data);
}

const APPLICANT_LIFECYCLE_TRANSITIONS: Record<string, ApplicantStatus[]> = {
  submit: ["draft"],
  request_documents: ["submitted", "pending_review"],
  start_screening: ["submitted", "awaiting_documents"],
  mark_pending_review: ["screening_in_progress", "awaiting_documents"],
  approve: ["pending_review", "screening_in_progress"],
  decline: ["submitted", "awaiting_documents", "screening_in_progress", "pending_review"],
  withdraw: ["draft", "submitted", "awaiting_documents", "screening_in_progress", "pending_review", "approved"],
  convert_to_resident: ["approved"]
};

export function isApplicantLifecycleActionAllowed(currentStatus: ApplicantStatus, action: string): boolean {
  const permittedFrom = APPLICANT_LIFECYCLE_TRANSITIONS[action];
  if (!permittedFrom) return true;
  return permittedFrom.includes(currentStatus);
}

export function assertApplicantLifecycleTransition(currentStatus: ApplicantStatus, action: string) {
  if (!isApplicantLifecycleActionAllowed(currentStatus, action)) {
    throw new Error(`Cannot ${action.replaceAll("_", " ")} an application in ${currentStatus.replaceAll("_", " ")} status.`);
  }
}

export function applicantLifecycleSummary(
  action: string,
  applicant: Pick<ApplicantRecord, "applicationNumber" | "firstName" | "lastName">
): string {
  const name = `${applicant.firstName} ${applicant.lastName}`;
  const summaries: Record<string, string> = {
    submit: `Application ${applicant.applicationNumber} submitted by ${name}`,
    request_documents: `Documents requested for application ${applicant.applicationNumber}`,
    start_screening: `Screening started for application ${applicant.applicationNumber}`,
    mark_pending_review: `Application ${applicant.applicationNumber} marked pending review`,
    approve: `Application ${applicant.applicationNumber} approved`,
    decline: `Application ${applicant.applicationNumber} declined`,
    withdraw: `Application ${applicant.applicationNumber} withdrawn`,
    convert_to_resident: `${name} converted to resident from application ${applicant.applicationNumber}`
  };
  return summaries[action] ?? `Application ${applicant.applicationNumber} updated`;
}

function toApplicantEventRecord(row: {
  id: string;
  organization_id: string;
  applicant_id: string;
  event_type: string;
  summary: string;
  payload: Json | null;
  created_by: string;
  created_at: string;
}): ApplicantEventRecord {
  return {
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
  };
}
