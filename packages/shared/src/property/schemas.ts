import { z } from "zod";

/** Launch-critical property create — name + unit count only. */
export const createPortfolioPropertyInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  unitCount: z.number().int().min(1).max(50).default(1)
});

export type CreatePortfolioPropertyInput = z.infer<typeof createPortfolioPropertyInputSchema>;

export const PROPERTY_STATUSES = ["active", "inactive"] as const;
export type PropertyStatus = (typeof PROPERTY_STATUSES)[number];

/** Existing DB CHECK on property_units.status — no migration. */
export const PROPERTY_UNIT_STATUSES = ["available", "occupied", "offline"] as const;
export type PropertyUnitStatus = (typeof PROPERTY_UNIT_STATUSES)[number];

/** Customer-editable statuses (occupied is lease/resident driven). */
export const PROPERTY_UNIT_EDITABLE_STATUSES = ["available", "offline"] as const;
export type PropertyUnitEditableStatus = (typeof PROPERTY_UNIT_EDITABLE_STATUSES)[number];

export const createPropertyUnitInputSchema = z.object({
  unitLabel: z.string().trim().min(1).max(40)
});

export type CreatePropertyUnitInput = z.infer<typeof createPropertyUnitInputSchema>;

export const updatePropertyUnitInputSchema = z
  .object({
    unitLabel: z.string().trim().min(1).max(40).optional(),
    status: z.enum(PROPERTY_UNIT_EDITABLE_STATUSES).optional()
  })
  .refine((value) => value.unitLabel !== undefined || value.status !== undefined, {
    message: "Provide unitLabel and/or status"
  });

export type UpdatePropertyUnitInput = z.infer<typeof updatePropertyUnitInputSchema>;

export function unitLabelsForCount(unitCount: number): string[] {
  return Array.from({ length: unitCount }, (_, index) => String(index + 1));
}

/** Next default label after existing units (numeric sequence when possible). */
export function suggestNextUnitLabel(existingLabels: readonly string[]): string {
  const nums = existingLabels
    .map((label) => Number(label))
    .filter((value) => Number.isInteger(value) && value > 0);
  if (nums.length > 0 && nums.length === existingLabels.length) {
    return String(Math.max(...nums) + 1);
  }
  let candidate = existingLabels.length + 1;
  const set = new Set(existingLabels);
  while (set.has(String(candidate))) {
    candidate += 1;
  }
  return String(candidate);
}
