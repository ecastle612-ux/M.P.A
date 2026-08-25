import { describe, expect, it } from "vitest";
import {
  WORK_ORDER_CATEGORIES,
  cancelWorkOrderInputSchema,
  createFacilityWorkOrderInputSchema,
  createStaffResidentialWorkOrderInputSchema
} from "./schemas";

describe("STAB-004 facility work-order schemas", () => {
  it("includes facility categories alongside residential ones", () => {
    expect(WORK_ORDER_CATEGORIES).toContain("general");
    expect(WORK_ORDER_CATEGORIES).toContain("preventive");
    expect(WORK_ORDER_CATEGORIES).toContain("inspection");
    expect(WORK_ORDER_CATEGORIES).toContain("safety");
    expect(WORK_ORDER_CATEGORIES).toContain("compliance");
    expect(WORK_ORDER_CATEGORIES).toContain("building_system");
    expect(WORK_ORDER_CATEGORIES).toContain("inventory");
    expect(WORK_ORDER_CATEGORIES).toContain("parts");
  });

  it("accepts createFacilityWorkOrderInputSchema with property and optional fields", () => {
    const parsed = createFacilityWorkOrderInputSchema.safeParse({
      title: "Rooftop AHU filter change",
      description: "Replace filters on AHU-3 before summer load.",
      category: "preventive",
      priority: "high",
      propertyId: "11111111-1111-4111-8111-111111111111",
      facilityAssetLabel: "AHU-3",
      facilityAssetId: "33333333-3333-4333-8333-333333333333",
      dueAt: "2026-08-15T17:00:00.000Z"
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.facilityAssetId).toBe("33333333-3333-4333-8333-333333333333");
    }
  });

  it("rejects createFacilityWorkOrder without propertyId", () => {
    const parsed = createFacilityWorkOrderInputSchema.safeParse({
      title: "Missing building",
      description: "Cannot create facility work without a property.",
      category: "general",
      priority: "normal"
    });
    expect(parsed.success).toBe(false);
  });

  it("accepts staff residential create with org-owned property", () => {
    const parsed = createStaffResidentialWorkOrderInputSchema.safeParse({
      title: "Unit 204 leak",
      description: "Kitchen sink is dripping.",
      propertyId: "11111111-1111-4111-8111-111111111111",
      residentId: "44444444-4444-4444-8444-444444444444"
    });
    expect(parsed.success).toBe(true);
  });

  it("accepts cancelWorkOrderInputSchema with optional note", () => {
    const parsed = cancelWorkOrderInputSchema.safeParse({
      workOrderId: "22222222-2222-4222-8222-222222222222",
      note: "Duplicate of WO-19"
    });
    expect(parsed.success).toBe(true);
    const minimal = cancelWorkOrderInputSchema.safeParse({
      workOrderId: "22222222-2222-4222-8222-222222222222"
    });
    expect(minimal.success).toBe(true);
  });
});
