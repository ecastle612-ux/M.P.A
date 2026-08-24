import { describe, expect, it } from "vitest";
import {
  assignmentRuleConditionsSchema,
  assigneeEligibilityFromMembership,
  describeAssignmentRule,
  firstMatchingAssignmentRule,
  normalizeLocationLabel,
  ruleConditionsMatch,
  type AssignmentWorkFacts
} from "./assignment-routing";

const facts = (overrides: Partial<AssignmentWorkFacts> = {}): AssignmentWorkFacts => ({
  category: "plumbing",
  priority: "normal",
  propertyId: "11111111-1111-4111-8111-111111111111",
  assetId: null,
  assetType: null,
  originSource: "public_request",
  floorLabel: "3",
  departmentLabel: "Cardiology",
  roomLabel: null,
  ...overrides
});

describe("FO-EFF Slice 6 assignment rule matching", () => {
  it("requires at least one structured condition", () => {
    expect(assignmentRuleConditionsSchema.safeParse({}).success).toBe(false);
    expect(assignmentRuleConditionsSchema.safeParse({ category: "plumbing" }).success).toBe(true);
  });

  it("matches canonical values and exact location labels", () => {
    expect(ruleConditionsMatch({ category: "plumbing" }, facts())).toBe(true);
    expect(ruleConditionsMatch({ category: "electrical" }, facts())).toBe(false);
    expect(ruleConditionsMatch({ locationLabel: "Cardiology" }, facts())).toBe(true);
    expect(ruleConditionsMatch({ locationLabel: "cardiology" }, facts())).toBe(false);
    expect(normalizeLocationLabel("  Cardiology  ")).toBe("Cardiology");
  });

  it("uses first matching active rule by sort order, not insertion order", () => {
    const winner = firstMatchingAssignmentRule(
      [
        {
          id: "low",
          name: "Later plumbing",
          sortOrder: 2,
          status: "active",
          assigneeUserId: "john",
          conditions: { category: "plumbing" }
        },
        {
          id: "high",
          name: "First plumbing",
          sortOrder: 1,
          status: "active",
          assigneeUserId: "mike",
          conditions: { category: "plumbing" }
        },
        {
          id: "off",
          name: "Inactive emergency",
          sortOrder: 0,
          status: "inactive",
          assigneeUserId: "manager",
          conditions: { priority: "emergency" }
        }
      ],
      facts()
    );
    expect(winner?.id).toBe("high");
    expect(winner?.assigneeUserId).toBe("mike");
  });

  it("returns no match without inventing an assignment", () => {
    expect(
      firstMatchingAssignmentRule(
        [
          {
            id: "hvac",
            name: "HVAC",
            sortOrder: 1,
            status: "active",
            assigneeUserId: "mike",
            conditions: { category: "hvac" }
          }
        ],
        facts()
      )
    ).toBeNull();
  });

  it("describes a rule in facility-manager language", () => {
    expect(describeAssignmentRule({ name: "Plumbing", conditions: { category: "plumbing" } }, "Mike")).toBe(
      "If Category is plumbing, assign to Mike."
    );
  });

  it("rejects inactive, cross-org, and PM-only assignees", () => {
    expect(
      assigneeEligibilityFromMembership({
        userId: "u1",
        organizationId: "org",
        membership: {
          user_id: "u1",
          organization_id: "org",
          status: "inactive",
          roles: ["maintenance_technician"]
        }
      }).reason
    ).toBe("inactive_membership");
    expect(
      assigneeEligibilityFromMembership({
        userId: "u1",
        organizationId: "org",
        membership: null
      }).reason
    ).toBe("cross_org");
    expect(
      assigneeEligibilityFromMembership({
        userId: "u1",
        organizationId: "org",
        membership: {
          user_id: "u1",
          organization_id: "org",
          status: "active",
          roles: ["property_manager"],
          operating_scope: "property_operations"
        }
      }).reason
    ).toBe("lost_facility_access");
    expect(
      assigneeEligibilityFromMembership({
        userId: "u1",
        organizationId: "org",
        membership: {
          user_id: "u1",
          organization_id: "org",
          status: "active",
          roles: ["maintenance_technician"],
          operating_scope: "facility_operations"
        }
      }).eligible
    ).toBe(true);
  });
});
