import type { SupabaseClient } from "@supabase/supabase-js";
import {
  facilityOperationsWorkOrderHref,
  formatFacilityRequestNumber,
  isFacilityRequestAccessPolicy,
  publicPortalLockedContext,
  publicTrackingView,
  resolveIntakeChannel,
  validateFacilityRequestSubmission,
  visibleRequestFields,
  type FacilityRequestAccessPolicy,
  type FacilityRequestFieldSnapshot,
  type FacilityRequestIntakeChannel,
  type WorkOrderStatus
} from "@mpa/shared";
import { writeMaintenanceAudit } from "../maintenance/events-audit";
import { notifyLifecycle } from "../maintenance/lifecycle-notify";
import { createFacilityWorkOrder } from "../maintenance/maintenance-service";
import { sendOperationalNoticeEmail } from "../communications/email";
import { lockedContextFromIntake } from "./request-form-service";
import { generateFacilityRequestToken, hashFacilityRequestToken, looksLikeHighEntropyToken } from "./request-token";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = SupabaseClient<any>;

export type PublicRequestPortal = {
  formName: string;
  organizationName: string;
  instructions: string | null;
  accessPolicy: FacilityRequestAccessPolicy;
  fields: FacilityRequestFieldSnapshot["fields"];
  lockedContext: ReturnType<typeof lockedContextFromIntake>;
  buildings: Array<{ id: string; name: string }>;
  requiresAuth: boolean;
};

export function toPublicPortalPayload(portal: PublicRequestPortal) {
  const locked = publicPortalLockedContext(portal.lockedContext);
  return {
    formName: portal.formName,
    organizationName: portal.organizationName,
    instructions: portal.instructions,
    accessPolicy: portal.accessPolicy,
    fields: portal.fields,
    lockedContext: locked,
    buildings: portal.lockedContext.propertyId ? [] : portal.buildings,
    requiresAuth: portal.requiresAuth
  };
}

async function nextRequestNumber(supabase: Db, organizationId: string): Promise<string> {
  const year = new Date().getUTCFullYear();
  const { data: existing } = await supabase
    .from("facility_request_number_counters")
    .select("last_value")
    .eq("organization_id", organizationId)
    .eq("year", year)
    .maybeSingle();
  const next = (existing?.last_value ?? 0) + 1;
  if (existing) {
    const { error } = await supabase
      .from("facility_request_number_counters")
      .update({ last_value: next })
      .eq("organization_id", organizationId)
      .eq("year", year);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("facility_request_number_counters").insert({
      organization_id: organizationId,
      year,
      last_value: next
    });
    if (error) throw new Error(error.message);
  }
  return formatFacilityRequestNumber(year, next);
}

export async function resolvePublicIntake(
  supabase: Db,
  token: string
): Promise<
  | {
      ok: true;
      organizationId: string;
      intakeId: string;
      formId: string;
      versionId: string;
      createdByUserId: string | null;
      portal: PublicRequestPortal;
    }
  | { ok: false; error: string; status: number }
> {
  if (!looksLikeHighEntropyToken(token)) {
    return { ok: false, error: "This request link is no longer available.", status: 404 };
  }
  const hash = hashFacilityRequestToken(token);
  const { data: intake, error } = await supabase
    .from("facility_request_intakes")
    .select("id, organization_id, form_id, status, context_json")
    .eq("public_token_hash", hash)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!intake || intake.status !== "active") {
    return { ok: false, error: "This request link is no longer available.", status: 404 };
  }

  const { data: form } = await supabase
    .from("facility_request_forms")
    .select("id, name, instructions, status, access_policy, current_version_id, property_id, created_by_user_id")
    .eq("id", intake.form_id)
    .eq("organization_id", intake.organization_id)
    .maybeSingle();
  if (!form || form.status !== "active" || !form.current_version_id) {
    return { ok: false, error: "This request link is no longer available.", status: 404 };
  }
  if (!isFacilityRequestAccessPolicy(form.access_policy)) {
    return { ok: false, error: "This request link is no longer available.", status: 404 };
  }

  const { data: version } = await supabase
    .from("facility_request_form_versions")
    .select("id, field_snapshot, published_at")
    .eq("id", form.current_version_id)
    .maybeSingle();
  if (!version?.published_at) {
    return { ok: false, error: "This request link is no longer available.", status: 404 };
  }

  const { data: organization } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", intake.organization_id)
    .maybeSingle();
  const { data: buildings } = await supabase
    .from("property_properties")
    .select("id, name")
    .eq("organization_id", intake.organization_id)
    .order("name");

  const snapshot = version.field_snapshot as FacilityRequestFieldSnapshot;
  const locked = lockedContextFromIntake((intake.context_json ?? {}) as Record<string, unknown>);
  if (form.property_id && !locked.propertyId) {
    const building = (buildings ?? []).find((row) => row.id === form.property_id);
    locked.propertyId = form.property_id;
    locked.propertyLabel = building?.name;
  }

  return {
    ok: true,
    organizationId: intake.organization_id,
    intakeId: intake.id,
    formId: form.id,
    versionId: version.id,
    createdByUserId: typeof form.created_by_user_id === "string" ? form.created_by_user_id : null,
    portal: {
      formName: form.name,
      organizationName: organization?.name ?? "Facility",
      instructions: form.instructions,
      accessPolicy: form.access_policy,
      fields: visibleRequestFields(snapshot.fields),
      lockedContext: locked,
      buildings: (buildings ?? []).map((row) => ({ id: row.id, name: row.name })),
      requiresAuth: form.access_policy === "authenticated_only"
    }
  };
}

async function resolveBuildingId(
  lockedPropertyId: string | null,
  submittedBuilding: string | null,
  buildings: Array<{ id: string; name: string }>
): Promise<string | null> {
  if (lockedPropertyId) {
    const owned = buildings.find((row) => row.id === lockedPropertyId);
    return owned?.id ?? null;
  }
  if (!submittedBuilding) return null;
  const byId = buildings.find((row) => row.id === submittedBuilding);
  if (byId) return byId.id;
  const byName = buildings.find((row) => row.name === submittedBuilding);
  return byName?.id ?? null;
}

async function listFacilityManagers(supabase: Db, organizationId: string): Promise<string[]> {
  const { data } = await supabase
    .from("organization_memberships")
    .select("user_id, roles, operating_scope")
    .eq("organization_id", organizationId)
    .eq("status", "active");
  return (data ?? [])
    .filter((row) => {
      const roles = (row.roles as string[]) ?? [];
      return roles.includes("organization_admin") || roles.includes("property_manager");
    })
    .map((row) => row.user_id)
    .filter((id): id is string => typeof id === "string");
}

export async function submitPublicRequest(
  supabase: Db,
  input: {
    token: string;
    via?: string | null;
    values: Record<string, unknown>;
    attachments?: Array<{ kind: "image" | "video"; mimeType: string; fileSize: number; mediaId?: string }>;
    idempotencyKey: string;
    actorUserId?: string | null;
    clientOrganizationId?: unknown;
    clientPropertyId?: unknown;
    clientAssetId?: unknown;
    expectedVersionId?: string | null;
    origin: string;
  }
): Promise<
  | {
      ok: true;
      requestNumber: string;
      title: string;
      location: string | null;
      submittedAt: string;
      statusToken: string;
      statusPath: string;
      source: FacilityRequestIntakeChannel;
      requesterEmail: string | null;
    }
  | { ok: false; error: string; status: number }
> {
  const resolved = await resolvePublicIntake(supabase, input.token);
  if (!resolved.ok) return resolved;
  if (resolved.portal.requiresAuth && !input.actorUserId) {
    return { ok: false, error: "Sign in to submit this request.", status: 401 };
  }

  const { data: version } = await supabase
    .from("facility_request_form_versions")
    .select("id, field_snapshot, published_at")
    .eq("id", resolved.versionId)
    .maybeSingle();
  if (!version?.published_at) {
    return { ok: false, error: "This request form was updated. Refresh and try again.", status: 409 };
  }
  if (input.expectedVersionId && input.expectedVersionId !== version.id) {
    return { ok: false, error: "This request form was updated. Refresh and try again.", status: 409 };
  }

  const { data: replay } = await supabase
    .from("facility_request_submissions")
    .select("work_order_id, status_token_hash, submitted_at")
    .eq("organization_id", resolved.organizationId)
    .eq("intake_id", resolved.intakeId)
    .eq("idempotency_key", input.idempotencyKey)
    .maybeSingle();
  if (replay) {
    const { data: workOrder } = await supabase
      .from("maintenance_work_orders")
      .select("request_number, title, submitted_at, floor_label, department_label, room_label, property_properties(name)")
      .eq("id", replay.work_order_id)
      .maybeSingle();
    return {
      ok: true,
      requestNumber: workOrder?.request_number ?? "FR-0000-00000",
      title: workOrder?.title ?? "Request",
      location: [workOrder?.property_properties && (workOrder.property_properties as { name?: string }).name, workOrder?.floor_label, workOrder?.department_label]
        .filter(Boolean)
        .join(" · ") || null,
      submittedAt: workOrder?.submitted_at ?? replay.submitted_at,
      statusToken: "",
      statusPath: "/request/status",
      source: resolveIntakeChannel({
        via: input.via ?? null,
        accessPolicy: resolved.portal.accessPolicy
      }),
      requesterEmail: null
    };
  }

  const validated = validateFacilityRequestSubmission({
    snapshot: version.field_snapshot as FacilityRequestFieldSnapshot,
    values: input.values,
    attachments: input.attachments ?? [],
    lockedContext: resolved.portal.lockedContext,
    accessPolicy: resolved.portal.accessPolicy,
    clientOrganizationId: input.clientOrganizationId,
    clientPropertyId: input.clientPropertyId,
    clientAssetId: input.clientAssetId
  });
  if (!validated.ok) {
    return { ok: false, error: validated.error, status: 400 };
  }

  const propertyId = await resolveBuildingId(
    validated.propertyId,
    typeof input.values["building"] === "string" ? input.values["building"] : validated.propertyLabel,
    resolved.portal.buildings
  );
  if (!propertyId) {
    return { ok: false, error: "Building is required.", status: 400 };
  }

  const requestNumber = await nextRequestNumber(supabase, resolved.organizationId);
  const source = resolveIntakeChannel({
    via: input.via ?? null,
    accessPolicy: resolved.portal.accessPolicy
  });
  const statusToken = generateFacilityRequestToken();
  const managers = await listFacilityManagers(supabase, resolved.organizationId);
  const createdByUserId = input.actorUserId ?? resolved.createdByUserId ?? managers[0] ?? null;
  if (!createdByUserId) {
    return { ok: false, error: "Request intake is unavailable.", status: 503 };
  }

  const workOrder = await createFacilityWorkOrder(
    supabase,
    resolved.organizationId,
    input.actorUserId ?? null,
    {
      title: validated.title,
      description: validated.description,
      category: validated.category,
      priority: "normal",
      propertyId,
      facilityAssetLabel: validated.facilityAssetLabel ?? undefined,
      facilityAssetId: validated.facilityAssetId ?? undefined
    },
    {
      requestedByUserId: input.actorUserId ?? null,
      createdByUserId,
      intakeChannel: source,
      requestNumber,
      originSource: "public_request",
      floorLabel: validated.floorLabel,
      departmentLabel: validated.departmentLabel,
      roomLabel: validated.roomLabel,
      routingContext: { requestFormId: resolved.formId }
    }
  );

  const submittedAt = workOrder.submitted_at;
  const valuesSnapshot = {
    fields: (version.field_snapshot as FacilityRequestFieldSnapshot).fields,
    values: validated.values,
    lockedContext: resolved.portal.lockedContext,
    source,
    submittedAt
  };

  const { data: submission, error: submissionError } = await supabase
    .from("facility_request_submissions")
    .insert({
      organization_id: resolved.organizationId,
      form_id: resolved.formId,
      form_version_id: version.id,
      intake_id: resolved.intakeId,
      work_order_id: workOrder.id,
      source,
      requester_name: validated.requesterName,
      requester_email: validated.requesterEmail,
      requester_phone: validated.requesterPhone,
      requester_identified: true,
      status_token_hash: hashFacilityRequestToken(statusToken),
      values_snapshot: valuesSnapshot,
      idempotency_key: input.idempotencyKey
    })
    .select("id")
    .single();
  if (submissionError || !submission) throw new Error(submissionError?.message ?? "Failed to store submission.");

  const snapshotFields = (version.field_snapshot as FacilityRequestFieldSnapshot).fields;
  const valueRows = snapshotFields.map((field) => ({
    organization_id: resolved.organizationId,
    submission_id: submission.id,
    field_key: field.key,
    value_text: validated.values[field.key] == null ? null : String(validated.values[field.key]),
    value_json: {
      label: field.label,
      value: validated.values[field.key] ?? null
    }
  }));
  if (valueRows.length > 0) {
    const { error: valuesError } = await supabase.from("facility_request_submission_values").insert(valueRows);
    if (valuesError) throw new Error(valuesError.message);
  }

  if (input.attachments?.length) {
    const mediaIds = input.attachments.map((item) => item.mediaId).filter((id): id is string => Boolean(id));
    if (mediaIds.length > 0) {
      await supabase
        .from("media_attachments")
        .update({
          related_entity_type: "maintenance",
          related_entity_id: workOrder.id
        })
        .eq("organization_id", resolved.organizationId)
        .eq("related_entity_type", "facility_request_intake")
        .in("id", mediaIds);
    }
  }

  await writeMaintenanceAudit({
    supabase,
    organizationId: resolved.organizationId,
    actorId: input.actorUserId ?? null,
    action: "facility_request.public_submitted",
    entityType: "maintenance_work_orders",
    entityId: workOrder.id,
    payload: { requestNumber, source, formId: resolved.formId }
  });

  for (const userId of managers) {
    await notifyLifecycle(supabase as never, {
      organizationId: resolved.organizationId,
      userId,
      workOrderId: workOrder.id,
      key: "work_order.public_submitted",
      title: "New facility request",
      body: `${requestNumber}: ${validated.title}`,
      href: facilityOperationsWorkOrderHref(workOrder.id),
      emailCritical: true
    });
  }

  const location = [validated.propertyLabel, validated.floorLabel, validated.departmentLabel, validated.roomLabel]
    .filter(Boolean)
    .join(" · ");

  return {
    ok: true,
    requestNumber,
    title: validated.title,
    location: location || null,
    submittedAt,
    statusToken,
    statusPath: `/request/status/${statusToken}`,
    source,
    requesterEmail: validated.requesterEmail
  };
}

export async function loadPublicRequestStatus(supabase: Db, statusToken: string) {
  if (!looksLikeHighEntropyToken(statusToken)) {
    return { ok: false as const, error: "This tracking link is no longer available.", status: 404 };
  }
  const { data: submission } = await supabase
    .from("facility_request_submissions")
    .select("work_order_id, organization_id")
    .eq("status_token_hash", hashFacilityRequestToken(statusToken))
    .maybeSingle();
  if (!submission) {
    return { ok: false as const, error: "This tracking link is no longer available.", status: 404 };
  }
  const { data: workOrder } = await supabase
    .from("maintenance_work_orders")
    .select("request_number, title, category, status, submitted_at, floor_label, department_label, room_label, property_properties(name)")
    .eq("id", submission.work_order_id)
    .eq("organization_id", submission.organization_id)
    .maybeSingle();
  if (!workOrder?.request_number) {
    return { ok: false as const, error: "This tracking link is no longer available.", status: 404 };
  }
  const location = [
    workOrder.property_properties && (workOrder.property_properties as { name?: string }).name,
    workOrder.floor_label,
    workOrder.department_label,
    workOrder.room_label
  ]
    .filter(Boolean)
    .join(" · ");
  return {
    ok: true as const,
    view: publicTrackingView({
      requestNumber: workOrder.request_number,
      submittedAt: workOrder.submitted_at,
      title: workOrder.title,
      category: workOrder.category,
      locationLabel: location || null,
      status: workOrder.status as WorkOrderStatus
    })
  };
}

export async function sendRequesterConfirmationEmail(input: {
  to: string;
  requestNumber: string;
  title: string;
  statusUrl: string;
}) {
  return sendOperationalNoticeEmail({
    to: input.to,
    subject: `Request submitted · ${input.requestNumber}`,
    body: `Your facility request ${input.requestNumber} was received: ${input.title}. Use the secure link to view status.`,
    audienceLabel: "facility requester",
    ctaUrl: input.statusUrl,
    ctaLabel: "View Request Status",
    idempotencyKey: `facility-request:${input.requestNumber}:${input.to}`.slice(0, 256)
  });
}
