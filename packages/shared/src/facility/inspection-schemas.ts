import { z } from "zod";

export const INSPECTION_PROGRAM_STATUSES = ["draft", "active", "paused", "retired"] as const;
export type InspectionProgramStatus = (typeof INSPECTION_PROGRAM_STATUSES)[number];

export const INSPECTION_SCOPE_TYPES = ["site", "asset", "system"] as const;
export type InspectionScopeType = (typeof INSPECTION_SCOPE_TYPES)[number];

export const INSPECTION_CADENCE_UNITS = ["day", "week", "month", "year", "one_shot"] as const;
export type InspectionCadenceUnit = (typeof INSPECTION_CADENCE_UNITS)[number];

export const INSPECTION_RUN_STATUSES = [
  "scheduled",
  "in_progress",
  "completed_pass",
  "completed_fail",
  "cancelled"
] as const;
export type InspectionRunStatus = (typeof INSPECTION_RUN_STATUSES)[number];

export const INSPECTION_ITEM_OUTCOMES = ["pass", "fail", "needs_attention", "not_checked"] as const;
export type InspectionItemOutcome = (typeof INSPECTION_ITEM_OUTCOMES)[number];

export const inspectionChecklistItemSchema = z.object({
  key: z.string().trim().min(1).max(80),
  label: z.string().trim().min(2).max(240),
  required: z.boolean().default(true)
});
export type InspectionChecklistItem = z.infer<typeof inspectionChecklistItemSchema>;

export const inspectionResultItemSchema = z.object({
  key: z.string().trim().min(1).max(80),
  label: z.string().trim().min(1).max(240),
  outcome: z.enum(INSPECTION_ITEM_OUTCOMES),
  notes: z.string().trim().max(2000).nullable().optional(),
  spawnWorkOrder: z.boolean().default(false)
});
export type InspectionResultItem = z.infer<typeof inspectionResultItemSchema>;

export const createInspectionProgramInputSchema = z
  .object({
    siteId: z.string().uuid(),
    assetId: z.string().uuid().nullable().optional(),
    systemId: z.string().uuid().nullable().optional(),
    name: z.string().trim().min(2).max(160),
    scopeType: z.enum(INSPECTION_SCOPE_TYPES).default("site"),
    cadenceUnit: z.enum(INSPECTION_CADENCE_UNITS).default("month"),
    cadenceInterval: z.number().int().min(1).default(1),
    nextDueOn: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .nullable()
      .optional(),
    checklistTemplate: z.array(inspectionChecklistItemSchema).min(1),
    notes: z.string().trim().max(4000).nullable().optional(),
    activate: z.boolean().default(true)
  })
  .superRefine((value, ctx) => {
    if (value.scopeType === "asset" && !value.assetId) {
      ctx.addIssue({ code: "custom", message: "Asset inspections require an asset", path: ["assetId"] });
    }
    if (value.scopeType === "system" && !value.systemId) {
      ctx.addIssue({
        code: "custom",
        message: "Building system inspections require a system",
        path: ["systemId"]
      });
    }
  });
export type CreateInspectionProgramInput = z.infer<typeof createInspectionProgramInputSchema>;

export const startInspectionRunInputSchema = z.object({
  programId: z.string().uuid(),
  dueOn: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional()
});
export type StartInspectionRunInput = z.infer<typeof startInspectionRunInputSchema>;

export const completeInspectionRunInputSchema = z.object({
  runId: z.string().uuid(),
  results: z.array(inspectionResultItemSchema).min(1),
  completionNotes: z.string().trim().max(4000).nullable().optional()
});
export type CompleteInspectionRunInput = z.infer<typeof completeInspectionRunInputSchema>;

export const cancelInspectionRunInputSchema = z.object({
  runId: z.string().uuid(),
  reason: z.string().trim().min(3).max(1000)
});
export type CancelInspectionRunInput = z.infer<typeof cancelInspectionRunInputSchema>;

export function deriveInspectionRunOutcome(
  results: readonly InspectionResultItem[]
): "completed_pass" | "completed_fail" {
  return results.some((item) => item.outcome === "fail") ? "completed_fail" : "completed_pass";
}
