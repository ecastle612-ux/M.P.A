import { beforeEach, describe, expect, it, vi } from "vitest";
import { ORGANIZATION_DISABLED_ONLINE_PAYMENTS } from "@mpa/shared";

const state = {
  settings: [] as Array<{ id: string; organization_id: string; stripe_payment_execution_enabled: boolean }>,
  connect: null as Record<string, unknown> | null,
  enrollments: [] as Array<Record<string, unknown>>,
  audits: [] as Array<Record<string, unknown>>
};

function table(name: string) {
  const rows =
    name === "financial_module_settings"
      ? state.settings
      : name === "financial_connect_accounts"
        ? state.connect
          ? [state.connect]
          : []
        : name === "financial_autopay_enrollments"
          ? state.enrollments
          : name === "audit_events"
            ? state.audits
            : name === "event_domain_events"
              ? []
              : name === "financial_notifications"
                ? []
                : name === "lease_residents"
                  ? []
                  : [];

  const filters: Array<(row: Record<string, unknown>) => boolean> = [];
  const api = {
    select: () => api,
    insert: (row: Record<string, unknown>) => {
      if (name === "financial_module_settings") {
        state.settings.push({
          id: "set_1",
          organization_id: row["organization_id"] as string,
          stripe_payment_execution_enabled: row["stripe_payment_execution_enabled"] === true
        });
      }
      if (name === "audit_events") {
        state.audits.push(row);
      }
      return {
        select: () => ({
          single: async () => ({ data: row, error: null })
        })
      };
    },
    update: (patch: Record<string, unknown>) => {
      const apply = () => {
        if (name === "financial_module_settings") {
          state.settings = state.settings.map((row) =>
            filters.every((filter) => filter(row)) ? { ...row, ...patch } : row
          );
        }
        if (name === "financial_autopay_enrollments") {
          state.enrollments = state.enrollments.map((row) =>
            filters.every((filter) => filter(row)) ? { ...row, ...patch } : row
          );
        }
        const current =
          name === "financial_module_settings"
            ? state.settings[0]
            : name === "financial_autopay_enrollments"
              ? state.enrollments.find((row) => filters.every((filter) => filter(row)))
              : null;
        return current;
      };
      const result = () => ({ data: apply(), error: null });
      const chain = {
        eq: (column: string, value: unknown) => {
          filters.push((row) => row[column] === value);
          return chain;
        },
        select: () => ({
          single: async () => result()
        }),
        then: (resolve: (value: { data: unknown; error: null }) => void) => resolve(result())
      };
      return chain;
    },
    eq: (column: string, value: unknown) => {
      filters.push((row) => row[column] === value);
      return api;
    },
    maybeSingle: async () => {
      const list = Array.isArray(rows) ? rows : [];
      const found = list.find((row) => filters.every((filter) => filter(row as Record<string, unknown>)));
      return { data: found ?? null, error: null };
    },
    then: (resolve: (value: { data: unknown; error: null }) => void) => {
      const list = (Array.isArray(rows) ? rows : []).filter((row) =>
        filters.every((filter) => filter(row as Record<string, unknown>))
      );
      resolve({ data: list, error: null });
    }
  };
  return api;
}

vi.mock("./connect-service", async () => {
  const actual = await vi.importActual<typeof import("./connect-service")>("./connect-service");
  return {
    ...actual,
    loadConnectAccount: async () => state.connect
  };
});

vi.mock("./stripe", () => ({
  getStripeClient: () => null,
  connectedRequestOptions: (id: string) => ({ stripeAccount: id })
}));

import { disableOnlinePayments, enableOnlinePayments } from "./online-payments-service";

describe("docs/194 enable/disable execution", () => {
  beforeEach(() => {
    state.settings = [
      { id: "set_1", organization_id: "org_a", stripe_payment_execution_enabled: false }
    ];
    state.connect = {
      id: "conn_1",
      organization_id: "org_a",
      stripe_account_id: "acct_ready",
      status: "ready",
      charges_enabled: true
    };
    state.enrollments = [
      {
        id: "en_1",
        organization_id: "org_a",
        lease_id: "lease_1",
        resident_id: "res_1",
        status: "active",
        paused_reason: null,
        consent_version: "docs-188-v1"
      }
    ];
    state.audits = [];
  });

  const db = { from: (name: string) => table(name) };

  it("refuses enable when Connect is not ready", async () => {
    state.connect = {
      organization_id: "org_a",
      stripe_account_id: "acct_1",
      status: "pending",
      charges_enabled: false
    };
    await expect(
      enableOnlinePayments(db as never, { organizationId: "org_a", actorId: "user_1" })
    ).rejects.toThrow("connect_not_ready");
    expect(state.settings[0]?.stripe_payment_execution_enabled).toBe(false);
  });

  it("enables only the requested organization", async () => {
    state.enrollments = [];
    await enableOnlinePayments(db as never, { organizationId: "org_a", actorId: "user_1" });
    expect(state.settings[0]?.stripe_payment_execution_enabled).toBe(true);
    expect(state.settings.every((row) => row.organization_id === "org_a")).toBe(true);
  });

  it("disables execution and pauses active AutoPay without revoke", async () => {
    state.settings[0]!.stripe_payment_execution_enabled = true;
    await disableOnlinePayments(db as never, { organizationId: "org_a", actorId: "user_1" });
    expect(state.settings[0]?.stripe_payment_execution_enabled).toBe(false);
    expect(state.enrollments[0]?.["status"]).toBe("paused");
    expect(state.enrollments[0]?.["paused_reason"]).toBe(ORGANIZATION_DISABLED_ONLINE_PAYMENTS);
    expect(state.enrollments[0]?.["revoked_at"]).toBeUndefined();
  });
});
