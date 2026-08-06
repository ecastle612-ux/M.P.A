import { z } from "zod";

/** Launch-critical property create — name + unit count only. */
export const createPortfolioPropertyInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  unitCount: z.number().int().min(1).max(50).default(1)
});

export type CreatePortfolioPropertyInput = z.infer<typeof createPortfolioPropertyInputSchema>;

export const PROPERTY_STATUSES = ["active", "inactive"] as const;
export type PropertyStatus = (typeof PROPERTY_STATUSES)[number];

export function unitLabelsForCount(unitCount: number): string[] {
  return Array.from({ length: unitCount }, (_, index) => String(index + 1));
}
