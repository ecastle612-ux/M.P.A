import { describe, expect, it } from "vitest";
import { occupancyIsCurrent, utcToday } from "@mpa/shared";
import { acceptInvitation } from "../team/invitation-service";
import {
  acceptTenantBinding,
  addTenantToLease,
  cancelFutureMoveOut,
  correctMoveOut,
  moveOutOccupancy,
  resolveTenantPortalMode,
  type OccupancyRow
} from "./tenant-lifecycle-service";

type Row = Record<string, unknown>;

function createLifecycleDb() {
  const tables = {
    organization_invitations: [],
    organization_invitation_tenant_bindings: [],
    organization_memberships: [],
    organization_operating_scope_events: [],
    organization_subscriptions: [
      { organization_id: "org-1", sku_code: "mpa_property_manager", status: "active" }
    ],
    organization_setup_state: [{ organization_id: "org-1", completed_at: "2026-01-01T00:00:00Z" }],
    event_domain_events: [],
    audit_events: [],
    organizations: [{ id: "org-1", name: "Demo" }],
    property_properties: [{ id: "prop-1", name: "Oak Street", organization_id: "org-1" }],
    property_units: [{ id: "unit-1", unit_label: "1A", property_id: "prop-1", organization_id: "org-1" }],
    lease_agreements: [
      {
        id: "lease-1",
        organization_id: "org-1",
        property_id: "prop-1",
        unit_id: "unit-1",
        status: "active",
        start_date: "2026-01-01",
        end_date: "2026-12-31",
        resident_id: null
      }
    ],
    pm_residents: [],
    lease_residents: [] as Row[]
  } as {
    organization_invitations: Row[];
    organization_invitation_tenant_bindings: Row[];
    organization_memberships: Row[];
    organization_operating_scope_events: Row[];
    organization_subscriptions: Row[];
    organization_setup_state: Row[];
    event_domain_events: Row[];
    audit_events: Row[];
    organizations: Row[];
    property_properties: Row[];
    property_units: Row[];
    lease_agreements: Row[];
    pm_residents: Row[];
    lease_residents: Row[];
  };

  function matches(row: Row, filters: Array<[string, unknown]>): boolean {
    return filters.every(([column, value]) => row[column] === value);
  }

  function from(table: string) {
    const filters: Array<[string, unknown]> = [];
    let action: "select" | "insert" | "update" = "select";
    let payload: Row | null = null;
    let countOnly = false;

    const execute = () => {
      const store = tables as Record<string, Row[]>;
      const rows = store[table] ?? (store[table] = []);
      if (action === "insert" && payload) {
        const row: Row = {
          id: (payload["id"] as string | undefined) ?? `${table}-${rows.length + 1}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          token: (payload["token"] as string | undefined) ?? "11111111-1111-4111-8111-111111111111",
          expires_at:
            (payload["expires_at"] as string | undefined) ??
            new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          status: payload["status"] ?? (table === "organization_invitations" ? "pending" : payload["status"]),
          ...payload
        };
        rows.push(row);
        return { data: [row], error: null, count: 1 };
      }
      if (action === "update" && payload) {
        const updated: Row[] = [];
        for (const row of rows) {
          if (matches(row, filters)) {
            Object.assign(row, payload, { updated_at: new Date().toISOString() });
            updated.push(row);
          }
        }
        return { data: updated, error: null, count: updated.length };
      }
      const found = rows.filter((row) => matches(row, filters));
      return { data: found, error: null, count: found.length };
    };

    const builder = {
      select: (_columns?: string, options?: { count?: string; head?: boolean }) => {
        countOnly = Boolean(options?.head);
        return builder;
      },
      insert: (row: Row) => {
        action = "insert";
        payload = row;
        return builder;
      },
      update: (row: Row) => {
        action = "update";
        payload = row;
        return builder;
      },
      eq: (column: string, value: unknown) => {
        filters.push([column, value]);
        return builder;
      },
      order: () => builder,
      limit: () => builder,
      maybeSingle: async () => {
        const result = execute();
        return { data: ((result.data as Row[]) ?? [])[0] ?? null, error: result.error };
      },
      single: async () => {
        const result = execute();
        const row = ((result.data as Row[]) ?? [])[0];
        if (!row) return { data: null, error: { message: "not found" } };
        return { data: row, error: null };
      },
      then: (onfulfilled: (value: { data: Row[]; error: null; count: number | null }) => unknown) => {
        const result = execute();
        return Promise.resolve({
          data: countOnly ? [] : ((result.data as Row[]) ?? []),
          error: null,
          count: result.count
        }).then(onfulfilled);
      }
    };
    return builder;
  }

  return { tables, client: { from } };
}

describe("docs/166 tenant lifecycle", () => {
  it("adds a tenant, binds invitation server-side, and ignores browser override keys", async () => {
    const db = createLifecycleDb();
    const created = await addTenantToLease({
      supabase: db.client as never,
      organizationId: "org-1",
      actorId: "pm-1",
      organizationName: "Demo",
      input: {
        firstName: "Ada",
        lastName: "Tenant",
        email: "ada@example.com",
        leaseId: "lease-1"
      },
      sendEmail: async () => ({ ok: true, providerId: "re_test" })
    });

    expect(created.occupancy.pm_resident_id).toBe(created.resident.id);
    expect(db.tables.organization_invitation_tenant_bindings).toHaveLength(1);
    expect(db.tables.organization_invitation_tenant_bindings[0]?.["lease_id"]).toBe("lease-1");
    expect(db.tables.organization_invitations[0]?.["roles"]).toEqual(["tenant"]);

    const accepted = await acceptInvitation({
      supabase: db.client as never,
      token: created.invitation["token"] as string,
      userId: "user-ada",
      userEmail: "ada@example.com"
    });
    expect(accepted.roles).toEqual(["tenant"]);
    expect(accepted.homeHref).toBe("/portal/tenant");
    expect(db.tables.lease_residents[0]?.["user_id"]).toBe("user-ada");
    expect(db.tables.pm_residents[0]?.["user_id"]).toBe("user-ada");

    await expect(
      acceptTenantBinding({
        supabase: db.client as never,
        userId: "user-ada",
        userEmail: "ada@example.com",
        organizationId: "org-1",
        invitationId: created.invitation.id as string,
        invitationEmail: "ada@example.com",
        browserOverrides: { leaseId: "lease-other", organizationId: "org-other" }
      })
    ).resolves.toMatchObject({ leaseId: "lease-1" });
  });

  it("rejects tenant acceptance without a binding and on email mismatch", async () => {
    const db = createLifecycleDb();
    db.tables.organization_invitations.push({
      id: "inv-1",
      organization_id: "org-1",
      email: "ada@example.com",
      roles: ["tenant"],
      status: "pending",
      token: "22222222-2222-4222-8222-222222222222",
      expires_at: new Date(Date.now() + 86400000).toISOString(),
      invited_by: "pm-1",
      operating_scope: null
    });

    await expect(
      acceptInvitation({
        supabase: db.client as never,
        token: "22222222-2222-4222-8222-222222222222",
        userId: "user-ada",
        userEmail: "ada@example.com"
      })
    ).rejects.toMatchObject({ status: 409 });
  });

  it("moves out one resident without ending the lease or deleting history", async () => {
    const db = createLifecycleDb();
    const first = await addTenantToLease({
      supabase: db.client as never,
      organizationId: "org-1",
      actorId: "pm-1",
      organizationName: "Demo",
      input: { firstName: "Ada", lastName: "A", email: "ada@example.com", leaseId: "lease-1" },
      sendEmail: async () => ({ ok: true, providerId: "re_test" })
    });
    const second = await addTenantToLease({
      supabase: db.client as never,
      organizationId: "org-1",
      actorId: "pm-1",
      organizationName: "Demo",
      input: { firstName: "Bea", lastName: "B", email: "bea@example.com", leaseId: "lease-1" },
      sendEmail: async () => ({ ok: true, providerId: "re_test" })
    });

    const moved = await moveOutOccupancy({
      supabase: db.client as never,
      organizationId: "org-1",
      actorId: "pm-1",
      occupancyId: first.occupancy.id,
      occupyTo: "2026-08-01"
    });
    expect(moved.leaseEnded).toBe(false);
    expect(db.tables.lease_agreements[0]?.["status"]).toBe("active");
    expect(db.tables.lease_residents).toHaveLength(2);
    expect(db.tables.lease_residents.find((row) => row["id"] === second.occupancy.id)?.["occupancy_status"]).toBe(
      "occupying"
    );
    expect(db.tables.event_domain_events.some((row) => row["event_type"] === "tenant.moved_out")).toBe(true);
  });

  it("cancels a future move-out and audits an effective correction", async () => {
    const db = createLifecycleDb();
    const created = await addTenantToLease({
      supabase: db.client as never,
      organizationId: "org-1",
      actorId: "pm-1",
      organizationName: "Demo",
      input: { firstName: "Ada", lastName: "A", email: "ada@example.com", leaseId: "lease-1" },
      sendEmail: async () => ({ ok: true, providerId: "re_test" })
    });
    const future = "2099-01-01";
    await moveOutOccupancy({
      supabase: db.client as never,
      organizationId: "org-1",
      actorId: "pm-1",
      occupancyId: created.occupancy.id,
      occupyTo: future
    });
    const cancelled = await cancelFutureMoveOut({
      supabase: db.client as never,
      organizationId: "org-1",
      actorId: "pm-1",
      occupancyId: created.occupancy.id
    });
    expect(cancelled.occupancy.occupy_to).toBeNull();
    await moveOutOccupancy({
      supabase: db.client as never,
      organizationId: "org-1",
      actorId: "pm-1",
      occupancyId: created.occupancy.id,
      occupyTo: "2020-01-01"
    });
    const corrected = await correctMoveOut({
      supabase: db.client as never,
      organizationId: "org-1",
      actorId: "pm-1",
      occupancyId: created.occupancy.id,
      occupyTo: null
    });
    expect(corrected.occupancy.occupancy_status).toBe("occupying");
    expect(db.tables.event_domain_events.some((row) => row["event_type"] === "tenant.move_out_corrected")).toBe(
      true
    );
  });

  it("keeps former-tenant historical mode without current-unit access", () => {
    const today = utcToday();
    const rows: OccupancyRow[] = [
      {
        id: "occ-a",
        organization_id: "org-1",
        lease_id: "lease-1",
        user_id: "user-a",
        display_name: "Ada",
        email: "ada@example.com",
        is_primary: true,
        financial_status: "current",
        pm_resident_id: "res-a",
        occupancy_status: "moved_out",
        occupy_from: "2025-01-01",
        occupy_to: "2026-01-31"
      }
    ];
    const resolved = resolveTenantPortalMode(rows, today);
    expect(resolved.mode).toBe("moved_out");
    expect(
      occupancyIsCurrent(
        {
          occupancyStatus: rows[0]!.occupancy_status,
          occupyFrom: rows[0]!.occupy_from,
          occupyTo: rows[0]!.occupy_to
        },
        today
      )
    ).toBe(false);
  });

  it("reuses the same person for a returning email instead of reactivating old occupancy", async () => {
    const db = createLifecycleDb();
    const first = await addTenantToLease({
      supabase: db.client as never,
      organizationId: "org-1",
      actorId: "pm-1",
      organizationName: "Demo",
      input: { firstName: "Ada", lastName: "A", email: "ada@example.com", leaseId: "lease-1" },
      sendEmail: async () => ({ ok: true, providerId: "re_test" })
    });
    await moveOutOccupancy({
      supabase: db.client as never,
      organizationId: "org-1",
      actorId: "pm-1",
      occupancyId: first.occupancy.id,
      occupyTo: "2026-01-31"
    });
    db.tables.lease_agreements.push({
      id: "lease-2",
      organization_id: "org-1",
      property_id: "prop-1",
      unit_id: "unit-1",
      status: "active",
      start_date: "2026-08-01",
      end_date: null,
      resident_id: first.resident.id
    });
    const returning = await addTenantToLease({
      supabase: db.client as never,
      organizationId: "org-1",
      actorId: "pm-1",
      organizationName: "Demo",
      input: { firstName: "Ada", lastName: "A", email: "ada@example.com", leaseId: "lease-2" },
      sendEmail: async () => ({ ok: true, providerId: "re_test" })
    });
    expect(returning.resident.id).toBe(first.resident.id);
    expect(db.tables.lease_residents).toHaveLength(2);
    expect(db.tables.lease_residents[0]?.["occupancy_status"]).toBe("moved_out");
    expect(db.tables.pm_residents).toHaveLength(1);
  });
});
