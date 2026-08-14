import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(process.cwd(), "../../supabase/migrations/20260814200000_fac_003_asset_inventory.sql"),
  "utf8"
);

describe("FAC-003 RLS and schema contract", () => {
  it("evolves facility_assets and does not drop existing rows", () => {
    expect(migration).toContain("create table if not exists public.facility_assets");
    expect(migration).toContain("add column if not exists scan_code");
    expect(migration).toContain("add column if not exists floor_label");
    expect(migration).toContain("add column if not exists room_label");
    expect(migration).toContain("add column if not exists purchase_date");
    expect(migration).toContain("add column if not exists vendor_id");
    expect(migration).toContain("add column if not exists property_property_id");
    expect(migration).toContain("check (status in ('active', 'maintenance', 'retired', 'replaced'))");
    expect(migration).not.toContain("delete from public.facility_assets");
  });

  it("creates a stock ledger instead of reusing facility_inventory_items", () => {
    expect(migration).toContain("create table if not exists public.facility_stock_items");
    expect(migration).toContain("create table if not exists public.facility_stock_movements");
    expect(migration).toContain("not facility_inventory_items");
    expect(migration).toContain("with check (false)");
    expect(migration).toContain("apply_facility_stock_movement");
    expect(migration).toContain("insufficient stock");
  });

  it("adds optional work-order asset FK and keeps the label", () => {
    expect(migration).toContain("add column if not exists facility_asset_id");
    expect(migration).toContain("keep facility_asset_label");
  });

  it("registers MEDIA-001 facility_asset parent", () => {
    expect(migration).toContain("'facility_asset'");
  });

  it("revokes anon execute and does not add roles or SKUs", () => {
    expect(migration).toContain(
      "revoke all on function public.apply_facility_stock_movement(uuid, text, numeric, text, uuid) from public, anon"
    );
    expect(migration).toContain("revoke all on function public.can_select_facility_asset(uuid) from public, anon");
    expect(migration).not.toContain("insert into public.product_skus");
    expect(migration).not.toContain("facility_manager");
    expect(migration).not.toContain("facility_technician");
  });

  it("scopes technician asset select to assigned facility work orders", () => {
    expect(migration).toContain("can_select_facility_asset");
    expect(migration).toContain("technician_user_id = auth.uid()");
    expect(migration).toContain("can_manage_facility_ops");
    expect(migration).toContain("org_allows_work_surface(target_org_id, 'facility')");
  });
});
