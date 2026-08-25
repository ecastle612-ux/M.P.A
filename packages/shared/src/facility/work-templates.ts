import { z } from "zod";
import { WORK_ORDER_CATEGORIES, WORK_ORDER_PRIORITIES } from "../maintenance/schemas";

export const WORK_TEMPLATE_ITEM_TYPES = [
  "checkbox",
  "text",
  "number",
  "yes_no",
  "photo"
] as const;
export type WorkTemplateItemType = (typeof WORK_TEMPLATE_ITEM_TYPES)[number];

export const WORK_TEMPLATE_STATUSES = ["draft", "active", "archived"] as const;
export type WorkTemplateStatus = (typeof WORK_TEMPLATE_STATUSES)[number];

export const workTemplateItemDefSchema = z.object({
  key: z.string().uuid().optional(),
  sortOrder: z.number().int().min(0),
  type: z.enum(WORK_TEMPLATE_ITEM_TYPES),
  label: z.string().trim().min(1).max(200),
  required: z.boolean().default(false)
});
export type WorkTemplateItemDef = z.infer<typeof workTemplateItemDefSchema>;

export const workTemplateSnapshotSchema = z.object({
  name: z.string().trim().min(1).max(160),
  defaultTitle: z.string().trim().min(3).max(160),
  category: z.enum(WORK_ORDER_CATEGORIES).default("general"),
  priority: z.enum(WORK_ORDER_PRIORITIES).default("normal"),
  expectedDurationMinutes: z.number().int().min(1).max(24 * 60).nullable().optional(),
  requireCompletionPhoto: z.boolean().default(false),
  items: z.array(workTemplateItemDefSchema).max(80)
});
export type WorkTemplateSnapshot = z.infer<typeof workTemplateSnapshotSchema>;

export const createWorkTemplateInputSchema = z.object({
  name: z.string().trim().min(1).max(160),
  defaultTitle: z.string().trim().min(3).max(160),
  category: z.enum(WORK_ORDER_CATEGORIES).default("general"),
  priority: z.enum(WORK_ORDER_PRIORITIES).default("normal"),
  expectedDurationMinutes: z.number().int().min(1).max(24 * 60).nullable().optional(),
  requireCompletionPhoto: z.boolean().default(false),
  items: z.array(workTemplateItemDefSchema).max(80).default([]),
  publish: z.boolean().default(false)
});
export type CreateWorkTemplateInput = z.infer<typeof createWorkTemplateInputSchema>;

export const updateWorkTemplateInputSchema = createWorkTemplateInputSchema.extend({
  templateId: z.string().uuid(),
  status: z.enum(WORK_TEMPLATE_STATUSES).optional()
});
export type UpdateWorkTemplateInput = z.infer<typeof updateWorkTemplateInputSchema>;

export const applyWorkTemplateInputSchema = z.object({
  workOrderId: z.string().uuid(),
  templateId: z.string().uuid()
});
export type ApplyWorkTemplateInput = z.infer<typeof applyWorkTemplateInputSchema>;

export const checklistItemResponseSchema = z.object({
  itemKey: z.string().min(1),
  valueBoolean: z.boolean().optional(),
  valueText: z.string().trim().max(4000).optional(),
  valueNumber: z.number().optional(),
  valueYesNo: z.boolean().optional(),
  mediaAttachmentId: z.string().uuid().nullable().optional()
});
export type ChecklistItemResponse = z.infer<typeof checklistItemResponseSchema>;

export const saveChecklistResponsesInputSchema = z.object({
  workOrderId: z.string().uuid(),
  responses: z.array(checklistItemResponseSchema).min(1).max(80)
});
export type SaveChecklistResponsesInput = z.infer<typeof saveChecklistResponsesInputSchema>;

export const WORK_ORDER_EXECUTION_SIGNALS = [
  "paused",
  "blocked",
  "need_parts",
  "escalated"
] as const;
export type WorkOrderExecutionSignal = (typeof WORK_ORDER_EXECUTION_SIGNALS)[number];

export function ensureItemKeys(items: WorkTemplateItemDef[]): WorkTemplateItemDef[] {
  return items.map((item, index) => ({
    ...item,
    key: item.key ?? cryptoRandomUuid(),
    sortOrder: item.sortOrder ?? index
  }));
}

function cryptoRandomUuid(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  // Deterministic-enough fallback for non-crypto test envs
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export type ChecklistCompletionGap = {
  itemKey: string;
  label: string;
  reason: string;
};

export function evaluateChecklistCompletion(args: {
  items: Array<{
    item_key: string;
    label: string;
    item_type: WorkTemplateItemType;
    required: boolean;
    value_boolean: boolean | null;
    value_text: string | null;
    value_number: number | null;
    value_yes_no: boolean | null;
    media_attachment_id: string | null;
  }>;
  requireCompletionPhoto: boolean;
  maintenanceMediaCount: number;
}): { ok: true } | { ok: false; missing: ChecklistCompletionGap[] } {
  const missing: ChecklistCompletionGap[] = [];

  for (const item of args.items) {
    if (!item.required) continue;
    switch (item.item_type) {
      case "checkbox":
        if (item.value_boolean !== true) {
          missing.push({ itemKey: item.item_key, label: item.label, reason: "Checkbox not completed" });
        }
        break;
      case "text":
        if (!item.value_text?.trim()) {
          missing.push({ itemKey: item.item_key, label: item.label, reason: "Text response required" });
        }
        break;
      case "number":
        if (item.value_number == null || Number.isNaN(Number(item.value_number))) {
          missing.push({ itemKey: item.item_key, label: item.label, reason: "Number/reading required" });
        }
        break;
      case "yes_no":
        if (item.value_yes_no == null) {
          missing.push({ itemKey: item.item_key, label: item.label, reason: "Yes/No required" });
        }
        break;
      case "photo":
        if (!item.media_attachment_id) {
          missing.push({ itemKey: item.item_key, label: item.label, reason: "Photo/evidence required" });
        }
        break;
      default:
        break;
    }
  }

  if (args.requireCompletionPhoto && args.maintenanceMediaCount < 1) {
    missing.push({
      itemKey: "__completion_photo__",
      label: "Completion photo",
      reason: "At least one work-order photo/evidence attachment is required"
    });
  }

  return missing.length === 0 ? { ok: true } : { ok: false, missing };
}
