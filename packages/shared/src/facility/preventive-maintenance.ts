import { z } from "zod";
import { WORK_ORDER_CATEGORIES, WORK_ORDER_PRIORITIES } from "../maintenance/schemas";
import { FACILITY_MANAGER_ROLES } from "./schemas";
import type { UserRole } from "../types/roles";

export const FACILITY_PREVENTIVE_ENTITLEMENT = "facility.preventive" as const;

export const PM_PLAN_STATUSES = ["active", "paused", "inactive"] as const;
export type PmPlanStatus = (typeof PM_PLAN_STATUSES)[number];

export const PM_TARGET_KINDS = ["asset", "location"] as const;
export type PmTargetKind = (typeof PM_TARGET_KINDS)[number];

export const PM_RECURRENCE_KINDS = [
  "weekly",
  "every_n_weeks",
  "monthly",
  "every_n_months",
  "quarterly",
  "semiannual",
  "annual"
] as const;
export type PmRecurrenceKind = (typeof PM_RECURRENCE_KINDS)[number];

export const PM_ORIGIN_SOURCES = ["manual", "preventive", "public_request"] as const;
export type PmOriginSource = (typeof PM_ORIGIN_SOURCES)[number];

export const PM_DEFAULT_GENERATE_DAYS_BEFORE = 7;
export const PM_MAX_GENERATE_DAYS_BEFORE = 90;
export const PM_MAX_GENERATIONS_PER_PLAN_PER_RUN = 1;

export const PM_DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
export const PM_TIME_HHMM = /^\d{2}:\d{2}$/;

export function memberCanAdministerPreventiveMaintenance(roles: readonly string[]): boolean {
  return roles.some((role) => (FACILITY_MANAGER_ROLES as readonly string[]).includes(role as UserRole));
}

export function recurrenceLabel(kind: PmRecurrenceKind, intervalN = 1): string {
  switch (kind) {
    case "weekly":
      return "Every week";
    case "every_n_weeks":
      return intervalN <= 1 ? "Every week" : `Every ${intervalN} weeks`;
    case "monthly":
      return "Every month";
    case "every_n_months":
      return intervalN <= 1 ? "Every month" : `Every ${intervalN} months`;
    case "quarterly":
      return "Every 3 months";
    case "semiannual":
      return "Every 6 months";
    case "annual":
      return "Every year";
    default:
      return "Recurring";
  }
}

export function parseDateOnly(value: string): Date {
  if (!PM_DATE_ONLY.test(value)) {
    throw new Error("Invalid date");
  }
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

export function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function utcToday(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function lastDayOfUtcMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

export function addUtcDays(dateOnly: string, days: number): string {
  const date = parseDateOnly(dateOnly);
  date.setUTCDate(date.getUTCDate() + days);
  return formatDateOnly(date);
}

export function compareDateOnly(left: string, right: string): number {
  if (left === right) return 0;
  return left < right ? -1 : 1;
}

/** Keep the original day-of-month so Jan 31 monthly stays end-of-month, not Feb 28 forever. */
export function addCalendarMonthsAnchored(fromDateOnly: string, months: number, anchorDay: number): string {
  const from = parseDateOnly(fromDateOnly);
  const year = from.getUTCFullYear();
  const month = from.getUTCMonth() + months;
  const target = new Date(Date.UTC(year, month, 1, 12, 0, 0));
  const last = lastDayOfUtcMonth(target.getUTCFullYear(), target.getUTCMonth());
  const day = Math.min(Math.max(anchorDay, 1), last);
  return formatDateOnly(new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), day, 12, 0, 0)));
}

export function addCalendarWeeks(fromDateOnly: string, weeks: number): string {
  return addUtcDays(fromDateOnly, weeks * 7);
}

export function recurrenceStep(kind: PmRecurrenceKind, intervalN = 1): { unit: "weeks" | "months"; count: number } {
  const n = Number.isInteger(intervalN) && intervalN > 0 ? intervalN : 1;
  switch (kind) {
    case "weekly":
      return { unit: "weeks", count: 1 };
    case "every_n_weeks":
      return { unit: "weeks", count: n };
    case "monthly":
      return { unit: "months", count: 1 };
    case "every_n_months":
      return { unit: "months", count: n };
    case "quarterly":
      return { unit: "months", count: 3 };
    case "semiannual":
      return { unit: "months", count: 6 };
    case "annual":
      return { unit: "months", count: 12 };
    default:
      return { unit: "months", count: 1 };
  }
}

export function nextOccurrenceDueOn(input: {
  fromDueOn: string;
  kind: PmRecurrenceKind;
  intervalN?: number;
  anchorDayOfMonth?: number;
}): string {
  const step = recurrenceStep(input.kind, input.intervalN ?? 1);
  if (step.unit === "weeks") {
    return addCalendarWeeks(input.fromDueOn, step.count);
  }
  const from = parseDateOnly(input.fromDueOn);
  const anchor = input.anchorDayOfMonth ?? from.getUTCDate();
  return addCalendarMonthsAnchored(input.fromDueOn, step.count, anchor);
}

export function advanceUntilOnOrAfter(input: {
  fromDueOn: string;
  kind: PmRecurrenceKind;
  intervalN?: number;
  anchorDayOfMonth?: number;
  onOrAfter: string;
}): { nextDueOn: string; skipped: number } {
  let cursor = input.fromDueOn;
  let skipped = 0;
  let guard = 0;
  while (compareDateOnly(cursor, input.onOrAfter) < 0 && guard < 600) {
    cursor = nextOccurrenceDueOn({
      fromDueOn: cursor,
      kind: input.kind,
      intervalN: input.intervalN,
      anchorDayOfMonth: input.anchorDayOfMonth
    });
    skipped += 1;
    guard += 1;
  }
  return { nextDueOn: cursor, skipped };
}

export function shouldGenerateOccurrence(input: {
  nextDueOn: string;
  generateDaysBefore: number;
  today: string;
}): boolean {
  const lead = Math.min(Math.max(input.generateDaysBefore, 0), PM_MAX_GENERATE_DAYS_BEFORE);
  const windowStart = addUtcDays(input.nextDueOn, -lead);
  return compareDateOnly(windowStart, input.today) <= 0;
}

export function isPlanOverdue(nextDueOn: string, today: string): boolean {
  return compareDateOnly(nextDueOn, today) < 0;
}

export function isPlanDueSoon(nextDueOn: string, today: string, withinDays = 7): boolean {
  if (compareDateOnly(nextDueOn, today) < 0) return false;
  return compareDateOnly(nextDueOn, addUtcDays(today, withinDays)) <= 0;
}

export function dueAtTimestamp(dueOn: string, dueTime?: string | null): string {
  const time = dueTime && PM_TIME_HHMM.test(dueTime) ? dueTime : "12:00";
  const [hours, minutes] = time.split(":").map(Number);
  const date = parseDateOnly(dueOn);
  date.setUTCHours(hours, minutes, 0, 0);
  return date.toISOString();
}

export function workOrderOriginSource(input: {
  originSource?: string | null;
  intakeChannel?: string | null;
}): PmOriginSource {
  if (input.originSource === "preventive") return "preventive";
  if (input.originSource === "public_request") return "public_request";
  if (input.originSource === "manual") return "manual";
  if (input.intakeChannel && input.intakeChannel !== "internal") return "public_request";
  return "manual";
}

export function workOrderOriginLabel(input: {
  originSource?: string | null;
  intakeChannel?: string | null;
}): string {
  const source = workOrderOriginSource(input);
  if (source === "preventive") return "Preventive Maintenance";
  if (source === "public_request") {
    if (input.intakeChannel === "qr") return "QR / Share Link";
    if (input.intakeChannel === "authenticated") return "QR / Share Link";
    return "QR / Share Link";
  }
  return "Manual";
}

export function staffPmPlanHref(planId: string): string {
  return `/facility/preventive-maintenance?planId=${encodeURIComponent(planId)}`;
}

export function contextualPmPlanHref(input: {
  facilityAssetId?: string;
  propertyId?: string;
}): string {
  const params = new URLSearchParams({ new: "1" });
  if (input.facilityAssetId) params.set("facilityAssetId", input.facilityAssetId);
  if (input.propertyId) params.set("propertyId", input.propertyId);
  return `/facility/preventive-maintenance?${params.toString()}`;
}

const intervalSchema = z.number().int().min(1).max(52).optional();

export const createPmPlanInputSchema = z
  .object({
    name: z.string().trim().min(3).max(160),
    description: z.string().trim().max(4000).optional().default(""),
    targetKind: z.enum(PM_TARGET_KINDS),
    facilityAssetId: z.string().uuid().optional(),
    propertyId: z.string().uuid().optional(),
    floorLabel: z.string().trim().max(80).optional(),
    departmentLabel: z.string().trim().max(80).optional(),
    roomLabel: z.string().trim().max(80).optional(),
    priority: z.enum(WORK_ORDER_PRIORITIES).default("normal"),
    category: z.enum(WORK_ORDER_CATEGORIES).default("preventive"),
    recurrenceKind: z.enum(PM_RECURRENCE_KINDS),
    intervalN: intervalSchema,
    nextDueOn: z.string().regex(PM_DATE_ONLY),
    dueTime: z.string().regex(PM_TIME_HHMM).optional().nullable(),
    generateDaysBefore: z
      .number()
      .int()
      .min(0)
      .max(PM_MAX_GENERATE_DAYS_BEFORE)
      .default(PM_DEFAULT_GENERATE_DAYS_BEFORE),
    templateId: z.string().uuid().optional().nullable()
  })
  .superRefine((value, ctx) => {
    if (value.targetKind === "asset" && !value.facilityAssetId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Choose an asset", path: ["facilityAssetId"] });
    }
    if (value.targetKind === "location" && !value.propertyId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Choose a building", path: ["propertyId"] });
    }
    if (
      (value.recurrenceKind === "every_n_weeks" || value.recurrenceKind === "every_n_months") &&
      (!value.intervalN || value.intervalN < 1)
    ) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Enter how often this repeats", path: ["intervalN"] });
    }
  });
export type CreatePmPlanInput = z.infer<typeof createPmPlanInputSchema>;

export const updatePmPlanInputSchema = z.object({
  name: z.string().trim().min(3).max(160).optional(),
  description: z.string().trim().max(4000).optional(),
  priority: z.enum(WORK_ORDER_PRIORITIES).optional(),
  category: z.enum(WORK_ORDER_CATEGORIES).optional(),
  recurrenceKind: z.enum(PM_RECURRENCE_KINDS).optional(),
  intervalN: intervalSchema,
  nextDueOn: z.string().regex(PM_DATE_ONLY).optional(),
  dueTime: z.string().regex(PM_TIME_HHMM).optional().nullable(),
  generateDaysBefore: z.number().int().min(0).max(PM_MAX_GENERATE_DAYS_BEFORE).optional(),
  templateId: z.string().uuid().optional().nullable(),
  floorLabel: z.string().trim().max(80).optional().nullable(),
  departmentLabel: z.string().trim().max(80).optional().nullable(),
  roomLabel: z.string().trim().max(80).optional().nullable(),
  action: z.enum(["pause", "resume", "deactivate"]).optional()
});
export type UpdatePmPlanInput = z.infer<typeof updatePmPlanInputSchema>;

export const generatePmInputSchema = z.object({
  organizationId: z.string().uuid().optional(),
  planId: z.string().uuid().optional(),
  now: z.string().datetime().optional()
});
export type GeneratePmInput = z.infer<typeof generatePmInputSchema>;
