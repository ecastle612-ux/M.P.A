import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, Button, Card, DetailHero, DetailMetric } from "@mpa/ui";
import { DetailPageLayout } from "../../../../components/presentation/detail-page-layout";
import { EntityRelationshipChain } from "../../../../components/presentation/entity-relationship-chain";
import { VendorContextRail } from "../../../../components/presentation/context-rails/vendor-context-rail";
import { WorkflowSuccessBanner } from "../../../../components/workflow/workflow-success-banner";
import { createAuthServerComponentClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { toVendorServiceLabel, toVendorStatusLabel } from "../../../../lib/vendor/contracts";
import {
  getVendorAssignmentsForVendor,
  getVendorForOrganization,
  getVendorPerformanceSummary
} from "../../../../lib/vendor/server";
import { buildVendorCreatedSuccess } from "../../../../lib/workflow/shared/success-configs";

export default async function VendorDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ vendorId: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { vendorId } = await params;
  const { from } = await searchParams;
  const supabase = await createAuthServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const organizationId = await resolveActiveOrganizationIdForUser(user.id);
  if (!organizationId) {
    redirect("/dashboard");
  }

  const authorization = await resolveAuthorizationContext(user, organizationId);
  if (!evaluatePermission(authorization, "vendor:read")) {
    redirect("/unauthorized");
  }

  const [vendor, performance, assignments] = await Promise.all([
    getVendorForOrganization(organizationId, vendorId, supabase),
    getVendorPerformanceSummary(organizationId, vendorId, supabase),
    getVendorAssignmentsForVendor(organizationId, vendorId, supabase)
  ]);

  if (!vendor) {
    redirect("/vendors");
  }

  const canUpdate = evaluatePermission(authorization, "vendor:update");

  const workOrderIds = assignments.map((entry) => entry.workOrderId);
  const { data: workOrderRows } =
    workOrderIds.length > 0
      ? await supabase
          .from("maintenance_work_orders")
          .select("id, work_order_number, title")
          .eq("organization_id", organizationId)
          .in("id", workOrderIds)
      : { data: [] };

  const workOrderMap = new Map(
    ((workOrderRows ?? []) as Array<{ id: string; work_order_number: string; title: string }>).map((row) => [
      row.id,
      row
    ])
  );

  const enrichedAssignments = assignments.map((entry) => {
    const workOrder = workOrderMap.get(entry.workOrderId);
    return {
      id: entry.id,
      workOrderId: entry.workOrderId,
      assignmentStatus: entry.assignmentStatus,
      assignedAt: entry.assignedAt,
      workOrderNumber: workOrder?.work_order_number,
      workOrderTitle: workOrder?.title
    };
  });

  const openJobs = assignments.filter(
    (entry) => entry.isCurrent && entry.assignmentStatus !== "completed" && entry.assignmentStatus !== "cancelled"
  ).length;

  const recentActivity = enrichedAssignments.slice(0, 5).map((entry) => ({
    id: entry.id,
    label: entry.workOrderNumber ?? "Work order",
    detail: entry.workOrderTitle ?? entry.assignmentStatus,
    at: new Date(entry.assignedAt).toLocaleString()
  }));

  const vendorSuccess =
    from === "vendor-created"
      ? buildVendorCreatedSuccess({
          id: vendor.id,
          businessName: vendor.businessName,
          assignmentCount: assignments.length
        })
      : null;

  return (
    <DetailPageLayout
      breadcrumbs={[
        { href: "/dashboard", label: "Dashboard" },
        { href: "/vendors", label: "Vendors" },
        { label: vendor.businessName }
      ]}
      banner={vendorSuccess ? <WorkflowSuccessBanner dismissPath={`/vendors/${vendorId}`} {...vendorSuccess} /> : null}
      relationshipChain={
        <EntityRelationshipChain
          links={[
            { href: "/vendors", label: "Vendors" },
            { label: vendor.businessName },
            { label: `${performance.totalAssignments} assignments` }
          ]}
        />
      }
      hero={
        <DetailHero
          title={vendor.businessName}
          subtitle={vendor.primaryContactName ?? "No primary contact"}
          badges={
            <>
              <Badge
                variant={vendor.status === "active" ? "success" : vendor.status === "archived" ? "warning" : "info"}
              >
                {toVendorStatusLabel(vendor.status)}
              </Badge>
              {vendor.preferredVendor ? <Badge variant="success">Preferred</Badge> : null}
            </>
          }
          metrics={
            <>
              <DetailMetric label="Rating" value={vendor.rating !== null ? `${vendor.rating.toFixed(1)} / 5` : "—"} />
              <DetailMetric label="Total assignments" value={performance.totalAssignments.toString()} />
              <DetailMetric label="Completed" value={performance.completedAssignments.toString()} />
              <DetailMetric
                label="Completion rate"
                value={performance.completionRate !== null ? `${performance.completionRate}%` : "—"}
              />
              <DetailMetric label="Insurance expires" value={vendor.insuranceExpiration ?? "—"} />
            </>
          }
          actions={
            <>
              {canUpdate ? (
                <Link href={`/vendors/${vendor.id}/edit`}>
                  <Button>Edit Vendor</Button>
                </Link>
              ) : null}
              <Link href="/vendors">
                <Button variant="ghost">Back to Vendors</Button>
              </Link>
            </>
          }
        />
      }
      main={
        <Card variant="elevated" className="space-y-4">
          <h2 className="mpa-section-title">Vendor profile</h2>
          <div className="grid gap-2 text-sm text-[var(--mpa-color-text-secondary)] md:grid-cols-2 lg:grid-cols-3">
            <p>Email: {vendor.email ?? "—"}</p>
            <p>Phone: {vendor.phone ?? "—"}</p>
            <p>Website: {vendor.website ?? "—"}</p>
            <p>License: {vendor.licenseNumber ?? "—"}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-[var(--mpa-color-text-primary)]">Services</h3>
            <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
              {vendor.services.length > 0 ? vendor.services.map(toVendorServiceLabel).join(", ") : "No services listed."}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-[var(--mpa-color-text-primary)]">Address</h3>
            <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
              {[vendor.addressLine1, vendor.addressLine2, vendor.city, vendor.stateRegion, vendor.postalCode]
                .filter(Boolean)
                .join(", ") || "No address on file."}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-[var(--mpa-color-text-primary)]">Internal notes</h3>
            <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
              {vendor.internalNotes ?? "No internal notes."}
            </p>
          </div>
        </Card>
      }
      contextRail={
        <VendorContextRail
          rating={vendor.rating}
          performance={performance}
          openJobs={openJobs}
          assignments={enrichedAssignments}
          recentActivity={recentActivity}
        />
      }
    />
  );
}
