import { describe, expect, it } from "vitest";
import { MASTER_ADMIN_NAV } from "@mpa/shared";
import { scrubUnknown } from "../observability/scrub";
import { toSafePlatformErrorDto, parsePlatformErrorFilters } from "./platform-errors";
import {
  MA7_CAPABILITIES,
  isBlockedCapability,
  resolveTrustedCapabilities
} from "./ma7-capabilities";
import {
  classifySubscriptionCancel,
  CAPACITY_MUTATION_BLOCKER,
  ORG_LIFECYCLE_BLOCKER
} from "./ma7-mutations";
import {
  assertNoForbiddenSecrets,
  MA8_DOCUMENTED_NON_GOALS,
  MA8_PRIMARY_NAV_HREFS,
  MA8_PRIMARY_SURFACES,
  MA8_RESIDUAL_RISKS
} from "./ma8-certification";

describe("MA-8 inventory + navigation certification", () => {
  it("covers MA-1…MA-7 primary surfaces", () => {
    const slices = new Set(MA8_PRIMARY_SURFACES.map((s) => s.slice));
    for (const required of ["MA-1", "MA-2", "MA-3", "MA-4", "MA-5", "MA-6", "MA-7"] as const) {
      expect(slices.has(required)).toBe(true);
    }
    expect(MA8_PRIMARY_SURFACES.some((s) => s.path.includes("/admin/operations"))).toBe(true);
    expect(MA8_PRIMARY_SURFACES.some((s) => s.path.includes("/mutations/memberships"))).toBe(true);
    expect(MA8_PRIMARY_SURFACES.some((s) => s.path.includes("/mutations/subscriptions"))).toBe(true);
  });

  it("keeps primary Master Admin nav hrefs present and ordered in MASTER_ADMIN_NAV", () => {
    const maGroup = MASTER_ADMIN_NAV.find((g) => g.id === "master-admin");
    expect(maGroup).toBeTruthy();
    const hrefs = maGroup!.items.map((i) => i.href);
    expect(hrefs).toEqual([...MA8_PRIMARY_NAV_HREFS]);
  });

  it("documents intentional non-goals and residual risks without inventing features", () => {
    expect(MA8_DOCUMENTED_NON_GOALS.join(" ")).toMatch(/suspend/i);
    expect(MA8_DOCUMENTED_NON_GOALS.join(" ")).toMatch(/grants table/i);
    expect(MA8_RESIDUAL_RISKS.length).toBeGreaterThan(0);
    expect(ORG_LIFECYCLE_BLOCKER.length).toBeGreaterThan(40);
    expect(CAPACITY_MUTATION_BLOCKER.length).toBeGreaterThan(40);
  });
});

describe("MA-8 sensitive-data + observability certification", () => {
  it("scrubs secrets from support-style payloads and error DTOs", () => {
    const scrubbed = scrubUnknown({
      password: "secret",
      stripe_secret: "sk_test_abcdefghijklmnopqrstuvwxyz",
      token: "abc",
      note: "ok",
      authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.aaaa.bbbb"
    }) as Record<string, unknown>;
    expect(scrubbed["password"]).toBe("[redacted]");
    expect(scrubbed["stripe_secret"]).toBe("[redacted]");
    expect(scrubbed["token"]).toBe("[redacted]");
    expect(String(scrubbed["authorization"])).toContain("[redacted]");
    assertNoForbiddenSecrets(scrubbed, "scrubbed-support-payload");

    const dto = toSafePlatformErrorDto({
      id: "e1",
      created_at: "2026-08-11T12:00:00.000Z",
      severity: "critical",
      message: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.aaaa.bbbb and whsec_abc123secretleak",
      error_name: "Error",
      stack: null,
      request_id: "req_1",
      organization_id: "org_a",
      actor_id: null,
      route: "/api/x",
      source: "server",
      metadata: { service_role: "leak", detail: "fine" }
    });
    expect(dto.metadata["service_role"]).toBe("[redacted]");
    expect(dto.message).not.toMatch(/whsec_[A-Za-z0-9]{8,}/);
    expect(dto.message).not.toMatch(/Bearer\s+[A-Za-z0-9._-]{20,}/i);
    assertNoForbiddenSecrets(dto, "platform-error-dto");
  });

  it("keeps error filters for severity/range/organization/route operational", () => {
    const filters = parsePlatformErrorFilters(
      new URLSearchParams("severity=critical&range=24h&organizationId=org_a&route=/api/x")
    );
    expect(filters.severity).toBe("critical");
    expect(filters.organizationId).toBe("org_a");
    expect(filters.routeContains).toBe("/api/x");
    expect(filters.rangeLabel).toBeTruthy();
    expect(filters.since).toBeTruthy();
  });
});

describe("MA-8 MA-7 mutation policy certification", () => {
  it("keeps org suspend and capacity mutate blocked in capability bootstrap", () => {
    const caps = resolveTrustedCapabilities({
      isActiveOperator: true,
      clientClaimedCapabilities: [
        MA7_CAPABILITIES.ORGS_SUSPEND,
        MA7_CAPABILITIES.CAPACITY_MUTATE,
        MA7_CAPABILITIES.SUBSCRIPTIONS_ASSIGN
      ]
    });
    expect(caps.has(MA7_CAPABILITIES.USERS_MEMBERSHIP_MUTATE)).toBe(true);
    expect(caps.has(MA7_CAPABILITIES.SUBSCRIPTIONS_CANCEL)).toBe(true);
    expect(caps.has(MA7_CAPABILITIES.ORGS_SUSPEND)).toBe(false);
    expect(caps.has(MA7_CAPABILITIES.CAPACITY_MUTATE)).toBe(false);
    expect(isBlockedCapability(MA7_CAPABILITIES.ORGS_SUSPEND)).toBe(true);
    expect(isBlockedCapability(MA7_CAPABILITIES.CAPACITY_MUTATE)).toBe(true);
  });

  it("treats cancel as cancel-at-period-end, not immediate termination", () => {
    expect(classifySubscriptionCancel({ status: "active", cancelAtPeriodEnd: false })).toBe("apply");
    expect(classifySubscriptionCancel({ status: "canceled", cancelAtPeriodEnd: false })).toBe(
      "not_cancellable"
    );
    expect(classifySubscriptionCancel({ status: "active", cancelAtPeriodEnd: true })).toBe(
      "already_cancelled"
    );
  });
});
