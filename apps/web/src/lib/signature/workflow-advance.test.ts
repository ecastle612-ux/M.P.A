import { describe, expect, it } from "vitest";
import { advanceBusinessWorkflowAfterSignature } from "./workflow-advance";
import type { SignaturePackageRecord } from "./contracts";

function basePackage(overrides: Partial<SignaturePackageRecord> = {}): SignaturePackageRecord {
  return {
    id: "pkg-1",
    organizationId: "org-1",
    applicantId: null,
    leaseId: "lease-1",
    propertyId: "prop-1",
    unitId: null,
    tenantId: "tenant-1",
    screeningCaseId: null,
    packageNumber: "SIG-00001",
    provider: "noop",
    documentType: "lease_agreement",
    status: "completed",
    orderMode: "sequential",
    subject: null,
    message: null,
    externalReference: "ext-1",
    expiresAt: null,
    sentAt: null,
    completedAt: new Date().toISOString(),
    cancelledAt: null,
    signedAt: null,
    vaultStatus: "synced",
    vaultRetryCount: 0,
    vaultLastError: null,
    residentActivatedAt: null,
    certificateVaultDocumentId: null,
    lastError: null,
    retryCount: 0,
    metadata: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  };
}

function mockClient(handlers: {
  lease?: Record<string, unknown> | null;
  property?: Record<string, unknown> | null;
  tenant?: Record<string, unknown> | null;
}) {
  const updates: Array<{ table: string; payload: Record<string, unknown> }> = [];

  function chain(table: string) {
    const api: Record<string, unknown> = {};
    const resolveSelect = async () => {
      if (table === "leases") return { data: handlers.lease ?? null };
      if (table === "properties") return { data: handlers.property ?? null };
      if (table === "tenants") return { data: handlers.tenant ?? null };
      return { data: null };
    };
    api["select"] = () => api;
    api["eq"] = () => api;
    api["in"] = () => api;
    api["maybeSingle"] = resolveSelect;
    api["update"] = (payload: Record<string, unknown>) => {
      updates.push({ table, payload });
      return api;
    };
    api["then"] = (onFulfilled: (value: unknown) => unknown, onRejected?: (reason: unknown) => unknown) =>
      Promise.resolve({ data: null, error: null }).then(onFulfilled, onRejected);
    return api;
  }

  return {
    from: (table: string) => chain(table),
    _updates: updates
  } as unknown as Parameters<typeof advanceBusinessWorkflowAfterSignature>[0]["client"] & {
    _updates: typeof updates;
  };
}

describe("advanceBusinessWorkflowAfterSignature", () => {
  it("advances lease execution for lease_agreement", async () => {
    const client = mockClient({ lease: { id: "lease-1", status: "draft", metadata: {} } });
    const result = await advanceBusinessWorkflowAfterSignature({
      organizationId: "org-1",
      actorUserId: "user-1",
      package: basePackage({ documentType: "lease_agreement" }),
      client
    });
    expect(result.advanced).toContain("lease.executed");
  });

  it("advances renewal dates for lease_renewal", async () => {
    const client = mockClient({
      lease: {
        id: "lease-1",
        end_date: "2026-12-31",
        status: "active",
        renewal_status: "offered",
        metadata: {}
      }
    });
    const result = await advanceBusinessWorkflowAfterSignature({
      organizationId: "org-1",
      actorUserId: "user-1",
      package: basePackage({
        documentType: "lease_renewal",
        metadata: { extensionMonths: 12 }
      }),
      client
    });
    expect(result.advanced).toContain("lease.renewed");
  });

  it("records owner agreement execution on property", async () => {
    const client = mockClient({ property: { id: "prop-1", metadata: {} } });
    const result = await advanceBusinessWorkflowAfterSignature({
      organizationId: "org-1",
      actorUserId: "user-1",
      package: basePackage({
        documentType: "owner_agreement",
        leaseId: null,
        tenantId: null
      }),
      client
    });
    expect(result.advanced).toContain("owner.agreement_executed");
  });

  it("completes move-in and move-out acknowledgements", async () => {
    const moveInClient = mockClient({
      lease: { id: "lease-1", primary_tenant_id: "tenant-1", metadata: {} },
      tenant: {
        id: "tenant-1",
        metadata: { moveInPendingAcknowledgement: true },
        lifecycle_status: "awaiting_signature"
      }
    });
    const moveIn = await advanceBusinessWorkflowAfterSignature({
      organizationId: "org-1",
      actorUserId: "user-1",
      package: basePackage({ documentType: "move_in_form" }),
      client: moveInClient
    });
    expect(moveIn.advanced).toContain("move_in.acknowledgement_completed");

    const moveOutClient = mockClient({
      lease: { id: "lease-1", primary_tenant_id: "tenant-1", metadata: {} },
      tenant: { id: "tenant-1", metadata: {} }
    });
    const moveOut = await advanceBusinessWorkflowAfterSignature({
      organizationId: "org-1",
      actorUserId: "user-1",
      package: basePackage({
        documentType: "general_pdf",
        metadata: { kind: "move_out_ack" }
      }),
      client: moveOutClient
    });
    expect(moveOut.advanced).toContain("move_out.acknowledgement_completed");
  });
});
