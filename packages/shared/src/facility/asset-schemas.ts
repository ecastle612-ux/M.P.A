import { z } from "zod";

export const FACILITY_CRITICALITIES = ["critical", "high", "medium", "low"] as const;
export type FacilityCriticality = (typeof FACILITY_CRITICALITIES)[number];

export const FACILITY_ASSET_STATUSES = ["intake", "active", "in_repair", "decommissioned"] as const;
export type FacilityAssetStatus = (typeof FACILITY_ASSET_STATUSES)[number];

export const FACILITY_SYSTEM_TYPES = [
  "hvac",
  "fire",
  "electrical",
  "plumbing",
  "vertical_transport",
  "other"
] as const;
export type FacilitySystemType = (typeof FACILITY_SYSTEM_TYPES)[number];

export const FACILITY_SYSTEM_STATUSES = ["active", "degraded", "down", "decommissioned"] as const;
export type FacilitySystemStatus = (typeof FACILITY_SYSTEM_STATUSES)[number];

export const createFacilityAssetCategoryInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  criticalityDefault: z.enum(FACILITY_CRITICALITIES).default("medium")
});

export type CreateFacilityAssetCategoryInput = z.infer<typeof createFacilityAssetCategoryInputSchema>;

export const createFacilityAssetInputSchema = z.object({
  siteId: z.string().uuid(),
  locationId: z.string().uuid().optional().nullable(),
  parentAssetId: z.string().uuid().optional().nullable(),
  categoryId: z.string().uuid().optional().nullable(),
  name: z.string().trim().min(2).max(160),
  assetTag: z.string().trim().max(80).optional().nullable(),
  manufacturer: z.string().trim().max(120).optional().nullable(),
  model: z.string().trim().max(120).optional().nullable(),
  serialNumber: z.string().trim().max(120).optional().nullable(),
  criticality: z.enum(FACILITY_CRITICALITIES).default("medium"),
  status: z.enum(["intake", "active"]).default("intake"),
  installedOn: z.string().date().optional().nullable(),
  warrantyUntil: z.string().date().optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
  systemIds: z.array(z.string().uuid()).max(40).optional().default([])
});

export type CreateFacilityAssetInput = z.infer<typeof createFacilityAssetInputSchema>;

export const updateFacilityAssetInputSchema = z.object({
  locationId: z.string().uuid().optional().nullable(),
  parentAssetId: z.string().uuid().optional().nullable(),
  categoryId: z.string().uuid().optional().nullable(),
  name: z.string().trim().min(2).max(160).optional(),
  assetTag: z.string().trim().max(80).optional().nullable(),
  manufacturer: z.string().trim().max(120).optional().nullable(),
  model: z.string().trim().max(120).optional().nullable(),
  serialNumber: z.string().trim().max(120).optional().nullable(),
  criticality: z.enum(FACILITY_CRITICALITIES).optional(),
  installedOn: z.string().date().optional().nullable(),
  warrantyUntil: z.string().date().optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
  systemIds: z.array(z.string().uuid()).max(40).optional()
});

export type UpdateFacilityAssetInput = z.infer<typeof updateFacilityAssetInputSchema>;

export const facilityAssetLifecycleInputSchema = z.object({
  status: z.enum(FACILITY_ASSET_STATUSES)
});

export type FacilityAssetLifecycleInput = z.infer<typeof facilityAssetLifecycleInputSchema>;

export const createFacilitySystemInputSchema = z.object({
  siteId: z.string().uuid(),
  name: z.string().trim().min(2).max(160),
  systemType: z.enum(FACILITY_SYSTEM_TYPES).default("other"),
  status: z.enum(["active", "degraded", "down"]).default("active"),
  criticality: z.enum(FACILITY_CRITICALITIES).default("medium"),
  notes: z.string().trim().max(2000).optional().nullable(),
  assetIds: z.array(z.string().uuid()).max(80).optional().default([])
});

export type CreateFacilitySystemInput = z.infer<typeof createFacilitySystemInputSchema>;

export const updateFacilitySystemInputSchema = z.object({
  name: z.string().trim().min(2).max(160).optional(),
  systemType: z.enum(FACILITY_SYSTEM_TYPES).optional(),
  status: z.enum(FACILITY_SYSTEM_STATUSES).optional(),
  criticality: z.enum(FACILITY_CRITICALITIES).optional(),
  notes: z.string().trim().max(2000).optional().nullable(),
  assetIds: z.array(z.string().uuid()).max(80).optional()
});

export type UpdateFacilitySystemInput = z.infer<typeof updateFacilitySystemInputSchema>;

/** Allowed asset lifecycle transitions (WF-02). */
export function canTransitionFacilityAssetStatus(
  from: FacilityAssetStatus,
  to: FacilityAssetStatus
): boolean {
  if (from === to) {
    return true;
  }
  if (from === "decommissioned") {
    return false;
  }
  const allowed: Record<FacilityAssetStatus, FacilityAssetStatus[]> = {
    intake: ["active", "decommissioned"],
    active: ["in_repair", "decommissioned"],
    in_repair: ["active", "decommissioned"],
    decommissioned: []
  };
  return allowed[from].includes(to);
}
