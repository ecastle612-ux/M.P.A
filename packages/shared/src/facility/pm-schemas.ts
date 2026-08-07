import { z } from "zod";
import { WORK_ORDER_CATEGORIES, WORK_ORDER_PRIORITIES } from "../maintenance/schemas";

export const PM_SCHEDULE_STATUSES = ["draft", "active", "paused", "retired"] as const;
export type PmScheduleStatus = (typeof PM_SCHEDULE_STATUSES)[number];

export const PM_SCHEDULE_STATUS_LABELS: Record<PmScheduleStatus, string> = {
  draft: "Draft",
  active: "Active",
  paused: "Paused",
  retired: "Retired"
};

export const PM_CADENCE_UNITS = ["day", "week", "month", "year"] as const;
export type PmCadenceUnit = (typeof PM_CADENCE_UNITS)[number];

export const PM_GENERATION_RUN_STATUSES = [
  "due",
  "work_created",
  "work_completed",
  "acknowledged"
] as const;
export type PmGenerationRunStatus = (typeof PM_GENERATION_RUN_STATUSES)[number];

export const PM_CRITICALITIES = ["critical", "high", "medium", "low"] as const;
export type PmCriticality = (typeof PM_CRITICALITIES)[number];

export const createPmScheduleInputSchema = z
  .object({
    siteId: z.string().uuid(),
    assetId: z.string().uuid().nullable().optional(),
    systemId: z.string().uuid().nullable().optional(),
    name: z.string().trim().min(2).max(160),
    titleTemplate: z.string().trim().min(3).max(160),
    descriptionTemplate: z.string().trim().max(4000).default(""),
    category: z.enum(WORK_ORDER_CATEGORIES).default("general"),
    priority: z.enum(WORK_ORDER_PRIORITIES).default("normal"),
    cadenceUnit: z.enum(PM_CADENCE_UNITS).default("month"),
    cadenceInterval: z.number().int().min(1).max(365).default(1),
    isOneShot: z.boolean().default(false),
    nextDueOn: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    criticality: z.enum(PM_CRITICALITIES).default("medium"),
    activateNow: z.boolean().default(false)
  })
  .refine((value) => Boolean(value.assetId || value.systemId), {
    message: "Assign an asset and/or building system",
    path: ["assetId"]
  });
export type CreatePmScheduleInput = z.infer<typeof createPmScheduleInputSchema>;

export const transitionPmScheduleInputSchema = z.object({
  scheduleId: z.string().uuid(),
  action: z.enum(["activate", "pause", "resume", "retire"])
});
export type TransitionPmScheduleInput = z.infer<typeof transitionPmScheduleInputSchema>;

export const generatePmWorkInputSchema = z.object({
  asOf: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
});
export type GeneratePmWorkInput = z.infer<typeof generatePmWorkInputSchema>;

/** Advance a calendar date by cadence (UTC date arithmetic). */
export function advancePmDueDate(
  dueOn: string,
  cadenceUnit: PmCadenceUnit,
  cadenceInterval: number
): string {
  const [year, month, day] = dueOn.split("-").map(Number);
  const date = new Date(Date.UTC(year!, month! - 1, day!));
  switch (cadenceUnit) {
    case "day":
      date.setUTCDate(date.getUTCDate() + cadenceInterval);
      break;
    case "week":
      date.setUTCDate(date.getUTCDate() + cadenceInterval * 7);
      break;
    case "month":
      date.setUTCMonth(date.getUTCMonth() + cadenceInterval);
      break;
    case "year":
      date.setUTCFullYear(date.getUTCFullYear() + cadenceInterval);
      break;
  }
  return date.toISOString().slice(0, 10);
}

export function todayUtcDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function daysBetweenUtcDates(from: string, to: string): number {
  const a = Date.parse(`${from}T00:00:00.000Z`);
  const b = Date.parse(`${to}T00:00:00.000Z`);
  return Math.floor((b - a) / 86_400_000);
}
