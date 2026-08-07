import { z } from "zod";
import { WORK_ORDER_CATEGORIES, WORK_ORDER_PRIORITIES } from "../maintenance/schemas";

export const WORK_ORDER_PRODUCT_CONTEXTS = ["property_manager", "facility"] as const;
export type WorkOrderProductContext = (typeof WORK_ORDER_PRODUCT_CONTEXTS)[number];

export const WORK_ORDER_KINDS = [
  "resident_request",
  "unit_turnover",
  "facility_corrective",
  "facility_preventive",
  "facility_inspection_corrective",
  "facility_safety_corrective",
  "other"
] as const;
export type WorkOrderKind = (typeof WORK_ORDER_KINDS)[number];

export const WORK_ORDER_SOURCES = [
  "portal_tenant",
  "pm_desk",
  "facility_ops",
  "facility_pm_generator",
  "facility_inspection",
  "facility_safety",
  "system"
] as const;
export type WorkOrderSource = (typeof WORK_ORDER_SOURCES)[number];

export const WORK_ORDER_PRODUCT_CONTEXT_LABELS: Record<WorkOrderProductContext, string> = {
  property_manager: "Property Manager",
  facility: "Facility Operations"
};

export const createFacilityWorkOrderInputSchema = z.object({
  siteId: z.string().uuid(),
  assetId: z.string().uuid().nullable().optional(),
  systemId: z.string().uuid().nullable().optional(),
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().min(3).max(4000),
  category: z.enum(WORK_ORDER_CATEGORIES).default("general"),
  priority: z.enum(WORK_ORDER_PRIORITIES).optional()
});
export type CreateFacilityWorkOrderInput = z.infer<typeof createFacilityWorkOrderInputSchema>;

export function defaultPriorityFromCriticality(
  criticality: string | null | undefined
): (typeof WORK_ORDER_PRIORITIES)[number] {
  switch (criticality) {
    case "critical":
      return "high";
    case "high":
      return "high";
    case "low":
      return "low";
    default:
      return "normal";
  }
}
