import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(process.cwd(), "../../supabase/migrations/20260815220000_docs_135_invitation_acceptance_remediation.sql"),
  "utf8"
);

const plat005 = [
  "20260814160000_plat_002_authorization_hardening.sql",
  "20260815200000_adr_033_member_operating_scope.sql",
  "20260815220000_docs_135_invitation_acceptance_remediation.sql"
].map((file) => readFileSync(resolve(process.cwd(), `../../supabase/migrations/${file}`), "utf8"));

describe("docs/135 invitation RLS and PLAT-005 contract", () => {
  it("removes email-match invitation UPDATE so invitees cannot mutate role or scope", () => {
    expect(migration).toContain("drop policy if exists invitations_update_authorized");
    expect(migration).toContain("using (public.has_org_capability(organization_id, 'invitation:create'))");
    expect(migration).toContain("with check (public.has_org_capability(organization_id, 'invitation:create'))");
    expect(migration).not.toMatch(
      /invitations_update_authorized[\s\S]*lower\(email\) = lower\(coalesce\(\(auth\.jwt\(\)/
    );
  });

  it("does not add an invitee-self-insert membership policy", () => {
    expect(migration).not.toContain("memberships_insert");
    expect(migration).not.toMatch(/organization_memberships[\s\S]*for insert/);
    expect(migration).toContain("Does not add an invitee-self-insert membership policy");
  });

  it("does not expose a new anon or authenticated SECURITY DEFINER accept RPC", () => {
    expect(migration).not.toMatch(/create (or replace )?function/i);
    expect(migration).not.toMatch(/grant execute/i);
    expect(migration).not.toMatch(/to anon/i);
    expect(migration).not.toMatch(/to authenticated/i);
    expect(migration).toContain("Does not create a client-callable SECURITY DEFINER accept RPC");
  });

  it("keeps PLAT-005 privileged helper revokes on the authorization lineage", () => {
    const joined = plat005.join("\n");
    expect(joined).toContain("revoke all on function public.org_sku(uuid) from public, anon");
    expect(joined).toContain("revoke all on function public.can_select_work_order(uuid) from public, anon");
    expect(joined).toContain("revoke all on function public.member_operating_scope(uuid, uuid) from public, anon");
  });

  it("adds delivery_status without adding email_status", () => {
    expect(migration).toContain("add column if not exists delivery_status text");
    expect(migration).toContain("add column if not exists last_delivered_at timestamptz");
    expect(migration).not.toMatch(/add column if not exists email_status/);
    expect(migration).not.toContain("drop column");
  });

  it("widens technician CHECKs without creating a role or rewriting memberships", () => {
    expect(migration).toContain("maintenance_technician");
    expect(migration).toContain("facility_technician");
    expect(migration).toContain("Not a new role");
    expect(migration).not.toContain("insert into public.role_permission_grants");
    expect(migration).not.toContain("facility_manager");
    expect(migration).not.toContain("update public.organization_memberships");
  });
});
