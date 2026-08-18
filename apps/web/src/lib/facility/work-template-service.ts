import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createWorkTemplateInputSchema,
  ensureItemKeys,
  evaluateChecklistCompletion,
  updateWorkTemplateInputSchema,
  workTemplateSnapshotSchema,
  type CreateWorkTemplateInput,
  type SaveChecklistResponsesInput,
  type UpdateWorkTemplateInput,
  type WorkTemplateSnapshot
} from "@mpa/shared";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = SupabaseClient<any>;

export type WorkTemplateRow = {
  id: string;
  organization_id: string;
  name: string;
  status: "draft" | "active" | "archived";
  current_version_id: string | null;
  created_at: string;
  updated_at: string;
};

export type WorkTemplateVersionRow = {
  id: string;
  organization_id: string;
  template_id: string;
  version_number: number;
  snapshot: WorkTemplateSnapshot;
  published_at: string | null;
  created_at: string;
};

export type ChecklistItemRow = {
  id: string;
  organization_id: string;
  work_order_id: string;
  item_key: string;
  sort_order: number;
  item_type: "checkbox" | "text" | "number" | "yes_no" | "photo";
  label: string;
  required: boolean;
  value_boolean: boolean | null;
  value_text: string | null;
  value_number: number | null;
  value_yes_no: boolean | null;
  media_attachment_id: string | null;
  completed_at: string | null;
  updated_at: string;
};

function snapshotFromInput(input: CreateWorkTemplateInput | UpdateWorkTemplateInput): WorkTemplateSnapshot {
  const items = ensureItemKeys(input.items ?? []).map((item, index) => ({
    key: item.key!,
    sortOrder: item.sortOrder ?? index,
    type: item.type,
    label: item.label,
    required: item.required
  }));
  return workTemplateSnapshotSchema.parse({
    name: input.name,
    defaultTitle: input.defaultTitle,
    category: input.category,
    priority: input.priority,
    expectedDurationMinutes: input.expectedDurationMinutes ?? null,
    requireCompletionPhoto: input.requireCompletionPhoto,
    items
  });
}

export async function listWorkTemplates(supabase: Db, organizationId: string) {
  const { data, error } = await supabase
    .from("facility_work_templates")
    .select("*")
    .eq("organization_id", organizationId)
    .neq("status", "archived")
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as WorkTemplateRow[];
}

export async function getWorkTemplate(supabase: Db, organizationId: string, templateId: string) {
  const { data, error } = await supabase
    .from("facility_work_templates")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("id", templateId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as WorkTemplateRow | null) ?? null;
}

export async function getTemplateVersion(
  supabase: Db,
  organizationId: string,
  versionId: string
) {
  const { data, error } = await supabase
    .from("facility_work_template_versions")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("id", versionId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return {
    ...data,
    snapshot: workTemplateSnapshotSchema.parse(data.snapshot)
  } as WorkTemplateVersionRow;
}

export async function getCurrentTemplateVersion(
  supabase: Db,
  organizationId: string,
  templateId: string
) {
  const template = await getWorkTemplate(supabase, organizationId, templateId);
  if (!template?.current_version_id) return null;
  return getTemplateVersion(supabase, organizationId, template.current_version_id);
}

export async function createWorkTemplate(
  supabase: Db,
  organizationId: string,
  actorUserId: string,
  raw: CreateWorkTemplateInput
) {
  const input = createWorkTemplateInputSchema.parse(raw);
  const snapshot = snapshotFromInput(input);

  const { data: template, error } = await supabase
    .from("facility_work_templates")
    .insert({
      organization_id: organizationId,
      name: snapshot.name,
      status: input.publish ? "active" : "draft",
      created_by_user_id: actorUserId
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  const { data: version, error: versionError } = await supabase
    .from("facility_work_template_versions")
    .insert({
      organization_id: organizationId,
      template_id: template.id,
      version_number: 1,
      snapshot,
      published_at: input.publish ? new Date().toISOString() : null
    })
    .select("*")
    .single();
  if (versionError) throw new Error(versionError.message);

  const { data: updated, error: updateError } = await supabase
    .from("facility_work_templates")
    .update({
      current_version_id: version.id,
      updated_at: new Date().toISOString()
    })
    .eq("id", template.id)
    .eq("organization_id", organizationId)
    .select("*")
    .single();
  if (updateError) throw new Error(updateError.message);

  return {
    template: updated as WorkTemplateRow,
    version: {
      ...version,
      snapshot
    } as WorkTemplateVersionRow
  };
}

export async function updateWorkTemplate(
  supabase: Db,
  organizationId: string,
  raw: UpdateWorkTemplateInput
) {
  const input = updateWorkTemplateInputSchema.parse(raw);
  const existing = await getWorkTemplate(supabase, organizationId, input.templateId);
  if (!existing) throw new Error("Template not found");

  const snapshot = snapshotFromInput(input);
  const { data: latest } = await supabase
    .from("facility_work_template_versions")
    .select("version_number")
    .eq("template_id", existing.id)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextNumber = (latest?.version_number ?? 0) + 1;
  const publish = input.publish || existing.status === "active";

  const { data: version, error: versionError } = await supabase
    .from("facility_work_template_versions")
    .insert({
      organization_id: organizationId,
      template_id: existing.id,
      version_number: nextNumber,
      snapshot,
      published_at: publish ? new Date().toISOString() : null
    })
    .select("*")
    .single();
  if (versionError) throw new Error(versionError.message);

  const { data: updated, error } = await supabase
    .from("facility_work_templates")
    .update({
      name: snapshot.name,
      status: input.status ?? (publish ? "active" : existing.status),
      current_version_id: version.id,
      updated_at: new Date().toISOString()
    })
    .eq("id", existing.id)
    .eq("organization_id", organizationId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  return {
    template: updated as WorkTemplateRow,
    version: { ...version, snapshot } as WorkTemplateVersionRow
  };
}

export async function listChecklistItems(
  supabase: Db,
  organizationId: string,
  workOrderId: string
) {
  const { data, error } = await supabase
    .from("facility_work_order_checklist_items")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("work_order_id", workOrderId)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as ChecklistItemRow[];
}

export async function applyTemplateSnapshotToWorkOrder(
  supabase: Db,
  organizationId: string,
  workOrderId: string,
  version: WorkTemplateVersionRow
) {
  const snapshot = version.snapshot;
  const { error: clearError } = await supabase
    .from("facility_work_order_checklist_items")
    .delete()
    .eq("organization_id", organizationId)
    .eq("work_order_id", workOrderId);
  if (clearError) throw new Error(clearError.message);

  const rows = snapshot.items
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item) => ({
      organization_id: organizationId,
      work_order_id: workOrderId,
      item_key: item.key!,
      sort_order: item.sortOrder,
      item_type: item.type,
      label: item.label,
      required: item.required
    }));

  if (rows.length > 0) {
    const { error: insertError } = await supabase
      .from("facility_work_order_checklist_items")
      .insert(rows);
    if (insertError) throw new Error(insertError.message);
  }

  const { error: woError } = await supabase
    .from("maintenance_work_orders")
    .update({
      template_version_id: version.id,
      checklist_snapshot: snapshot,
      require_completion_photo: snapshot.requireCompletionPhoto,
      updated_at: new Date().toISOString()
    })
    .eq("id", workOrderId)
    .eq("organization_id", organizationId);
  if (woError) throw new Error(woError.message);
}

export async function applyTemplateToWorkOrder(
  supabase: Db,
  organizationId: string,
  workOrderId: string,
  templateId: string
) {
  const version = await getCurrentTemplateVersion(supabase, organizationId, templateId);
  if (!version) throw new Error("Template has no published version");
  const template = await getWorkTemplate(supabase, organizationId, templateId);
  if (!template || template.status === "archived") {
    throw new Error("Template is not available");
  }
  await applyTemplateSnapshotToWorkOrder(supabase, organizationId, workOrderId, version);
  return version;
}

export async function saveChecklistResponses(
  supabase: Db,
  organizationId: string,
  input: SaveChecklistResponsesInput
) {
  const existing = await listChecklistItems(supabase, organizationId, input.workOrderId);
  const byKey = new Map(existing.map((row) => [row.item_key, row]));
  const now = new Date().toISOString();

  for (const response of input.responses) {
    const row = byKey.get(response.itemKey);
    if (!row) throw new Error(`Unknown checklist item: ${response.itemKey}`);

    const patch: Record<string, unknown> = { updated_at: now };
    switch (row.item_type) {
      case "checkbox":
        patch['value_boolean'] = response.valueBoolean ?? false;
        patch['completed_at'] = response.valueBoolean ? now : null;
        break;
      case "text":
        patch['value_text'] = response.valueText ?? null;
        patch['completed_at'] = response.valueText?.trim() ? now : null;
        break;
      case "number":
        patch['value_number'] = response.valueNumber ?? null;
        patch['completed_at'] = response.valueNumber != null ? now : null;
        break;
      case "yes_no":
        patch['value_yes_no'] = response.valueYesNo ?? null;
        patch['completed_at'] = response.valueYesNo != null ? now : null;
        break;
      case "photo":
        patch['media_attachment_id'] = response.mediaAttachmentId ?? null;
        patch['completed_at'] = response.mediaAttachmentId ? now : null;
        break;
      default:
        break;
    }

    const { error } = await supabase
      .from("facility_work_order_checklist_items")
      .update(patch)
      .eq("id", row.id)
      .eq("organization_id", organizationId);
    if (error) throw new Error(error.message);
  }

  return listChecklistItems(supabase, organizationId, input.workOrderId);
}

export async function assertFacilityChecklistComplete(
  supabase: Db,
  organizationId: string,
  workOrderId: string
): Promise<
  | { ok: true }
  | { ok: false; message: string; missing: Array<{ itemKey: string; label: string; reason: string }> }
> {
  const { data: wo, error } = await supabase
    .from("maintenance_work_orders")
    .select("id, checklist_snapshot, require_completion_photo, template_version_id")
    .eq("organization_id", organizationId)
    .eq("id", workOrderId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!wo) return { ok: true };
  if (!wo.template_version_id && !wo.checklist_snapshot) return { ok: true };

  const items = await listChecklistItems(supabase, organizationId, workOrderId);
  const { count, error: mediaError } = await supabase
    .from("media_attachments")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("related_entity_type", "maintenance")
    .eq("related_entity_id", workOrderId)
    .is("deleted_at", null);
  if (mediaError) throw new Error(mediaError.message);

  const result = evaluateChecklistCompletion({
    items,
    requireCompletionPhoto: Boolean(wo.require_completion_photo),
    maintenanceMediaCount: count ?? 0
  });

  if (result.ok) return { ok: true };

  const details = result.missing.map((gap) => `${gap.label}: ${gap.reason}`).join("; ");
  return {
    ok: false,
    message: `Cannot complete work order. Required checklist/evidence missing — ${details}`,
    missing: result.missing
  };
}
