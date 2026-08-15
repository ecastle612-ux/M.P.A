import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const MIGRATION = "20260815180000_plat_005_privileged_rpc_execute_hardening.sql";
const PREDECESSOR = "20260814233536";

function loadMigration(): string {
  return readFileSync(resolve(process.cwd(), "../../supabase/migrations", MIGRATION), "utf8");
}

function compact(sql: string): string {
  return sql.replace(/\s+/g, " ").toLowerCase();
}

function statementsOnly(sql: string): string {
  return compact(sql.replace(/--[^\n]*/g, " "));
}

describe("PLAT-005 privileged RPC EXECUTE hardening", () => {
  const sql = loadMigration();
  const normalized = compact(sql);

  it("is a successor after the current Production ledger tip", () => {
    expect(MIGRATION.startsWith("20260815")).toBe(true);
    expect(MIGRATION > `${PREDECESSOR}_`).toBe(true);
  });

  it("contains only EXECUTE privilege statements", () => {
    const body = statementsOnly(sql);
    expect(body).not.toMatch(/create or replace function/);
    expect(body).not.toMatch(/create function/);
    expect(body).not.toMatch(/create table/);
    expect(body).not.toMatch(/alter table/);
    expect(body).not.toMatch(/drop table/);
    expect(body).not.toMatch(/drop function/);
    expect(body).not.toMatch(/(^|;)\s*(insert|update|delete)\b/);
    expect(body).not.toMatch(/create role/);
    expect(body).not.toMatch(/alter role/);
    expect(body).not.toMatch(/org_entitlements/);
    expect(body).not.toMatch(/sku_capabilities/);
    expect(body).toMatch(/revoke all on function/);
    expect(body).toMatch(/grant execute on function/);
    expect(body.replace(/revoke all on function[^;]+;/g, "").replace(/grant execute on function[^;]+;/g, "").trim()).toBe(
      "",
    );
  });

  it("hardens Class B P0 functions to service_role only", () => {
    const classB: Array<[string, string]> = [
      ["resolve_auth_user_id_by_email", "text"],
      ["auth_resolve_login_identifier", "text"],
      ["auth_register_username", "text, uuid"],
      ["ops_claim_domain_events", "integer, text"],
      ["ops_claim_due_reminders", "integer, text"],
      ["ops_acquire_scheduler_leader", "text, integer"],
    ];

    for (const [name, args] of classB) {
      expect(normalized).toContain(
        `revoke all on function public.${name}(${args}) from public, anon, authenticated`,
      );
      expect(normalized).toContain(
        `grant execute on function public.${name}(${args}) to service_role`,
      );
      expect(normalized).not.toContain(
        `grant execute on function public.${name}(${args}) to authenticated`,
      );
      expect(normalized).not.toContain(
        `grant execute on function public.${name}(${args}) to anon`,
      );
    }
  });

  it("keeps Class A leftovers executable by authenticated and service_role", () => {
    const leftovers: Array<[string, string]> = [
      ["has_org_capability", "uuid, text"],
      ["is_org_member", "uuid"],
      ["is_org_manager", "uuid"],
      ["is_platform_operator", ""],
      ["is_maintenance_manager", "uuid"],
      ["is_maintenance_technician", "uuid"],
      ["is_lease_resident", "uuid"],
      ["is_leasing_writer", "uuid"],
      ["is_resident_writer", "uuid"],
      ["is_linked_vendor_for_work_order", "uuid"],
      ["is_work_order_resident", "uuid"],
      ["is_conversation_thread_participant", "uuid, uuid"],
    ];

    for (const [name, args] of leftovers) {
      expect(normalized).toContain(
        `revoke all on function public.${name}(${args}) from public, anon`,
      );
      expect(normalized).toContain(
        `grant execute on function public.${name}(${args}) to authenticated, service_role`,
      );
    }
  });

  it("restates already-hardened Class A helpers without widening PUBLIC or anon", () => {
    const restated: Array<[string, string]> = [
      ["apply_facility_stock_movement", "uuid, text, numeric, text, uuid"],
      ["can_manage_facility_ops", "uuid"],
      ["can_select_facility_asset", "uuid"],
      ["can_select_facility_stock_item", "uuid"],
      ["can_select_work_order", "uuid"],
      ["can_access_tenant_conversation", "uuid, uuid, uuid"],
      ["is_pm_comms_staff", "uuid"],
      ["org_sku", "uuid"],
      ["org_allows_work_surface", "uuid, text"],
    ];

    for (const [name, args] of restated) {
      expect(normalized).toContain(
        `revoke all on function public.${name}(${args}) from public, anon`,
      );
      expect(normalized).toContain(
        `grant execute on function public.${name}(${args}) to authenticated, service_role`,
      );
    }
  });

  it("removes client EXECUTE from Class D functions without dropping them", () => {
    expect(normalized).toContain(
      "revoke all on function public.is_pm_staff(uuid) from public, anon, authenticated",
    );
    expect(normalized).toContain(
      "revoke all on function public.resolve_building_qr_token(text) from public, anon, authenticated",
    );
    expect(normalized).toContain(
      "revoke all on function public.create_building_qr_code_for_property() from public, anon, authenticated, service_role",
    );
    expect(normalized).toContain(
      "revoke all on function public.rls_auto_enable() from public, anon, authenticated, service_role",
    );
    expect(normalized).not.toMatch(/drop function public\.(is_pm_staff|resolve_building_qr_token|create_building_qr_code_for_property|rls_auto_enable)/);
  });

  it("encodes the approved role matrix in comments and statements", () => {
    expect(sql).toMatch(/Class B — service_role only/i);
    expect(sql).toMatch(/Class A leftovers/i);
    expect(sql).toMatch(/Class D — remove client EXECUTE/i);
    expect(sql).toMatch(/Do not apply to Production from the implementation task/i);
  });

  it("encodes anonymous / authenticated / service_role outcomes", () => {
    const classB = [
      "resolve_auth_user_id_by_email(text)",
      "auth_resolve_login_identifier(text)",
      "auth_register_username(text, uuid)",
      "ops_claim_domain_events(integer, text)",
      "ops_claim_due_reminders(integer, text)",
      "ops_acquire_scheduler_leader(text, integer)",
    ];
    const classA = [
      "has_org_capability(uuid, text)",
      "is_org_member(uuid)",
      "apply_facility_stock_movement(uuid, text, numeric, text, uuid)",
      "can_access_tenant_conversation(uuid, uuid, uuid)",
      "is_pm_comms_staff(uuid)",
    ];
    const classD = [
      "is_pm_staff(uuid)",
      "resolve_building_qr_token(text)",
      "create_building_qr_code_for_property()",
      "rls_auto_enable()",
    ];

    for (const sig of [...classB, ...classA, ...classD]) {
      expect(normalized).toContain(`revoke all on function public.${sig} from public`);
      expect(normalized).toContain(`revoke all on function public.${sig} from public, anon`);
    }

    for (const sig of classB) {
      expect(normalized).toContain(
        `revoke all on function public.${sig} from public, anon, authenticated`,
      );
      expect(normalized).toContain(`grant execute on function public.${sig} to service_role`);
    }

    for (const sig of classA) {
      expect(normalized).toContain(
        `grant execute on function public.${sig} to authenticated, service_role`,
      );
    }

    for (const sig of classD) {
      expect(normalized).toContain(
        `revoke all on function public.${sig} from public, anon, authenticated`,
      );
      expect(normalized).not.toContain(`grant execute on function public.${sig} to authenticated`);
      expect(normalized).not.toContain(`grant execute on function public.${sig} to anon`);
    }
  });
});
