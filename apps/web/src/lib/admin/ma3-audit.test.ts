import { describe, expect, it } from "vitest";
import {
  filterAuditEvents,
  mapDomainAuditRow,
  mapSecurityErrorToAudit,
  mapSupportAuditRow,
  parseAuditFilters,
  scrubAuditPayload
} from "./ma3-audit";

describe("MA-3 audit helpers", () => {
  it("scrubs secrets from audit payloads", () => {
    const scrubbed = scrubAuditPayload({
      password: "nope",
      stripe_secret: "whsec_x",
      reason: "ok"
    });
    expect(scrubbed["password"]).toBe("[redacted]");
    expect(scrubbed["stripe_secret"]).toBe("[redacted]");
    expect(scrubbed["reason"]).toBe("ok");
  });

  it("maps support and domain audit rows", () => {
    const support = mapSupportAuditRow({
      id: "s1",
      created_at: "2026-08-11T00:00:00.000Z",
      operator_user_id: "op1",
      action: "resend_invitation",
      entity_type: "invitation",
      entity_id: "inv1",
      organization_id: "org_a",
      payload: { reason: "user requested", requestId: "req_1" },
      organizationName: "Alpha"
    });
    expect(support.source).toBe("support");
    expect(support.actorLabel).toBe("platform_operator");
    expect(support.reason).toBe("user requested");
    expect(support.correlationId).toBe("req_1");

    const domain = mapDomainAuditRow({
      id: "d1",
      created_at: "2026-08-11T01:00:00.000Z",
      actor_id: "u1",
      action: "work_order.complete",
      entity_type: "maintenance_work_order",
      entity_id: "wo1",
      organization_id: "org_a",
      payload: {},
      correlation_id: "corr_1"
    });
    expect(domain.source).toBe("domain");
    expect(domain.correlationId).toBe("corr_1");
  });

  it("maps only auth-related durable errors into security audit events", () => {
    const mapped = mapSecurityErrorToAudit({
      id: "e1",
      created_at: "2026-08-11T02:00:00.000Z",
      message: "Forbidden",
      route: "/api/admin/organizations",
      organization_id: "org_a",
      actor_id: "u1",
      request_id: "req_x",
      severity: "error",
      metadata: { password: "secret" }
    });
    expect(mapped?.source).toBe("security");
    expect(mapped?.context["password"]).toBe("[redacted]");

    expect(
      mapSecurityErrorToAudit({
        id: "e2",
        created_at: "2026-08-11T02:00:00.000Z",
        message: "timeout",
        route: "/api/health",
        organization_id: null,
        actor_id: null,
        request_id: null,
        severity: "error",
        metadata: {}
      })
    ).toBeNull();
  });

  it("filters audit events by org/actor/action/source", () => {
    const events = [
      mapSupportAuditRow({
        id: "s1",
        created_at: "2026-08-11T00:00:00.000Z",
        operator_user_id: "op1",
        action: "resend_invitation",
        entity_type: "invitation",
        entity_id: "inv1",
        organization_id: "org_a",
        payload: {}
      }),
      mapDomainAuditRow({
        id: "d1",
        created_at: "2026-08-11T01:00:00.000Z",
        actor_id: "u1",
        action: "work_order.complete",
        entity_type: "maintenance_work_order",
        entity_id: "wo1",
        organization_id: "org_b",
        payload: {}
      })
    ];
    expect(filterAuditEvents(events, { organizationId: "org_a" })).toHaveLength(1);
    expect(filterAuditEvents(events, { actorId: "u1" })).toHaveLength(1);
    expect(filterAuditEvents(events, { source: "domain" })).toHaveLength(1);
    expect(filterAuditEvents(events, { action: "resend" })).toHaveLength(1);
  });

  it("parses audit filters with time range", () => {
    const parsed = parseAuditFilters(new URLSearchParams("range=24h&source=security&actor=op1"));
    expect(parsed.rangeLabel).toContain("24");
    expect(parsed.source).toBe("security");
    expect(parsed.actorId).toBe("op1");
    expect(parsed.since).toBeTruthy();
  });
});
