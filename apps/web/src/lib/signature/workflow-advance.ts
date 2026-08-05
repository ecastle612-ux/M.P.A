/**
 * SIGN-002 Slice A — advance originating business records after vault sync.
 * Reuses existing lease/lifecycle rules; does not duplicate status machines.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@mpa/supabase";
import type { SignaturePackageRecord } from "./contracts";

type Client = SupabaseClient<Database>;

function workflowKind(pkg: SignaturePackageRecord): string | null {
  const kind = pkg.metadata["kind"];
  return typeof kind === "string" ? kind : null;
}

export async function advanceBusinessWorkflowAfterSignature(input: {
  organizationId: string;
  package: SignaturePackageRecord;
  actorUserId: string;
  client: Client;
}): Promise<{ advanced: string[] }> {
  const { organizationId, actorUserId, client } = input;
  const pkg = input.package;
  const advanced: string[] = [];
  const kind = workflowKind(pkg);
  const now = new Date().toISOString();

  // A1 — Lease Agreement: already marked signed in syncVaultAndActivate; ensure signed_at.
  if (pkg.documentType === "lease_agreement" && pkg.leaseId) {
    await client
      .from("leases")
      .update({
        status: "signed",
        signed_at: now,
        updated_by: actorUserId,
        updated_at: now
      })
      .eq("id", pkg.leaseId)
      .eq("organization_id", organizationId)
      .in("status", ["draft", "signed"]);
    advanced.push("lease.executed");

    // CORE-004 Phase 3 — advance canonical leasing lifecycle (SignWell only).
    try {
      const { advanceLeasingAfterSignWell } = await import("../lease/workflow-server");
      await advanceLeasingAfterSignWell({
        organizationId,
        leaseId: pkg.leaseId,
        actorUserId,
        client: client as never
      });
      advanced.push("leasing.signwell_completed");
    } catch {
      /* workflow advance optional if migration not applied */
    }
  }

  // A2 — Lease Renewal: apply renewal dates using existing renew semantics.
  if (pkg.documentType === "lease_renewal" && pkg.leaseId) {
    const { data: lease } = await client
      .from("leases")
      .select("id, end_date, status, renewal_status, metadata")
      .eq("id", pkg.leaseId)
      .eq("organization_id", organizationId)
      .maybeSingle();
    if (lease) {
      const end = lease.end_date ? new Date(`${lease.end_date}T00:00:00.000Z`) : new Date();
      const extensionMonths = Number(pkg.metadata["extensionMonths"] ?? 12);
      end.setUTCMonth(end.getUTCMonth() + (Number.isFinite(extensionMonths) ? extensionMonths : 12));
      const nextEnd = end.toISOString().slice(0, 10);
      const existingMeta =
        lease.metadata && typeof lease.metadata === "object" && !Array.isArray(lease.metadata)
          ? { ...(lease.metadata as Record<string, unknown>) }
          : {};
      await client
        .from("leases")
        .update({
          end_date: nextEnd,
          renewal_status: "renewed",
          status: lease.status === "draft" ? "signed" : lease.status,
          updated_by: actorUserId,
          updated_at: now,
          metadata: {
            ...existingMeta,
            renewalSignaturePackageId: pkg.id,
            renewalCompletedAt: now
          } as Json
        })
        .eq("id", pkg.leaseId)
        .eq("organization_id", organizationId);
      advanced.push("lease.renewed");
    }
  }

  // A3 — Owner Management Agreement → property metadata.
  if (pkg.documentType === "owner_agreement" && pkg.propertyId) {
    const { data: property } = await client
      .from("properties")
      .select("id, metadata")
      .eq("id", pkg.propertyId)
      .eq("organization_id", organizationId)
      .maybeSingle();
    if (property) {
      const metadata =
        property.metadata && typeof property.metadata === "object" && !Array.isArray(property.metadata)
          ? { ...(property.metadata as Record<string, unknown>) }
          : {};
      metadata["ownerAgreementExecutedAt"] = now;
      metadata["ownerAgreementPackageId"] = pkg.id;
      metadata["ownerAgreementStatus"] = "executed";
      await client
        .from("properties")
        .update({ metadata: metadata as Json, updated_at: now })
        .eq("id", pkg.propertyId)
        .eq("organization_id", organizationId);
      advanced.push("owner.agreement_executed");
    }
  }

  // A4 — Move-In Acknowledgement
  if (pkg.documentType === "move_in_form" && pkg.leaseId) {
    await patchLeaseMetadata(client, organizationId, pkg.leaseId, {
      moveInAcknowledgementCompletedAt: now,
      moveInAcknowledgementPackageId: pkg.id
    }, actorUserId);
    if (pkg.tenantId) {
      await patchTenantMetadata(client, organizationId, pkg.tenantId, {
        moveInAcknowledgementCompletedAt: now,
        moveInAcknowledgementPackageId: pkg.id
      });
      await finalizePendingMoveIn(client, organizationId, pkg.tenantId, pkg.leaseId, now);
    } else {
      const { data: lease } = await client
        .from("leases")
        .select("primary_tenant_id")
        .eq("id", pkg.leaseId)
        .eq("organization_id", organizationId)
        .maybeSingle();
      const tenantId = lease?.primary_tenant_id as string | null;
      if (tenantId) {
        await patchTenantMetadata(client, organizationId, tenantId, {
          moveInAcknowledgementCompletedAt: now,
          moveInAcknowledgementPackageId: pkg.id
        });
        await finalizePendingMoveIn(client, organizationId, tenantId, pkg.leaseId, now);
      }
    }
    advanced.push("move_in.acknowledgement_completed");
  }

  // A5 — Move-Out Acknowledgement
  if ((pkg.documentType === "general_pdf" && kind === "move_out_ack") || kind === "move_out_ack") {
    if (pkg.leaseId) {
      await patchLeaseMetadata(client, organizationId, pkg.leaseId, {
        moveOutAcknowledgementCompletedAt: now,
        moveOutAcknowledgementPackageId: pkg.id
      }, actorUserId);
    }
    if (pkg.tenantId) {
      await patchTenantMetadata(client, organizationId, pkg.tenantId, {
        moveOutAcknowledgementCompletedAt: now,
        moveOutAcknowledgementPackageId: pkg.id
      });
    } else if (pkg.leaseId) {
      const { data: lease } = await client
        .from("leases")
        .select("primary_tenant_id")
        .eq("id", pkg.leaseId)
        .eq("organization_id", organizationId)
        .maybeSingle();
      const tenantId = lease?.primary_tenant_id as string | null;
      if (tenantId) {
        await patchTenantMetadata(client, organizationId, tenantId, {
          moveOutAcknowledgementCompletedAt: now,
          moveOutAcknowledgementPackageId: pkg.id
        });
      }
    }
    advanced.push("move_out.acknowledgement_completed");
  }

  return { advanced };
}

async function finalizePendingMoveIn(
  client: Client,
  organizationId: string,
  tenantId: string,
  leaseId: string,
  now: string
) {
  const { data: tenant } = await client
    .from("tenants")
    .select("id, metadata, lifecycle_status")
    .eq("id", tenantId)
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (!tenant) return;
  const metadata =
    tenant.metadata && typeof tenant.metadata === "object" && !Array.isArray(tenant.metadata)
      ? { ...(tenant.metadata as Record<string, unknown>) }
      : {};
  if (!metadata["moveInPendingAcknowledgement"] && tenant.lifecycle_status !== "awaiting_signature") {
    return;
  }
  const checklist =
    metadata["moveInChecklist"] && typeof metadata["moveInChecklist"] === "object"
      ? { ...(metadata["moveInChecklist"] as Record<string, unknown>), acknowledgementSigned: true }
      : { acknowledgementSigned: true };
  metadata["moveInPendingAcknowledgement"] = false;
  metadata["moveInCompletedAt"] = metadata["moveInCompletedAt"] ?? now;
  metadata["moveInChecklist"] = checklist;
  metadata["moveInAcknowledgementCompletedAt"] = now;
  await client
    .from("tenants")
    .update({
      lifecycle_status: "active",
      status: "active",
      metadata: metadata as Json,
      updated_at: now
    })
    .eq("id", tenantId)
    .eq("organization_id", organizationId);
  void leaseId;
}

async function patchLeaseMetadata(
  client: Client,
  organizationId: string,
  leaseId: string,
  patch: Record<string, unknown>,
  actorUserId: string
) {
  const { data: lease } = await client
    .from("leases")
    .select("metadata")
    .eq("id", leaseId)
    .eq("organization_id", organizationId)
    .maybeSingle();
  const metadata =
    lease?.metadata && typeof lease.metadata === "object" && !Array.isArray(lease.metadata)
      ? { ...(lease.metadata as Record<string, unknown>) }
      : {};
  Object.assign(metadata, patch);
  await client
    .from("leases")
    .update({ metadata: metadata as Json, updated_by: actorUserId, updated_at: new Date().toISOString() })
    .eq("id", leaseId)
    .eq("organization_id", organizationId);
}

async function patchTenantMetadata(
  client: Client,
  organizationId: string,
  tenantId: string,
  patch: Record<string, unknown>
) {
  const { data: tenant } = await client
    .from("tenants")
    .select("metadata")
    .eq("id", tenantId)
    .eq("organization_id", organizationId)
    .maybeSingle();
  const metadata =
    tenant?.metadata && typeof tenant.metadata === "object" && !Array.isArray(tenant.metadata)
      ? { ...(tenant.metadata as Record<string, unknown>) }
      : {};
  Object.assign(metadata, patch);
  await client
    .from("tenants")
    .update({ metadata: metadata as Json, updated_at: new Date().toISOString() })
    .eq("id", tenantId)
    .eq("organization_id", organizationId);
}
