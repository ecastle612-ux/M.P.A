import { beforeEach, describe, expect, it, vi } from "vitest";

const findOpportunityForActivation = vi.fn();
const createOpportunity = vi.fn();
const updateOpportunity = vi.fn();

vi.mock("./opportunities", () => ({
  findOpportunityForActivation: (...args: unknown[]) => findOpportunityForActivation(...args),
  createOpportunity: (...args: unknown[]) => createOpportunity(...args),
  updateOpportunity: (...args: unknown[]) => updateOpportunity(...args)
}));

import { createOrReuseContactSalesLead } from "./public-lead";

describe("ACQ-001 Slice B Contact Sales → COM", () => {
  beforeEach(() => {
    findOpportunityForActivation.mockReset();
    createOpportunity.mockReset();
    updateOpportunity.mockReset();
  });

  it("creates a lead opportunity with approved fields", async () => {
    findOpportunityForActivation.mockResolvedValue(null);
    createOpportunity.mockResolvedValue({
      id: "opp-new",
      stage: "lead",
      companyName: "Northwind PM",
      contactEmail: "ada@northwind.test",
      contactName: "Ada",
      source: "public_contact_sales",
      planCode: "enterprise",
      organizationId: null
    });

    const result = await createOrReuseContactSalesLead({
      name: "Ada",
      workEmail: "Ada@Northwind.test",
      company: "Northwind PM",
      portfolioSize: "40 properties",
      message: "Need SSO"
    });

    expect(result.reused).toBe(false);
    expect(createOpportunity).toHaveBeenCalledWith(
      expect.objectContaining({
        companyName: "Northwind PM",
        contactEmail: "ada@northwind.test",
        contactName: "Ada",
        source: "public_contact_sales",
        planCode: "enterprise",
        stage: "lead"
      })
    );
    expect(String(createOpportunity.mock.calls[0]?.[0]?.notes)).toContain("Portfolio: 40 properties");
  });

  it("reuses an open opportunity instead of duplicating", async () => {
    findOpportunityForActivation.mockResolvedValue({
      id: "opp-1",
      stage: "discovery",
      notes: "Prior note",
      organizationId: null
    });
    updateOpportunity.mockResolvedValue({
      id: "opp-1",
      stage: "discovery",
      source: "public_contact_sales"
    });

    const result = await createOrReuseContactSalesLead({
      name: "Ada",
      workEmail: "ada@northwind.test",
      company: "Northwind PM",
      message: "Follow-up"
    });

    expect(result.reused).toBe(true);
    expect(createOpportunity).not.toHaveBeenCalled();
    expect(updateOpportunity).toHaveBeenCalledWith(
      "opp-1",
      expect.objectContaining({
        source: "public_contact_sales",
        planCode: "enterprise"
      })
    );
  });

  it("requires name, email, and company", async () => {
    await expect(
      createOrReuseContactSalesLead({
        name: "",
        workEmail: "x",
        company: ""
      })
    ).rejects.toThrow(/required/i);
  });
});
