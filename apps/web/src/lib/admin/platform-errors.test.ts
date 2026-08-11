import { describe, expect, it } from "vitest";
import type { PlatformErrorEventRow } from "../observability/durable-errors";
import {
  filterPlatformErrorRows,
  parsePlatformErrorFilters,
  RESOLUTION_LIMITATION,
  toSafePlatformErrorDto
} from "./platform-errors";

function row(partial: Partial<PlatformErrorEventRow> & Pick<PlatformErrorEventRow, "id">): PlatformErrorEventRow {
  return {
    created_at: "2026-08-11T12:00:00.000Z",
    severity: "error",
    message: "Something failed",
    error_name: "Error",
    stack: null,
    request_id: "req_1",
    organization_id: "org_1",
    actor_id: null,
    route: "/api/example",
    source: "server",
    metadata: {},
    ...partial
  };
}

describe("MA-1 platform error DTOs and filters", () => {
  it("scrubs secrets from message, stack, and metadata", () => {
    const dto = toSafePlatformErrorDto(
      row({
        id: "e1",
        message: "Bearer abc.def.ghi leaked with sk_test_12345678901234567890",
        stack: "password=supersecret token=abc",
        metadata: {
          password: "nope",
          stripe_secret: "whsec_abc",
          detail: "safe"
        }
      })
    );
    expect(dto.message).toContain("[redacted]");
    expect(dto.message).toContain("[redacted-key]");
    expect(dto.stack).toContain("[redacted]");
    expect(dto.metadata["password"]).toBe("[redacted]");
    expect(dto.metadata["stripe_secret"]).toBe("[redacted]");
    expect(dto.metadata["detail"]).toBe("safe");
    expect(dto.occurrenceCount).toBe(1);
    expect(dto.resolutionStatus).toBe("untracked");
    expect(dto.resolutionNote).toBe(RESOLUTION_LIMITATION);
  });

  it("filters by severity, organization, route/category, and time range", () => {
    const rows = [
      row({ id: "a", severity: "critical", organization_id: "org_1", route: "/api/a" }),
      row({
        id: "b",
        severity: "error",
        organization_id: "org_2",
        route: "/api/b",
        created_at: "2026-08-01T00:00:00.000Z"
      }),
      row({
        id: "c",
        severity: "warning",
        organization_id: "org_1",
        message: "RLS violation",
        route: null
      })
    ];

    expect(filterPlatformErrorRows(rows, { severity: "critical" }).map((r) => r.id)).toEqual(["a"]);
    expect(filterPlatformErrorRows(rows, { organizationId: "org_2" }).map((r) => r.id)).toEqual(["b"]);
    expect(filterPlatformErrorRows(rows, { routeContains: "rls" }).map((r) => r.id)).toEqual(["c"]);
    expect(
      filterPlatformErrorRows(rows, { since: "2026-08-10T00:00:00.000Z" }).map((r) => r.id)
    ).toEqual(["a", "c"]);
  });

  it("does not invent resolution filtering", () => {
    const parsed = parsePlatformErrorFilters(new URLSearchParams("severity=error&range=7d"));
    expect(parsed.resolution).toBe("all");
    expect(parsed.severity).toBe("error");
    expect(parsed.rangeLabel).toContain("7 days");
  });

  it("keeps organization filter server-side equality (no cookie trust)", () => {
    const rows = [
      row({ id: "a", organization_id: "org_a" }),
      row({ id: "b", organization_id: "org_b" })
    ];
    const filtered = filterPlatformErrorRows(rows, { organizationId: "org_a" });
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.organization_id).toBe("org_a");
    expect(filtered.every((r) => r.organization_id === "org_a")).toBe(true);
  });
});
