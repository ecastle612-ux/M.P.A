import { z } from "zod";
import { WORK_ORDER_CATEGORIES, WORK_ORDER_PRIORITIES } from "../maintenance/schemas";

export const SAFETY_INCIDENT_TYPES = ["incident", "near_miss"] as const;
export type SafetyIncidentType = (typeof SAFETY_INCIDENT_TYPES)[number];

export const SAFETY_SEVERITIES = ["low", "medium", "high", "critical"] as const;
export type SafetySeverity = (typeof SAFETY_SEVERITIES)[number];

export const SAFETY_INCIDENT_STATUSES = ["reported", "triaged", "actions_open", "closed"] as const;
export type SafetyIncidentStatus = (typeof SAFETY_INCIDENT_STATUSES)[number];

export const createSafetyIncidentInputSchema = z.object({
  siteId: z.string().uuid(),
  assetId: z.string().uuid().nullable().optional(),
  systemId: z.string().uuid().nullable().optional(),
  incidentType: z.enum(SAFETY_INCIDENT_TYPES).default("incident"),
  severity: z.enum(SAFETY_SEVERITIES).default("medium"),
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().min(3).max(4000)
});
export type CreateSafetyIncidentInput = z.infer<typeof createSafetyIncidentInputSchema>;

export const triageSafetyIncidentInputSchema = z.object({
  incidentId: z.string().uuid(),
  severity: z.enum(SAFETY_SEVERITIES),
  notes: z.string().trim().max(2000).nullable().optional()
});
export type TriageSafetyIncidentInput = z.infer<typeof triageSafetyIncidentInputSchema>;

export const spawnSafetyWorkOrderInputSchema = z.object({
  incidentId: z.string().uuid(),
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().min(3).max(4000),
  category: z.enum(WORK_ORDER_CATEGORIES).default("general"),
  priority: z.enum(WORK_ORDER_PRIORITIES).optional()
});
export type SpawnSafetyWorkOrderInput = z.infer<typeof spawnSafetyWorkOrderInputSchema>;

export const closeSafetyIncidentInputSchema = z.object({
  incidentId: z.string().uuid(),
  closedSummary: z.string().trim().min(3).max(4000),
  deferOpenWorkOrders: z.boolean().default(false)
});
export type CloseSafetyIncidentInput = z.infer<typeof closeSafetyIncidentInputSchema>;

export function isHighSafetySeverity(severity: SafetySeverity): boolean {
  return severity === "high" || severity === "critical";
}
