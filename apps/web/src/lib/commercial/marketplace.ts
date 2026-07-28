/**
 * COM-001 Slice E — marketplace engagement model (A07 prep).
 * No partner picker UI; certified_partner rows may exist as stubs only.
 */
import { createServiceRoleServerClient } from "../auth/server";
import { emitCommercialOpsEvent } from "./ops-events";
import {
  ENGAGEMENT_PATHS,
  ENGAGEMENT_STATUSES,
  PROVIDER_TYPES,
  type EngagementPath,
  type EngagementStatus,
  type ImplementationEngagement,
  type ImplementationPartnerStub,
  type ProviderType
} from "./marketplace-types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

function serviceClient(): AnyClient {
  const client = createServiceRoleServerClient();
  if (!client) throw new Error("Marketplace prep requires SUPABASE_SERVICE_ROLE_KEY");
  return client;
}

function mapPartner(row: Record<string, unknown>): ImplementationPartnerStub {
  return {
    id: String(row["id"]),
    code: String(row["code"]),
    displayName: String(row["display_name"]),
    certificationStatus: String(row["certification_status"] ?? "stub") as ImplementationPartnerStub["certificationStatus"],
    regions: Array.isArray(row["regions"]) ? (row["regions"] as string[]) : [],
    languages: Array.isArray(row["languages"]) ? (row["languages"] as string[]) : [],
    services: Array.isArray(row["services"]) ? (row["services"] as string[]) : [],
    capacityLimit: row["capacity_limit"] != null ? Number(row["capacity_limit"]) : null,
    notes: row["notes"] != null ? String(row["notes"]) : null
  };
}

function mapEngagement(row: Record<string, unknown>): ImplementationEngagement {
  return {
    id: String(row["id"]),
    organizationId: String(row["organization_id"]),
    path: String(row["path"]) as EngagementPath,
    providerType: String(row["provider_type"]) as ProviderType,
    partnerId: row["partner_id"] != null ? String(row["partner_id"]) : null,
    status: String(row["status"]) as EngagementStatus,
    progressScore: Number(row["progress_score"] ?? 0),
    accessGrantId: row["access_grant_id"] != null ? String(row["access_grant_id"]) : null,
    notes: row["notes"] != null ? String(row["notes"]) : null,
    createdAt: String(row["created_at"]),
    updatedAt: String(row["updated_at"])
  };
}

export async function listPartnerStubs(): Promise<ImplementationPartnerStub[]> {
  const admin = serviceClient();
  const { data, error } = await admin
    .from("commercial_implementation_partners")
    .select("*")
    .order("display_name", { ascending: true });
  if (error) throw new Error(error.message);
  return ((data ?? []) as Array<Record<string, unknown>>).map(mapPartner);
}

/** Upsert a partner directory stub (staff prep only — not marketplace activation). */
export async function upsertPartnerStub(input: {
  code: string;
  displayName: string;
  certificationStatus?: ImplementationPartnerStub["certificationStatus"];
  notes?: string | null;
  actorUserId?: string | null;
}): Promise<ImplementationPartnerStub> {
  const admin = serviceClient();
  const code = input.code.trim().toLowerCase();
  if (!code) throw new Error("Partner code is required");
  const { data, error } = await admin
    .from("commercial_implementation_partners")
    .upsert(
      {
        code,
        display_name: input.displayName.trim(),
        certification_status: input.certificationStatus ?? "stub",
        notes: input.notes ?? null,
        updated_at: new Date().toISOString()
      },
      { onConflict: "code" }
    )
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to upsert partner stub");
  return mapPartner(data as Record<string, unknown>);
}

export async function listEngagements(input?: {
  organizationId?: string;
  limit?: number;
}): Promise<ImplementationEngagement[]> {
  const admin = serviceClient();
  let q = admin
    .from("commercial_implementation_engagements")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(input?.limit ?? 100);
  if (input?.organizationId) {
    q = q.eq("organization_id", input.organizationId);
  }
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return ((data ?? []) as Array<Record<string, unknown>>).map(mapEngagement);
}

/**
 * Create or update an engagement. Default provider is mpa_internal Professional/AI —
 * certified_partner requires an existing partner stub id (no UI workflow).
 */
export async function upsertEngagement(input: {
  organizationId: string;
  path: EngagementPath;
  providerType?: ProviderType;
  partnerId?: string | null;
  status?: EngagementStatus;
  progressScore?: number;
  notes?: string | null;
  actorUserId?: string | null;
}): Promise<ImplementationEngagement> {
  if (!(ENGAGEMENT_PATHS as readonly string[]).includes(input.path)) {
    throw new Error("Invalid engagement path");
  }
  const providerType = input.providerType ?? "mpa_internal";
  if (!(PROVIDER_TYPES as readonly string[]).includes(providerType)) {
    throw new Error("Invalid provider type");
  }
  if (providerType === "mpa_internal" && input.partnerId) {
    throw new Error("mpa_internal engagements cannot attach a partner_id");
  }
  if (providerType === "certified_partner" && !input.partnerId) {
    throw new Error("certified_partner engagements require partner_id stub");
  }
  const status = input.status ?? "requested";
  if (!(ENGAGEMENT_STATUSES as readonly string[]).includes(status)) {
    throw new Error("Invalid engagement status");
  }

  const admin = serviceClient();
  // Sync progress score from COM Slice B when available.
  let progressScore = input.progressScore ?? 0;
  if (input.progressScore == null) {
    const { data: progress } = await admin
      .from("commercial_implementation_progress")
      .select("score")
      .eq("organization_id", input.organizationId)
      .maybeSingle();
    if (progress) progressScore = Number(progress["score"] ?? 0);
  }

  const { data: existingRows } = await admin
    .from("commercial_implementation_engagements")
    .select("id, status")
    .eq("organization_id", input.organizationId)
    .eq("path", input.path)
    .order("created_at", { ascending: false })
    .limit(1);
  const existing = (existingRows as Array<Record<string, unknown>> | null)?.[0] ?? null;

  const payload = {
    organization_id: input.organizationId,
    path: input.path,
    provider_type: providerType,
    partner_id: providerType === "certified_partner" ? input.partnerId : null,
    status,
    progress_score: Math.max(0, Math.min(100, progressScore)),
    // Reserved for AUTH-001 Professional time-boxed grants — not issued here.
    access_grant_id: null as string | null,
    notes: input.notes ?? null,
    updated_at: new Date().toISOString()
  };

  let data: Record<string, unknown> | null = null;
  if (existing?.["id"]) {
    const updated = await admin
      .from("commercial_implementation_engagements")
      .update(payload)
      .eq("id", existing["id"])
      .select("*")
      .single();
    if (updated.error || !updated.data) {
      throw new Error(updated.error?.message ?? "Failed to update engagement");
    }
    data = updated.data as Record<string, unknown>;
  } else {
    const inserted = await admin
      .from("commercial_implementation_engagements")
      .insert(payload)
      .select("*")
      .single();
    if (inserted.error || !inserted.data) {
      throw new Error(inserted.error?.message ?? "Failed to create engagement");
    }
    data = inserted.data as Record<string, unknown>;
  }

  const engagement = mapEngagement(data);
  const priorStatus = existing ? String(existing["status"]) : null;
  if (!existing?.["id"]) {
    await emitCommercialOpsEvent({
      eventType: "commercial.engagement.created",
      organizationId: engagement.organizationId,
      subjectType: "implementation_engagement",
      subjectId: engagement.id,
      actorUserId: input.actorUserId ?? null,
      summary: `Implementation engagement created (${engagement.path})`,
      payload: {
        path: engagement.path,
        provider_type: engagement.providerType,
        status: engagement.status
      }
    });
  } else if (priorStatus !== engagement.status) {
    await emitCommercialOpsEvent({
      eventType: "commercial.engagement.status_changed",
      organizationId: engagement.organizationId,
      subjectType: "implementation_engagement",
      subjectId: engagement.id,
      actorUserId: input.actorUserId ?? null,
      summary: `Implementation engagement ${priorStatus} → ${engagement.status}`,
      payload: {
        from_status: priorStatus,
        to_status: engagement.status,
        path: engagement.path,
        provider_type: engagement.providerType
      }
    });
  }

  return engagement;
}
