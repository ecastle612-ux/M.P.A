import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * MA-8 authorization matrix for primary Command Center inspect APIs.
 * Non-operators (PM/FO/customer/forged role) must never reach loaders.
 */

const getUser = vi.fn();
const isPlatformOperatorUser = vi.fn();

const loaders = {
  loadPlatformErrorsList: vi.fn(async () => ({
    errors: [],
    degraded: false,
    rangeLabel: "24h",
    resolutionLimitation: "deferred",
    filters: { severity: "all", range: "24h" }
  })),
  loadMa2OrganizationDetail: vi.fn(async () => ({ id: "org_a" })),
  loadMa3UsersDirectory: vi.fn(async () => ({
    users: [],
    memberships: [],
    totals: {},
    degraded: []
  })),
  loadMa3AuditDirectory: vi.fn(async () => ({ events: [], degraded: [] })),
  loadMa4SubscriptionsDirectory: vi.fn(async () => ({
    rows: [],
    filters: {},
    pagination: {},
    totals: {},
    degraded: []
  })),
  loadMa4CapacityDirectory: vi.fn(async () => ({
    rows: [],
    filters: {},
    pagination: {},
    totals: {},
    degraded: []
  })),
  loadMa5CheckoutDirectory: vi.fn(async () => ({
    rows: [],
    filters: {},
    pagination: {},
    totals: {},
    degraded: []
  })),
  loadMa5WebhookDirectory: vi.fn(async () => ({
    rows: [],
    filters: {},
    pagination: {},
    totals: {},
    degraded: []
  })),
  loadMa6OperationsSnapshot: vi.fn(async () => ({
    overview: {},
    organizations: [],
    workOrders: [],
    properties: [],
    units: [],
    vendors: [],
    notifications: [],
    anomalies: [],
    filters: { page: 1, pageSize: 50 },
    pagination: { page: 1, pageSize: 50, total: 0, totalPages: 1, hasMore: false },
    degraded: [],
    limitations: []
  }))
};

vi.mock("../../../lib/auth/server", () => ({
  createAuthServerClient: async () => ({ auth: { getUser } })
}));
vi.mock("../../../lib/commercial/server", () => ({
  isPlatformOperatorUser: (...args: unknown[]) => isPlatformOperatorUser(...args)
}));
vi.mock("../../../lib/admin/load-platform-errors", () => ({
  loadPlatformErrorsList: (...a: unknown[]) =>
    (loaders.loadPlatformErrorsList as (...args: unknown[]) => unknown)(...a)
}));
vi.mock("../../../lib/admin/load-ma2-org-detail", () => ({
  loadMa2OrganizationDetail: (...a: unknown[]) =>
    (loaders.loadMa2OrganizationDetail as (...args: unknown[]) => unknown)(...a)
}));
vi.mock("../../../lib/admin/load-ma3-users", () => ({
  loadMa3UsersDirectory: (...a: unknown[]) =>
    (loaders.loadMa3UsersDirectory as (...args: unknown[]) => unknown)(...a)
}));
vi.mock("../../../lib/admin/load-ma3-audit", () => ({
  loadMa3AuditDirectory: (...a: unknown[]) =>
    (loaders.loadMa3AuditDirectory as (...args: unknown[]) => unknown)(...a)
}));
vi.mock("../../../lib/admin/load-ma4-subscriptions", () => ({
  loadMa4SubscriptionsDirectory: (...a: unknown[]) =>
    (loaders.loadMa4SubscriptionsDirectory as (...args: unknown[]) => unknown)(...a)
}));
vi.mock("../../../lib/admin/load-ma4-capacity", () => ({
  loadMa4CapacityDirectory: (...a: unknown[]) =>
    (loaders.loadMa4CapacityDirectory as (...args: unknown[]) => unknown)(...a)
}));
vi.mock("../../../lib/admin/load-ma5-checkout", () => ({
  loadMa5CheckoutDirectory: (...a: unknown[]) =>
    (loaders.loadMa5CheckoutDirectory as (...args: unknown[]) => unknown)(...a)
}));
vi.mock("../../../lib/admin/load-ma5-webhooks", () => ({
  loadMa5WebhookDirectory: (...a: unknown[]) =>
    (loaders.loadMa5WebhookDirectory as (...args: unknown[]) => unknown)(...a)
}));
vi.mock("../../../lib/admin/load-ma6-operations", () => ({
  loadMa6OperationsSnapshot: (...a: unknown[]) =>
    (loaders.loadMa6OperationsSnapshot as (...args: unknown[]) => unknown)(...a)
}));

import { GET as getErrors } from "./errors/route";
import { GET as getOrgDetail } from "./organizations/[orgId]/route";
import { GET as getUsers } from "./users/route";
import { GET as getAudit } from "./audit/route";
import { GET as getSubscriptions } from "./subscriptions/route";
import { GET as getCapacity } from "./capacity/route";
import { GET as getCheckout } from "./checkout/route";
import { GET as getWebhooks } from "./webhooks/route";
import { GET as getOperations } from "./operations/route";

type RouteCase = {
  name: string;
  loaderKey: keyof typeof loaders;
  call: () => Promise<Response>;
};

const CASES: RouteCase[] = [
  {
    name: "errors",
    loaderKey: "loadPlatformErrorsList",
    call: () => getErrors(new Request("http://localhost/api/admin/errors"))
  },
  {
    name: "org-detail",
    loaderKey: "loadMa2OrganizationDetail",
    call: () =>
      getOrgDetail(new Request("http://localhost/api/admin/organizations/org_b"), {
        params: Promise.resolve({ orgId: "org_b" })
      })
  },
  {
    name: "users",
    loaderKey: "loadMa3UsersDirectory",
    call: () => getUsers(new Request("http://localhost/api/admin/users?organizationId=org_b"))
  },
  {
    name: "audit",
    loaderKey: "loadMa3AuditDirectory",
    call: () => getAudit(new Request("http://localhost/api/admin/audit?organizationId=org_b"))
  },
  {
    name: "subscriptions",
    loaderKey: "loadMa4SubscriptionsDirectory",
    call: () =>
      getSubscriptions(new Request("http://localhost/api/admin/subscriptions?organizationId=org_b"))
  },
  {
    name: "capacity",
    loaderKey: "loadMa4CapacityDirectory",
    call: () => getCapacity(new Request("http://localhost/api/admin/capacity?organizationId=org_b"))
  },
  {
    name: "checkout",
    loaderKey: "loadMa5CheckoutDirectory",
    call: () => getCheckout(new Request("http://localhost/api/admin/checkout?organizationId=org_b"))
  },
  {
    name: "webhooks",
    loaderKey: "loadMa5WebhookDirectory",
    call: () => getWebhooks(new Request("http://localhost/api/admin/webhooks?organizationId=org_b"))
  },
  {
    name: "operations",
    loaderKey: "loadMa6OperationsSnapshot",
    call: () =>
      getOperations(new Request("http://localhost/api/admin/operations?organizationId=org_b"))
  }
];

describe("MA-8 authz matrix — primary MA inspect APIs", () => {
  beforeEach(() => {
    getUser.mockReset();
    isPlatformOperatorUser.mockReset();
    for (const fn of Object.values(loaders)) fn.mockClear();
  });

  it.each(CASES)("$name rejects unauthenticated (401)", async (c) => {
    getUser.mockResolvedValue({ data: { user: null } });
    const res = await c.call();
    expect(res.status).toBe(401);
    expect(loaders[c.loaderKey]).not.toHaveBeenCalled();
  });

  it.each(CASES)("$name rejects PM/FO/customer/forged role (403)", async (c) => {
    getUser.mockResolvedValue({
      data: { user: { id: "pm1", app_metadata: { role: "admin", platform_operator: false } } }
    });
    isPlatformOperatorUser.mockResolvedValue(false);
    const res = await c.call();
    expect(res.status).toBe(403);
    expect(loaders[c.loaderKey]).not.toHaveBeenCalled();
  });

  it.each(CASES)("$name rejects forged organization query without operator gate (403)", async (c) => {
    getUser.mockResolvedValue({ data: { user: { id: "u_org_a" } } });
    isPlatformOperatorUser.mockResolvedValue(false);
    const res = await c.call();
    expect(res.status).toBe(403);
    expect(loaders[c.loaderKey]).not.toHaveBeenCalled();
  });

  it.each(CASES)("$name allows Master Admin operator (200)", async (c) => {
    getUser.mockResolvedValue({ data: { user: { id: "op1" } } });
    isPlatformOperatorUser.mockResolvedValue(true);
    const res = await c.call();
    expect(res.status).toBe(200);
    expect(loaders[c.loaderKey]).toHaveBeenCalled();
  });
});
