import { describe, expect, it } from "vitest";
import {
  buildResidentCommandCenterViewModel,
  buildResidentPortalViewModel
} from "./ux016-view-model";
import type { TenantListItem } from "../tenant/server";

const sample: TenantListItem = {
  id: "ten-1",
  organizationId: "org-1",
  propertyId: "prop-1",
  unitId: "unit-1",
  firstName: "Pat",
  lastName: "Resident",
  preferredName: null,
  email: "pat@example.com",
  avatarUrl: null,
  avatarMediaAssetId: null,
  phone: null,
  dateOfBirth: null,
  moveInDate: "2026-09-01",
  moveOutDate: null,
  documentsPlaceholder: null,
  emergencyContactName: null,
  emergencyContactPhone: null,
  notes: null,
  status: "active",
  lifecycleStatus: "awaiting_move_in",
  workflowStage: "move_in_scheduled",
  metadata: {},
  createdAt: "2026-08-06T00:00:00.000Z",
  updatedAt: "2026-08-06T00:00:00.000Z",
  archivedAt: null,
  deletedAt: null,
  propertyName: "Oak Street",
  unitNumber: "2A"
};

describe("Resident Command Centers UDF", () => {
  it("surfaces move-in queue on staff STD-001 home", () => {
    const model = buildResidentCommandCenterViewModel({
      tenants: [sample],
      canCreate: true,
      userName: "Alex"
    });
    expect(model.greeting.surfaceLabel).toBe("Resident Operations");
    expect(model.attention.some((item) => item.id === "res-move-in")).toBe(true);
    expect(model.quickActions.some((item) => item.id === "qa-new")).toBe(true);
  });

  it("keeps calm supporting line on resident portal home", () => {
    const model = buildResidentPortalViewModel({
      firstName: "Pat",
      propertyName: "Oak Street",
      unitNumber: "2A",
      hasLinkedTenant: true,
      workflowStage: "active_resident",
      attentionItems: [],
      todayCards: [{ id: "pay", title: "Rent due", description: "Due soon", href: "/portal/tenant/payments" }],
      balanceDue: 1200,
      openMaintenanceCount: 1
    });
    expect(model.greeting.surfaceLabel).toBe("Resident Home");
    expect(model.greeting.supportingLine).toContain("calm");
    expect(model.quickActions.some((item) => item.id === "qa-pay")).toBe(true);
  });
});
