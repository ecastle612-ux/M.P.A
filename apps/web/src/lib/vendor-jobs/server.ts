import { createHash, randomBytes } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@mpa/supabase";
import { createAuthServerComponentClient, createServiceRoleServerClient } from "../auth/server";
import { notify } from "../notifications/service";
import type { ArrivalLocation, VendorJobCard } from "./contracts";

export type { ArrivalLocation, VendorJobCard } from "./contracts";

// Tables may lag generated Database types.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

function summarizeDevice(userAgent: string | null | undefined): string | null {
  if (!userAgent) return null;
  const ua = userAgent.slice(0, 240);
  if (/iPhone|iPad/i.test(ua)) return "iOS";
  if (/Android/i.test(ua)) return "Android";
  if (/Edg\//i.test(ua)) return "Edge";
  if (/Chrome\//i.test(ua)) return "Chrome";
  if (/Safari\//i.test(ua)) return "Safari";
  return "Browser";
}

function formatAddress(row: {
  address_line_1?: string | null;
  address_line_2?: string | null;
  city?: string | null;
  state_region?: string | null;
  postal_code?: string | null;
}): string {
  const line1 = row.address_line_1?.trim() ?? "";
  const line2 = row.address_line_2?.trim() ?? "";
  const city = row.city?.trim() ?? "";
  const state = row.state_region?.trim() ?? "";
  const postal = row.postal_code?.trim() ?? "";
  const cityLine = [city, state].filter(Boolean).join(", ");
  return [line1, line2, [cityLine, postal].filter(Boolean).join(" ")].filter(Boolean).join(", ");
}

async function resolveClient(client?: SupabaseClient<Database>): Promise<AnyClient> {
  return client ?? (await createAuthServerComponentClient());
}

async function adminClient(): Promise<AnyClient> {
  return createServiceRoleServerClient() as AnyClient;
}

async function recordActivity(
  admin: AnyClient,
  input: {
    organizationId: string;
    workOrderId: string;
    eventType: string;
    summary: string;
    details?: Record<string, unknown>;
    actorUserId?: string | null;
  }
) {
  await admin.from("maintenance_activity_events").insert({
    organization_id: input.organizationId,
    work_order_id: input.workOrderId,
    event_type: input.eventType,
    summary: input.summary,
    details: (input.details ?? {}) as Json,
    actor_user_id: input.actorUserId ?? null
  });
}

async function notifyManagers(
  admin: AnyClient,
  organizationId: string,
  workOrder: {
    id: string;
    title: string;
    work_order_number: string;
    created_by: string;
    assigned_to_user_id: string | null;
    property_id: string;
    unit_id: string | null;
  },
  title: string,
  body: string,
  eventKey: string
) {
  const { data: memberships } = await admin
    .from("organization_memberships")
    .select("user_id, roles")
    .eq("organization_id", organizationId)
    .eq("status", "active");

  const managerIds = ((memberships ?? []) as Array<{ user_id: string; roles: string[] | null }>)
    .filter(
      (row) =>
        Array.isArray(row.roles) &&
        (row.roles.includes("property_manager") || row.roles.includes("owner"))
    )
    .map((row) => row.user_id);

  const recipientUserIds = [
    ...new Set(
      [...managerIds, workOrder.created_by, workOrder.assigned_to_user_id].filter(
        (id): id is string => Boolean(id)
      )
    )
  ];

  if (recipientUserIds.length === 0) return;

  await notify(
    {
      organizationId,
      actorUserId: null,
      eventKey,
      recipientUserIds,
      category: "maintenance",
      priority: "normal",
      title,
      body,
      href: `/maintenance/${workOrder.id}`,
      sourceEntityType: "maintenance_work_order",
      sourceEntityId: workOrder.id,
      propertyId: workOrder.property_id,
      unitId: workOrder.unit_id
    },
    admin
  ).catch(() => undefined);
}

export async function mintVendorWorkOrderToken(
  organizationId: string,
  workOrderId: string,
  actorUserId: string,
  client?: SupabaseClient<Database>
): Promise<{ rawToken: string; urlPath: string; tokenId: string; prefix: string }> {
  const db = await resolveClient(client);
  const admin = await adminClient();

  const { data: wo, error } = await db
    .from("maintenance_work_orders")
    .select("id, organization_id, vendor_id, status, deleted_at")
    .eq("organization_id", organizationId)
    .eq("id", workOrderId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !wo) throw new Error("Work order not found");

  // Revoke prior active tokens for this WO
  await admin
    .from("vendor_work_order_tokens")
    .update({ revoked_at: new Date().toISOString() })
    .eq("organization_id", organizationId)
    .eq("work_order_id", workOrderId)
    .is("revoked_at", null);

  const rawToken = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(rawToken);
  const prefix = rawToken.slice(0, 8);

  const { data: inserted, error: insertError } = await admin
    .from("vendor_work_order_tokens")
    .insert({
      organization_id: organizationId,
      work_order_id: workOrderId,
      vendor_id: wo.vendor_id ?? null,
      token_hash: tokenHash,
      token_prefix: prefix,
      created_by: actorUserId,
      expires_at: null
    })
    .select("id")
    .single();

  if (insertError || !inserted) throw new Error(insertError?.message ?? "Failed to mint token");

  await recordActivity(admin, {
    organizationId,
    workOrderId,
    eventType: "vendor_token_minted",
    summary: "Vendor job link / QR generated",
    details: { tokenId: inserted.id, prefix },
    actorUserId
  });

  return {
    rawToken,
    urlPath: `/v/${rawToken}`,
    tokenId: String(inserted.id),
    prefix
  };
}

export async function getActiveVendorTokenForWorkOrder(
  organizationId: string,
  workOrderId: string,
  client?: SupabaseClient<Database>
): Promise<{ tokenId: string; prefix: string; createdAt: string } | null> {
  const db = await resolveClient(client);
  const { data } = await db
    .from("vendor_work_order_tokens")
    .select("id, token_prefix, created_at, revoked_at, expires_at")
    .eq("organization_id", organizationId)
    .eq("work_order_id", workOrderId)
    .is("revoked_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;
  if (data.expires_at && new Date(data.expires_at).getTime() < Date.now()) return null;
  return {
    tokenId: String(data.id),
    prefix: String(data.token_prefix),
    createdAt: String(data.created_at)
  };
}

async function loadTokenRow(admin: AnyClient, rawToken: string) {
  const tokenHash = hashToken(rawToken);
  const { data: token } = await admin
    .from("vendor_work_order_tokens")
    .select("*")
    .eq("token_hash", tokenHash)
    .maybeSingle();
  if (!token) return null;
  if (token.revoked_at) return { error: "revoked" as const };
  if (token.expires_at && new Date(token.expires_at).getTime() < Date.now()) {
    return { error: "expired" as const };
  }
  return { token };
}

export async function getVendorJobCard(rawToken: string): Promise<VendorJobCard> {
  const admin = await adminClient();
  const resolved = await loadTokenRow(admin, rawToken);
  if (!resolved || "error" in resolved) {
    throw Object.assign(new Error(resolved?.error === "revoked" ? "Link revoked" : "Link unavailable"), {
      code: resolved?.error ?? "not_found",
      status: resolved?.error ? 410 : 404
    });
  }
  const token = resolved.token as Record<string, unknown>;

  const { data: wo } = await admin
    .from("maintenance_work_orders")
    .select(
      "id, organization_id, work_order_number, title, description, status, property_id, unit_id, assigned_to_user_id, created_by, metadata, deleted_at"
    )
    .eq("id", token["work_order_id"])
    .eq("organization_id", token["organization_id"])
    .is("deleted_at", null)
    .maybeSingle();

  if (!wo) {
    throw Object.assign(new Error("Work order not found"), { code: "not_found", status: 404 });
  }

  const { data: property } = await admin
    .from("properties")
    .select("name, address_line_1, address_line_2, city, state_region, postal_code, owner_contact_name, owner_contact_phone, owner_contact_email")
    .eq("id", wo.property_id)
    .eq("organization_id", wo.organization_id)
    .maybeSingle();

  let managerName: string | null = property?.owner_contact_name ?? null;
  let managerPhone: string | null = property?.owner_contact_phone ?? null;
  let managerEmail: string | null = property?.owner_contact_email ?? null;

  const managerUserId = wo.assigned_to_user_id ?? wo.created_by;
  if (managerUserId) {
    const { data: profile } = await admin
      .from("user_profiles")
      .select("display_name, phone, contact_email")
      .eq("user_id", managerUserId)
      .maybeSingle();
    if (profile) {
      managerName = (profile.display_name as string | null) ?? managerName;
      managerPhone = (profile.phone as string | null) ?? managerPhone;
      managerEmail = (profile.contact_email as string | null) ?? managerEmail;
    }
  }

  const { data: session } = await admin
    .from("vendor_job_sessions")
    .select("*")
    .eq("token_id", token["id"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  await admin
    .from("vendor_work_order_tokens")
    .update({ last_viewed_at: new Date().toISOString() })
    .eq("id", token["id"]);

  const status = String(wo.status);
  let phase: VendorJobCard["phase"] = "ready";
  if (status === "awaiting_approval" || status === "completed" || session?.completed_at) {
    phase = "finished";
  } else if (status === "vendor_on_site" || session?.started_at) {
    phase = "on_site";
  } else if (status === "cancelled") {
    phase = "unavailable";
  }

  const meta = (wo.metadata ?? {}) as Record<string, unknown>;
  const estimatedTime =
    typeof meta["estimated_time"] === "string"
      ? meta["estimated_time"]
      : typeof meta["estimatedTime"] === "string"
        ? meta["estimatedTime"]
        : null;

  return {
    tokenPrefix: String(token["token_prefix"]),
    workOrderId: String(wo.id),
    workOrderNumber: String(wo.work_order_number),
    title: String(wo.title),
    description: (wo.description as string | null) ?? null,
    propertyAddress: property
      ? formatAddress(property) || (property.name as string) || "Property"
      : "Property",
    estimatedTime,
    managerName,
    managerPhone,
    managerEmail,
    status,
    phase,
    startedAt: (session?.started_at as string | null) ?? null,
    completedAt: (session?.completed_at as string | null) ?? null,
    arrivalRecordedWithLocation: Boolean(session?.arrival_latitude != null)
  };
}

export async function startVendorJob(
  rawToken: string,
  input: {
    userAgent?: string | null;
    location?: ArrivalLocation | null;
    clientTimestamp?: string | null;
  }
): Promise<VendorJobCard> {
  const admin = await adminClient();
  const resolved = await loadTokenRow(admin, rawToken);
  if (!resolved || "error" in resolved) {
    throw Object.assign(new Error("Link unavailable"), { code: resolved?.error ?? "not_found", status: 410 });
  }
  const token = resolved.token as Record<string, unknown>;

  const { data: wo } = await admin
    .from("maintenance_work_orders")
    .select("*")
    .eq("id", token["work_order_id"])
    .eq("organization_id", token["organization_id"])
    .is("deleted_at", null)
    .maybeSingle();
  if (!wo) throw Object.assign(new Error("Work order not found"), { status: 404 });

  if (["cancelled", "completed"].includes(String(wo.status))) {
    throw Object.assign(new Error("This job is no longer available"), { status: 409 });
  }

  const now = new Date().toISOString();
  const deviceSummary = summarizeDevice(input.userAgent);

  const { data: existingSession } = await admin
    .from("vendor_job_sessions")
    .select("*")
    .eq("token_id", token["id"])
    .not("started_at", "is", null)
    .is("completed_at", null)
    .maybeSingle();

  if (existingSession) {
    return getVendorJobCard(rawToken);
  }

  const location = input.location;
  const { error: sessionError } = await admin.from("vendor_job_sessions").insert({
    organization_id: token["organization_id"],
    work_order_id: token["work_order_id"],
    token_id: token["id"],
    started_at: now,
    arrival_latitude: location?.latitude ?? null,
    arrival_longitude: location?.longitude ?? null,
    arrival_accuracy_m: location?.accuracyM ?? null,
    device_summary: deviceSummary,
    metadata: {
      client_timestamp: input.clientTimestamp ?? null,
      location_granted: Boolean(location)
    } as Json
  });
  if (sessionError) throw new Error(sessionError.message);

  await admin
    .from("maintenance_work_orders")
    .update({ status: "vendor_on_site", updated_at: now })
    .eq("id", wo.id)
    .eq("organization_id", wo.organization_id);

  if (wo.current_vendor_assignment_id) {
    await admin
      .from("maintenance_vendor_assignments")
      .update({
        assignment_status: "arrived",
        arrived_at: now,
        updated_at: now
      })
      .eq("id", wo.current_vendor_assignment_id)
      .eq("organization_id", wo.organization_id);
  }

  await recordActivity(admin, {
    organizationId: String(wo.organization_id),
    workOrderId: String(wo.id),
    eventType: "vendor_job_started",
    summary: location
      ? "Vendor arrived on site (location recorded)"
      : "Vendor arrived on site (timestamp only)",
    details: {
      startedAt: now,
      clientTimestamp: input.clientTimestamp ?? null,
      deviceSummary,
      locationGranted: Boolean(location),
      latitude: location?.latitude ?? null,
      longitude: location?.longitude ?? null,
      accuracyM: location?.accuracyM ?? null
    }
  });

  await notifyManagers(
    admin,
    String(wo.organization_id),
    wo,
    "Vendor on site",
    `${wo.work_order_number}: ${wo.title}`,
    `maintenance.vendor_on_site:${wo.id}:${now}`
  );

  return getVendorJobCard(rawToken);
}

export async function finishVendorJob(
  rawToken: string,
  input: {
    notes?: string | null;
    photoPaths?: string[];
    userAgent?: string | null;
  }
): Promise<VendorJobCard> {
  const admin = await adminClient();
  const resolved = await loadTokenRow(admin, rawToken);
  if (!resolved || "error" in resolved) {
    throw Object.assign(new Error("Link unavailable"), { code: resolved?.error ?? "not_found", status: 410 });
  }
  const token = resolved.token as Record<string, unknown>;

  const { data: wo } = await admin
    .from("maintenance_work_orders")
    .select("*")
    .eq("id", token["work_order_id"])
    .eq("organization_id", token["organization_id"])
    .is("deleted_at", null)
    .maybeSingle();
  if (!wo) throw Object.assign(new Error("Work order not found"), { status: 404 });

  const { data: session } = await admin
    .from("vendor_job_sessions")
    .select("*")
    .eq("token_id", token["id"])
    .not("started_at", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!session?.started_at) {
    throw Object.assign(new Error("Start the job before finishing"), { status: 409 });
  }
  if (session.completed_at) {
    return getVendorJobCard(rawToken);
  }

  const now = new Date().toISOString();
  const notes = input.notes?.trim() ? input.notes.trim().slice(0, 4000) : null;
  const photoPaths = (input.photoPaths ?? []).slice(0, 8);

  await admin
    .from("vendor_job_sessions")
    .update({
      completed_at: now,
      completion_notes: notes,
      photo_paths: photoPaths,
      device_summary: session.device_summary ?? summarizeDevice(input.userAgent)
    })
    .eq("id", session.id);

  const existingMeta = (wo.metadata ?? {}) as Record<string, unknown>;
  await admin
    .from("maintenance_work_orders")
    .update({
      status: "awaiting_approval",
      updated_at: now,
      metadata: {
        ...existingMeta,
        vendor_completion_notes: notes,
        vendor_completion_photo_paths: photoPaths,
        vendor_completed_at: now
      } as Json
    })
    .eq("id", wo.id)
    .eq("organization_id", wo.organization_id);

  // Keep assignment in progress — PM approval (later phase) completes the WO.
  if (wo.current_vendor_assignment_id) {
    await admin
      .from("maintenance_vendor_assignments")
      .update({
        assignment_status: "in_progress",
        completion_notes: notes,
        updated_at: now
      })
      .eq("id", wo.current_vendor_assignment_id)
      .eq("organization_id", wo.organization_id);
  }

  await recordActivity(admin, {
    organizationId: String(wo.organization_id),
    workOrderId: String(wo.id),
    eventType: "vendor_job_finished",
    summary: "Vendor finished job — awaiting approval",
    details: {
      completedAt: now,
      notesPresent: Boolean(notes),
      photoCount: photoPaths.length
    }
  });

  await notifyManagers(
    admin,
    String(wo.organization_id),
    wo,
    "Job awaiting approval",
    `${wo.work_order_number}: ${wo.title}`,
    `maintenance.vendor_awaiting_approval:${wo.id}:${now}`
  );

  return getVendorJobCard(rawToken);
}

export async function uploadVendorJobPhoto(
  rawToken: string,
  file: { bytes: Uint8Array; contentType: string; fileName: string }
): Promise<string> {
  const admin = await adminClient();
  const resolved = await loadTokenRow(admin, rawToken);
  if (!resolved || "error" in resolved) {
    throw Object.assign(new Error("Link unavailable"), { status: 410 });
  }
  const token = resolved.token as Record<string, unknown>;
  const ext = file.fileName.includes(".") ? file.fileName.split(".").pop()?.slice(0, 8) : "jpg";
  const path = `${token["organization_id"]}/${token["work_order_id"]}/${Date.now()}-${randomBytes(4).toString("hex")}.${ext || "jpg"}`;

  const { error } = await admin.storage.from("media").upload(path, file.bytes, {
    contentType: file.contentType || "image/jpeg",
    upsert: false
  });
  if (error) {
    // Fallback path label when bucket policy blocks — still record intent for PM.
    return `pending:${path}`;
  }
  return path;
}
