import { z } from "zod";

export const FACILITY_SITE_STATUSES = ["draft", "active", "archived"] as const;
export type FacilitySiteStatus = (typeof FACILITY_SITE_STATUSES)[number];

export const FACILITY_LOCATION_TYPES = [
  "campus",
  "building",
  "floor",
  "room",
  "yard",
  "storeroom",
  "other"
] as const;
export type FacilityLocationType = (typeof FACILITY_LOCATION_TYPES)[number];

export const createFacilitySiteInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  timezone: z.string().trim().min(1).max(80).default("America/New_York"),
  addressLine1: z.string().trim().max(200).optional().nullable(),
  city: z.string().trim().max(100).optional().nullable(),
  region: z.string().trim().max(100).optional().nullable(),
  postalCode: z.string().trim().max(32).optional().nullable(),
  country: z.string().trim().max(100).optional().nullable(),
  propertyId: z.string().uuid().optional().nullable(),
  rootLocationName: z.string().trim().min(1).max(120).default("Main building"),
  rootLocationType: z.enum(FACILITY_LOCATION_TYPES).default("building"),
  /** When true (default), activates immediately if activate requirements are met. */
  activate: z.boolean().default(true)
});

export type CreateFacilitySiteInput = z.infer<typeof createFacilitySiteInputSchema>;

export const updateFacilitySiteInputSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  timezone: z.string().trim().min(1).max(80).optional(),
  addressLine1: z.string().trim().max(200).optional().nullable(),
  city: z.string().trim().max(100).optional().nullable(),
  region: z.string().trim().max(100).optional().nullable(),
  postalCode: z.string().trim().max(32).optional().nullable(),
  country: z.string().trim().max(100).optional().nullable(),
  propertyId: z.string().uuid().optional().nullable()
});

export type UpdateFacilitySiteInput = z.infer<typeof updateFacilitySiteInputSchema>;
