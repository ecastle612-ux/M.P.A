import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(process.cwd(), "../../supabase/migrations/20260818210000_docs_226_sec_001_security_hardening.sql"),
  "utf8"
);

describe("SEC-001 RLS / grant contract", () => {
  it("removes SignWell client write access and keeps operator select", () => {
    expect(migration).toContain("drop policy if exists signwell_webhook_events_manage");
    expect(migration).toContain("revoke all on table public.signwell_webhook_events from public, anon, authenticated");
    expect(migration).toContain("grant select on table public.signwell_webhook_events to authenticated");
    expect(migration).toContain("create policy signwell_webhook_events_operator_select");
    expect(migration).toContain("for select");
    expect(migration).toContain("platform_operators");
    expect(migration).not.toContain("signwell_webhook_events_manage on public.signwell_webhook_events\nfor all");
    expect(migration).not.toMatch(/delete from public\.signwell_webhook_events/i);
  });

  it("closes the identical NULL-org write hole on auth_support_escalations when present", () => {
    expect(migration).toContain("auth_support_escalations");
    expect(migration).toContain("auth_support_escalations_manage_manager");
    expect(migration).toContain("organization_id is not null");
    expect(migration).toContain("to_regclass('public.auth_support_escalations')");
  });

  it("revokes leftover client DML grants on other webhook-event tables", () => {
    expect(migration).toContain("saas_stripe_webhook_events");
    expect(migration).toContain("saas_webhook_events");
    expect(migration).toContain("financial_stripe_webhook_events");
    expect(migration).toContain("integrations_webhook_events");
    expect(migration).toContain("revoke insert, update, delete, truncate");
  });

  it("replaces PM / routing member FOR ALL with can_manage_facility_ops", () => {
    expect(migration).toContain("drop policy if exists facility_pm_plans_org_all");
    expect(migration).toContain("drop policy if exists facility_assignment_rules_org_all");
    expect(migration).toContain("can_manage_facility_ops(organization_id)");
    expect(migration).toContain("is_maintenance_technician(organization_id)");
    expect(migration).toContain("org_allows_work_surface(organization_id, 'facility')");
    expect(migration).toContain("to_regclass('public.facility_pm_plans')");
    expect(migration).toContain("to_regclass('public.facility_assignment_rules')");
    expect(migration).not.toContain("insert into public.product_skus");
  });

  it("adds a service-role-only durable rate-limit function with a fixed search_path", () => {
    expect(migration).toContain("create table if not exists public.platform_rate_limit_buckets");
    expect(migration).toContain("create or replace function public.consume_platform_rate_limit");
    expect(migration).toContain("security definer");
    expect(migration).toContain("set search_path = public");
    expect(migration).toContain(
      "revoke all on function public.consume_platform_rate_limit(text, integer, integer) from public, anon, authenticated"
    );
    expect(migration).toContain(
      "grant execute on function public.consume_platform_rate_limit(text, integer, integer) to service_role"
    );
    expect(migration).toContain("revoke all on table public.platform_rate_limit_buckets from public, anon, authenticated");
  });

  it("does not alter money, SignWell legal rows, or PM generation data", () => {
    expect(migration).not.toMatch(/update public\.lease_agreements/i);
    expect(migration).not.toMatch(/delete from public\.facility_pm/i);
    expect(migration).not.toMatch(/drop table/i);
    expect(migration).not.toContain("checkout.sessions");
    expect(migration).not.toContain("price_");
  });
});
