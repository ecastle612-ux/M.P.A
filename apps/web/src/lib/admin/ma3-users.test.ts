import { describe, expect, it } from "vitest";
import {
  aggregateUsersFromMemberships,
  filterMemberships,
  filterUsers,
  parseUserFilters,
  type Ma3MembershipRow
} from "./ma3-users";

const rows: Ma3MembershipRow[] = [
  {
    membershipId: "m1",
    userId: "u1",
    organizationId: "org_a",
    organizationName: "Alpha",
    roles: ["property_manager"],
    status: "active",
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-10T00:00:00.000Z",
    displayName: "Ada",
    email: "ada@example.com"
  },
  {
    membershipId: "m2",
    userId: "u1",
    organizationId: "org_b",
    organizationName: "Beta",
    roles: ["tenant"],
    status: "inactive",
    createdAt: "2026-08-02T00:00:00.000Z",
    updatedAt: "2026-08-11T00:00:00.000Z",
    displayName: "Ada",
    email: "ada@example.com"
  },
  {
    membershipId: "m3",
    userId: "u2",
    organizationId: "org_a",
    organizationName: "Alpha",
    roles: ["facility_manager"],
    status: "active",
    createdAt: "2026-08-03T00:00:00.000Z",
    updatedAt: "2026-08-09T00:00:00.000Z",
    displayName: null,
    email: null
  }
];

describe("MA-3 users/membership helpers", () => {
  it("aggregates memberships into users with org counts and roles", () => {
    const users = aggregateUsersFromMemberships(rows);
    expect(users).toHaveLength(2);
    const ada = users.find((u) => u.userId === "u1");
    expect(ada?.organizationCount).toBe(2);
    expect(ada?.roles).toEqual(["property_manager", "tenant"]);
    expect(ada?.activeMembershipCount).toBe(1);
    expect(ada?.lastActivityAt).toBe("2026-08-11T00:00:00.000Z");
  });

  it("filters memberships by organization, role, and status", () => {
    expect(filterMemberships(rows, { organizationId: "org_a" })).toHaveLength(2);
    expect(filterMemberships(rows, { role: "tenant" }).map((m) => m.membershipId)).toEqual(["m2"]);
    expect(filterMemberships(rows, { status: "inactive" })).toHaveLength(1);
  });

  it("filters users by search and org without leaking unrelated memberships", () => {
    const users = aggregateUsersFromMemberships(rows);
    const filtered = filterUsers(users, { organizationId: "org_b" });
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.userId).toBe("u1");
    expect(filterUsers(users, { q: "facility" }).map((u) => u.userId)).toEqual(["u2"]);
  });

  it("parses user filters without inventing fields", () => {
    const parsed = parseUserFilters(
      new URLSearchParams("q=ada&organizationId=org_a&role=property_manager&status=active")
    );
    expect(parsed.q).toBe("ada");
    expect(parsed.organizationId).toBe("org_a");
    expect(parsed.role).toBe("property_manager");
    expect(parsed.status).toBe("active");
  });
});
