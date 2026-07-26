import { createAuthServerComponentClient } from "../auth/server";
import type { OpsDbClient } from "./types";

export type ActivityTimelineEntry = {
  entryId: string;
  organizationId: string;
  eventId: string;
  eventType: string;
  occurredAt: string;
  actorLabel: string;
  summary: string;
  category: string;
  visibility: string;
  subjectType: string | null;
  subjectId: string | null;
  propertyId: string | null;
  unitId: string | null;
  href: string | null;
};

export type ListActivityTimelineOptions = {
  propertyId?: string | undefined;
  subjectType?: string | undefined;
  subjectId?: string | undefined;
  category?: string | undefined;
  limit?: number | undefined;
  cursorOccurredAt?: string | undefined;
};

type TimelineRow = {
  entry_id: string;
  organization_id: string;
  event_id: string;
  event_type: string;
  occurred_at: string;
  actor_label: string;
  summary: string;
  category: string;
  visibility: string;
  subject_type: string | null;
  subject_id: string | null;
  property_id: string | null;
  unit_id: string | null;
  href: string | null;
};

function toEntry(row: TimelineRow): ActivityTimelineEntry {
  return {
    entryId: row.entry_id,
    organizationId: row.organization_id,
    eventId: row.event_id,
    eventType: row.event_type,
    occurredAt: row.occurred_at,
    actorLabel: row.actor_label,
    summary: row.summary,
    category: row.category,
    visibility: row.visibility,
    subjectType: row.subject_type,
    subjectId: row.subject_id,
    propertyId: row.property_id,
    unitId: row.unit_id,
    href: row.href
  };
}

/**
 * Org-scoped Activity Timeline query. Ordered by occurred_at desc. Paginated via limit + cursor.
 */
export async function listOrgActivityTimeline(
  organizationId: string,
  options: ListActivityTimelineOptions = {},
  client?: OpsDbClient
): Promise<ActivityTimelineEntry[]> {
  const db =
    client ??
    ((await createAuthServerComponentClient()) as unknown as OpsDbClient);

  const limit = Math.min(Math.max(options.limit ?? 40, 1), 100);

  let query = db
    .from("ops_activity_timeline")
    .select(
      "entry_id, organization_id, event_id, event_type, occurred_at, actor_label, summary, category, visibility, subject_type, subject_id, property_id, unit_id, href"
    )
    .eq("organization_id", organizationId)
    .order("occurred_at", { ascending: false })
    .limit(limit);

  if (options.propertyId) query = query.eq("property_id", options.propertyId);
  if (options.category) query = query.eq("category", options.category);
  if (options.subjectType) query = query.eq("subject_type", options.subjectType);
  if (options.subjectId) query = query.eq("subject_id", options.subjectId);
  if (options.cursorOccurredAt) query = query.lt("occurred_at", options.cursorOccurredAt);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return ((data ?? []) as TimelineRow[]).map(toEntry);
}
