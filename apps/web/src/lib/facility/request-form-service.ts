import type { SupabaseClient } from "@supabase/supabase-js";
import {
  FACILITY_REQUEST_CONTEXT_KINDS,
  isFacilityRequestAccessPolicy,
  isFacilityRequestContextKind,
  validatePublishedFieldSnapshot,
  type FacilityRequestAccessPolicy,
  type FacilityRequestContextKind,
  type FacilityRequestFieldSnapshot,
  type FacilityRequestFormStatus,
  type FacilityRequestLockedContext
} from "@mpa/shared";
import { generateFacilityRequestToken, hashFacilityRequestToken, publicTokenPrefix } from "./request-token";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = SupabaseClient<any>;

export type RequestFormRow = {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  instructions: string | null;
  status: FacilityRequestFormStatus;
  access_policy: FacilityRequestAccessPolicy;
  applicability: "all_buildings" | "one_building";
  property_id: string | null;
  current_version_id: string | null;
};

export async function listRequestForms(supabase: Db, organizationId: string) {
  const { data, error } = await supabase
    .from("facility_request_forms")
    .select("id, organization_id, name, description, instructions, status, access_policy, applicability, property_id, current_version_id, updated_at")
    .eq("organization_id", organizationId)
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createRequestForm(
  supabase: Db,
  organizationId: string,
  actorUserId: string,
  input: {
    name: string;
    description?: string;
    instructions?: string;
    accessPolicy?: FacilityRequestAccessPolicy;
    applicability?: "all_buildings" | "one_building";
    propertyId?: string | null;
    fields: FacilityRequestFieldSnapshot["fields"];
  }
) {
  const name = input.name.trim();
  if (name.length < 2) throw new Error("Name is required.");
  const accessPolicy = input.accessPolicy ?? "contact_required";
  if (!isFacilityRequestAccessPolicy(accessPolicy)) throw new Error("Access policy is invalid.");

  const { data: form, error } = await supabase
    .from("facility_request_forms")
    .insert({
      organization_id: organizationId,
      name,
      description: input.description?.trim() || null,
      instructions: input.instructions?.trim() || null,
      status: "draft",
      access_policy: accessPolicy,
      applicability: input.applicability ?? "all_buildings",
      property_id: input.propertyId ?? null,
      created_by_user_id: actorUserId
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  const { data: version, error: versionError } = await supabase
    .from("facility_request_form_versions")
    .insert({
      organization_id: organizationId,
      form_id: form.id,
      version_number: 1,
      field_snapshot: { fields: input.fields },
      published_at: null
    })
    .select("*")
    .single();
  if (versionError) throw new Error(versionError.message);

  const { data: updated, error: updateError } = await supabase
    .from("facility_request_forms")
    .update({ current_version_id: version.id, updated_at: new Date().toISOString() })
    .eq("id", form.id)
    .eq("organization_id", organizationId)
    .select("*")
    .single();
  if (updateError) throw new Error(updateError.message);
  return { form: updated, version };
}

export async function saveRequestFormDraft(
  supabase: Db,
  organizationId: string,
  formId: string,
  input: {
    name?: string;
    description?: string | null;
    instructions?: string | null;
    accessPolicy?: FacilityRequestAccessPolicy;
    applicability?: "all_buildings" | "one_building";
    propertyId?: string | null;
    fields?: FacilityRequestFieldSnapshot["fields"];
    status?: "draft" | "inactive";
  }
) {
  const { data: form, error } = await supabase
    .from("facility_request_forms")
    .select("*")
    .eq("id", formId)
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!form) throw new Error("Request form not found.");

  if (input.fields && form.current_version_id) {
    const { data: current } = await supabase
      .from("facility_request_form_versions")
      .select("id, published_at, version_number")
      .eq("id", form.current_version_id)
      .maybeSingle();
    if (current?.published_at) {
      const { data: draft, error: draftError } = await supabase
        .from("facility_request_form_versions")
        .insert({
          organization_id: organizationId,
          form_id: formId,
          version_number: current.version_number + 1,
          field_snapshot: { fields: input.fields },
          published_at: null
        })
        .select("id")
        .single();
      if (draftError) throw new Error(draftError.message);
      await supabase
        .from("facility_request_forms")
        .update({
          current_version_id: draft.id,
          name: input.name?.trim() || form.name,
          description: input.description ?? form.description,
          instructions: input.instructions ?? form.instructions,
          access_policy: input.accessPolicy ?? form.access_policy,
          applicability: input.applicability ?? form.applicability,
          property_id: input.propertyId === undefined ? form.property_id : input.propertyId,
          status: input.status ?? form.status,
          updated_at: new Date().toISOString()
        })
        .eq("id", formId)
        .eq("organization_id", organizationId);
    } else if (current) {
      const { error: snapError } = await supabase
        .from("facility_request_form_versions")
        .update({ field_snapshot: { fields: input.fields } })
        .eq("id", current.id);
      if (snapError) throw new Error(snapError.message);
    }
  }

  const { data: updated, error: updateError } = await supabase
    .from("facility_request_forms")
    .update({
      name: input.name?.trim() || form.name,
      description: input.description === undefined ? form.description : input.description,
      instructions: input.instructions === undefined ? form.instructions : input.instructions,
      access_policy: input.accessPolicy ?? form.access_policy,
      applicability: input.applicability ?? form.applicability,
      property_id: input.propertyId === undefined ? form.property_id : input.propertyId,
      status: input.status ?? form.status,
      updated_at: new Date().toISOString()
    })
    .eq("id", formId)
    .eq("organization_id", organizationId)
    .select("*")
    .single();
  if (updateError) throw new Error(updateError.message);
  return updated;
}

export async function publishRequestForm(supabase: Db, organizationId: string, formId: string) {
  const { data: form, error } = await supabase
    .from("facility_request_forms")
    .select("*")
    .eq("id", formId)
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!form?.current_version_id) throw new Error("Request form not found.");

  const { data: version, error: versionError } = await supabase
    .from("facility_request_form_versions")
    .select("*")
    .eq("id", form.current_version_id)
    .maybeSingle();
  if (versionError) throw new Error(versionError.message);
  if (!version) throw new Error("Form version not found.");

  const validated = validatePublishedFieldSnapshot(version.field_snapshot as FacilityRequestFieldSnapshot);
  if (!validated.ok) throw new Error(validated.error);

  const now = new Date().toISOString();
  if (!version.published_at) {
    const { error: publishError } = await supabase
      .from("facility_request_form_versions")
      .update({ published_at: now, field_snapshot: { fields: validated.fields } })
      .eq("id", version.id);
    if (publishError) throw new Error(publishError.message);
  }

  const { data: updated, error: updateError } = await supabase
    .from("facility_request_forms")
    .update({ status: "active", updated_at: now })
    .eq("id", formId)
    .eq("organization_id", organizationId)
    .select("*")
    .single();
  if (updateError) throw new Error(updateError.message);
  return updated;
}

export async function deactivateRequestForm(supabase: Db, organizationId: string, formId: string) {
  const { data, error } = await supabase
    .from("facility_request_forms")
    .update({ status: "inactive", updated_at: new Date().toISOString() })
    .eq("id", formId)
    .eq("organization_id", organizationId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export function lockedContextFromIntake(context: Record<string, unknown>): FacilityRequestLockedContext {
  const locked: FacilityRequestLockedContext = {};
  if (typeof context["propertyId"] === "string") locked.propertyId = context["propertyId"];
  if (typeof context["propertyLabel"] === "string") locked.propertyLabel = context["propertyLabel"];
  if (typeof context["facilityAssetId"] === "string") locked.facilityAssetId = context["facilityAssetId"];
  if (typeof context["facilityAssetLabel"] === "string") locked.facilityAssetLabel = context["facilityAssetLabel"];
  if (typeof context["floorLabel"] === "string") locked.floorLabel = context["floorLabel"];
  if (typeof context["departmentLabel"] === "string") locked.departmentLabel = context["departmentLabel"];
  if (typeof context["roomLabel"] === "string") locked.roomLabel = context["roomLabel"];
  return locked;
}

export async function createRequestIntake(
  supabase: Db,
  organizationId: string,
  actorUserId: string,
  input: {
    formId: string;
    contextKind: FacilityRequestContextKind;
    context: FacilityRequestLockedContext;
  }
) {
  if (!isFacilityRequestContextKind(input.contextKind) || !FACILITY_REQUEST_CONTEXT_KINDS.includes(input.contextKind)) {
    throw new Error("Context is invalid.");
  }
  const { data: form, error } = await supabase
    .from("facility_request_forms")
    .select("id, status")
    .eq("id", input.formId)
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!form || form.status !== "active") throw new Error("Only active forms can generate a link or QR.");

  const token = generateFacilityRequestToken();
  const { data, error: insertError } = await supabase
    .from("facility_request_intakes")
    .insert({
      organization_id: organizationId,
      form_id: input.formId,
      public_token_hash: hashFacilityRequestToken(token),
      public_token_prefix: publicTokenPrefix(token),
      context_kind: input.contextKind,
      context_json: input.context,
      status: "active",
      created_by_user_id: actorUserId
    })
    .select("*")
    .single();
  if (insertError) throw new Error(insertError.message);
  return { intake: data, token };
}

export async function revokeRequestIntake(supabase: Db, organizationId: string, intakeId: string) {
  const { data, error } = await supabase
    .from("facility_request_intakes")
    .update({ status: "revoked", revoked_at: new Date().toISOString() })
    .eq("id", intakeId)
    .eq("organization_id", organizationId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function listRequestIntakes(supabase: Db, organizationId: string, formId: string) {
  const { data, error } = await supabase
    .from("facility_request_intakes")
    .select("id, form_id, public_token_prefix, context_kind, context_json, status, created_at, revoked_at")
    .eq("organization_id", organizationId)
    .eq("form_id", formId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function loadFormVersion(supabase: Db, organizationId: string, formId: string) {
  const { data: form, error } = await supabase
    .from("facility_request_forms")
    .select("*")
    .eq("id", formId)
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!form) return null;
  const { data: version } = form.current_version_id
    ? await supabase.from("facility_request_form_versions").select("*").eq("id", form.current_version_id).maybeSingle()
    : { data: null };
  return { form, version };
}
