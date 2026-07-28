/**
 * COM-001 Slice C — customer communication timeline (commercial/success).
 * Distinct from OPS activity timeline; emits secret-free OPS events on append.
 */
import { createServiceRoleServerClient } from "../auth/server";
import { emitCommercialOpsEvent } from "./ops-events";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

function serviceClient(): AnyClient {
  const client = createServiceRoleServerClient();
  if (!client) throw new Error("Communication timeline requires SUPABASE_SERVICE_ROLE_KEY");
  return client;
}

export const TIMELINE_CHANNELS = [
  "email",
  "in_app",
  "sms",
  "call_note",
  "push",
  "system"
] as const;

export type TimelineChannel = (typeof TIMELINE_CHANNELS)[number];

export const TIMELINE_ENTRY_TYPES = [
  "welcome_email",
  "implementation_reminder",
  "invoice",
  "renewal_notice",
  "past_due",
  "cancellation_warning",
  "feature_announcement",
  "support_follow_up",
  "customer_success_check_in",
  "trial_reminder",
  "feature_discovery",
  "offboarding",
  "manual_note"
] as const;

export type TimelineEntryType = (typeof TIMELINE_ENTRY_TYPES)[number] | string;

const SECRET_METADATA_KEYS = [
  "password",
  "temporary_password",
  "temp_password",
  "secret",
  "token",
  "api_key",
  "authorization",
  "recovery_code"
];

export function sanitizeTimelineMetadata(
  metadata: Record<string, unknown> | undefined
): Record<string, unknown> {
  if (!metadata) return {};
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata)) {
    const lower = key.toLowerCase();
    if (SECRET_METADATA_KEYS.some((s) => lower.includes(s))) continue;
    if (typeof value === "string" && /password|secret|token/i.test(value) && value.length > 24) {
      continue;
    }
    out[key] = value;
  }
  return out;
}

export type CommunicationTimelineEntry = {
  id: string;
  organizationId: string | null;
  opportunityId: string | null;
  occurredAt: string;
  channel: TimelineChannel;
  entryType: string;
  templateKey: string;
  direction: "outbound" | "inbound_note";
  actorType: "system" | "cs_user" | "ai";
  actorUserId: string | null;
  relatedObjectType: string | null;
  relatedObjectId: string | null;
  deliveryStatus: string;
  summary: string;
  metadata: Record<string, unknown>;
  createdAt: string;
};

function mapRow(row: Record<string, unknown>): CommunicationTimelineEntry {
  return {
    id: String(row["id"]),
    organizationId: row["organization_id"] != null ? String(row["organization_id"]) : null,
    opportunityId: row["opportunity_id"] != null ? String(row["opportunity_id"]) : null,
    occurredAt: String(row["occurred_at"] ?? ""),
    channel: String(row["channel"] ?? "system") as TimelineChannel,
    entryType: String(row["entry_type"] ?? ""),
    templateKey: String(row["template_key"] ?? ""),
    direction: row["direction"] === "inbound_note" ? "inbound_note" : "outbound",
    actorType:
      row["actor_type"] === "cs_user" || row["actor_type"] === "ai"
        ? (row["actor_type"] as "cs_user" | "ai")
        : "system",
    actorUserId: row["actor_user_id"] != null ? String(row["actor_user_id"]) : null,
    relatedObjectType:
      row["related_object_type"] != null ? String(row["related_object_type"]) : null,
    relatedObjectId: row["related_object_id"] != null ? String(row["related_object_id"]) : null,
    deliveryStatus: String(row["delivery_status"] ?? "n_a"),
    summary: String(row["summary"] ?? ""),
    metadata:
      row["metadata"] && typeof row["metadata"] === "object"
        ? (row["metadata"] as Record<string, unknown>)
        : {},
    createdAt: String(row["created_at"] ?? "")
  };
}

async function resolveOpportunityId(
  admin: AnyClient,
  organizationId: string | null,
  opportunityId: string | null | undefined
): Promise<string | null> {
  if (opportunityId) return opportunityId;
  if (!organizationId) return null;
  const { data } = await admin
    .from("commercial_opportunities")
    .select("id")
    .eq("organization_id", organizationId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.id != null ? String(data.id) : null;
}

export async function appendCommunicationTimeline(input: {
  organizationId?: string | null;
  opportunityId?: string | null;
  occurredAt?: string;
  channel: TimelineChannel;
  entryType: TimelineEntryType;
  templateKey: string;
  direction: "outbound" | "inbound_note";
  actorType: "system" | "cs_user" | "ai";
  actorUserId?: string | null;
  relatedObjectType?: string | null;
  relatedObjectId?: string | null;
  deliveryStatus?: string;
  summary: string;
  metadata?: Record<string, unknown>;
  actorEmitUserId?: string | null;
  emitOps?: boolean;
}): Promise<CommunicationTimelineEntry> {
  if (!input.organizationId && !input.opportunityId) {
    throw new Error("organizationId or opportunityId is required");
  }
  // CT-03 — never persist credential secrets in summary/metadata.
  const summary = input.summary.replace(/password[=:\s]+\S+/gi, "password=[redacted]");
  if (/temporary.?password|temp.?password/i.test(summary) && /:\s*\S+/.test(summary)) {
    throw new Error("Timeline summary must not include credential secrets");
  }

  const admin = serviceClient();
  const opportunityId = await resolveOpportunityId(
    admin,
    input.organizationId ?? null,
    input.opportunityId
  );
  const metadata = sanitizeTimelineMetadata(input.metadata);

  const { data, error } = await admin
    .from("commercial_communication_timeline")
    .insert({
      organization_id: input.organizationId ?? null,
      opportunity_id: opportunityId,
      occurred_at: input.occurredAt ?? new Date().toISOString(),
      channel: input.channel,
      entry_type: input.entryType,
      template_key: input.templateKey,
      direction: input.direction,
      actor_type: input.actorType,
      actor_user_id: input.actorUserId ?? null,
      related_object_type: input.relatedObjectType ?? null,
      related_object_id: input.relatedObjectId ?? null,
      delivery_status: input.deliveryStatus ?? "n_a",
      summary,
      metadata
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to append communication timeline");
  }

  const entry = mapRow(data as Record<string, unknown>);

  if (input.emitOps !== false) {
    await emitCommercialOpsEvent({
      eventType: "commercial.timeline.entry_appended",
      organizationId: entry.organizationId,
      subjectType: entry.organizationId ? "organization" : "opportunity",
      subjectId: entry.organizationId ?? entry.opportunityId ?? entry.id,
      actorUserId: input.actorEmitUserId,
      summary: `Timeline ${entry.entryType}`,
      payload: {
        entry_id: entry.id,
        entry_type: entry.entryType,
        channel: entry.channel,
        template_key: entry.templateKey,
        delivery_status: entry.deliveryStatus,
        opportunity_id: entry.opportunityId
      }
    });
  }

  return entry;
}

export async function listCommunicationTimeline(input: {
  organizationId?: string;
  opportunityId?: string;
  limit?: number;
}): Promise<CommunicationTimelineEntry[]> {
  const admin = serviceClient();
  if (!input.organizationId && !input.opportunityId) {
    throw new Error("organizationId or opportunityId is required");
  }
  const limit = Math.max(1, Math.min(200, input.limit ?? 50));
  let query = admin
    .from("commercial_communication_timeline")
    .select("*")
    .order("occurred_at", { ascending: false })
    .limit(limit);

  if (input.organizationId) {
    query = query.eq("organization_id", input.organizationId);
  }
  if (input.opportunityId) {
    query = query.eq("opportunity_id", input.opportunityId);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return ((data ?? []) as Array<Record<string, unknown>>).map(mapRow);
}
