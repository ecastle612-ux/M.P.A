import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildFacilityAttentionSections,
  countFacilityAttentionItems,
  type FacilityAttentionSection,
  type FacilityAttentionSourceRow
} from "@mpa/shared";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = SupabaseClient<any>;

export type FacilityMissionControlSnapshot = {
  todayOpen: number;
  emergency: number;
  open: number;
  overdue: number;
  waitingOnVendor: number;
  waitingOnTechnician: number;
  completedRecently: number;
  /** FO-EFF Slice 2 — actionable attention sections (manager). Empty for technician mode. */
  attention: FacilityAttentionSection[];
  attentionTotal: number;
  viewerMode: "manager" | "technician";
};

export type FacilitySnapshotRow = FacilityAttentionSourceRow & {
  status: string;
  priority?: string | null;
  assignee_type?: string | null;
  due_at?: string | null;
  submitted_at?: string | null;
  completed_at?: string | null;
  closed_at?: string | null;
};

function isOpenFacilityStatus(status: string) {
  return !["closed", "cancelled", "completed"].includes(status);
}

/** Pure attention buckets for Facility Mission Control (unit-testable). */
export function buildFacilityMissionControlSnapshot(
  rows: FacilitySnapshotRow[],
  nowInput: Date = new Date(),
  options?: { viewerMode?: "manager" | "technician" }
): FacilityMissionControlSnapshot {
  const now = nowInput;
  const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const viewerMode = options?.viewerMode ?? "manager";

  const openRows = rows.filter((row) => isOpenFacilityStatus(String(row.status)));
  const todayOpen = openRows.filter((row) => {
    const submitted = row.submitted_at ? new Date(String(row.submitted_at)) : null;
    const due = row.due_at ? new Date(String(row.due_at)) : null;
    const submittedToday = submitted !== null && submitted >= startOfToday;
    const dueToday =
      due !== null && due >= startOfToday && due < new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
    return submittedToday || dueToday;
  }).length;

  const attention =
    viewerMode === "manager"
      ? buildFacilityAttentionSections(rows, now, { hrefFrom: "mission-control" })
      : [];

  return {
    todayOpen,
    emergency: openRows.filter((row) => row.priority === "emergency").length,
    open: openRows.length,
    overdue: openRows.filter((row) => row.due_at && new Date(String(row.due_at)) < now).length,
    waitingOnVendor: openRows.filter(
      (row) => row.status === "assigned" && row.assignee_type === "vendor"
    ).length,
    waitingOnTechnician: openRows.filter(
      (row) => row.status === "assigned" && row.assignee_type === "technician"
    ).length,
    completedRecently: rows.filter((row) => {
      if (!["completed", "closed"].includes(String(row.status))) {
        return false;
      }
      const stamp = row.completed_at ?? row.closed_at;
      return stamp ? new Date(String(stamp)) >= sevenDaysAgo : false;
    }).length,
    attention,
    attentionTotal: countFacilityAttentionItems(attention),
    viewerMode
  };
}

/**
 * Single org-scoped query for Facility Mission Control counts + Needs Attention.
 * No additional round trips for attention categories.
 */
export async function getFacilityMissionControlSnapshot(
  supabase: Db,
  organizationId: string,
  options?: { viewerMode?: "manager" | "technician" }
): Promise<FacilityMissionControlSnapshot> {
  const { data, error } = await supabase
    .from("maintenance_work_orders")
    .select(
      [
        "id",
        "title",
        "status",
        "priority",
        "assignee_type",
        "technician_user_id",
        "due_at",
        "submitted_at",
        "completed_at",
        "closed_at",
        "cancelled_at",
        "intake_channel",
        "request_number",
        "floor_label",
        "department_label",
        "room_label",
        "facility_asset_label",
        "property_properties(name)"
      ].join(", ")
    )
    .eq("organization_id", organizationId)
    .eq("work_surface", "facility");
  if (error) {
    throw new Error(error.message);
  }

  return buildFacilityMissionControlSnapshot(
    (data ?? []) as unknown as FacilitySnapshotRow[],
    new Date(),
    {
      viewerMode: options?.viewerMode ?? "manager"
    }
  );
}
