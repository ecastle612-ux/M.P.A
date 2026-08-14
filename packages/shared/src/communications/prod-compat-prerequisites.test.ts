import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migrationPath = resolve(
  process.cwd(),
  "../../supabase/migrations/20260814005000_com_002_prod_compat_prerequisites.sql"
);
const sql = readFileSync(migrationPath, "utf8");
const statements = sql.replace(/--[^\n]*/g, "");

describe("COM-002 M1 production compatibility migration", () => {
  it("creates the approved prerequisite objects", () => {
    expect(sql).toContain("create table if not exists public.lease_residents");
    expect(sql).toContain("create or replace function public.is_lease_resident");
    expect(sql).toContain("create table if not exists public.comms_messages");
    expect(sql).toContain("create table if not exists public.comms_notifications");
    expect(sql).toContain("create index if not exists lease_residents_user_idx");
    expect(sql).toContain("create index if not exists comms_messages_org_created_idx");
    expect(sql).toContain("create index if not exists comms_messages_recipient_idx");
    expect(sql).toContain("create index if not exists comms_notifications_user_idx");
    expect(sql).toContain("create policy lease_residents_select");
    expect(sql).toContain("create policy lease_residents_manage_manager");
    expect(sql).toContain("create policy comms_messages_select_member");
    expect(sql).toContain("create policy comms_notifications_select_own");
    expect(sql).toContain("platform.communications:read");
    expect(sql).toContain("platform.communications:write");
    expect(sql).toContain("on conflict (key) do nothing");
  });

  it("stays inside approved M1 scope", () => {
    expect(statements).not.toMatch(/create or replace function public\.is_org_member/i);
    expect(statements).not.toMatch(/create or replace function public\.is_org_manager/i);
    expect(statements).not.toMatch(/conversation_threads|communication_messages|in_app_notifications/i);
    expect(statements).not.toMatch(/financial_charges|financial_payments|financial_ledger/i);
    expect(statements).not.toMatch(/document_documents/i);
    expect(statements).not.toMatch(/conversation_id/i);
    expect(statements).not.toMatch(/comms_conversations/i);
    expect(statements).not.toMatch(/drop table/i);
    expect(statements).not.toMatch(/insert into public\.(tenants|leases|lease_residents|comms_)/i);
  });
});
