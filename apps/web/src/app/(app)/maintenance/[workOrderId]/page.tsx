import Link from "next/link";
import { redirect } from "next/navigation";
import { Button, Card } from "@mpa/ui";
import { Breadcrumbs } from "../../../../components/shell/breadcrumbs";
import { MaintenanceActivityTimeline } from "../../../../components/maintenance/activity-timeline";
import { isWorkOrderOverdue, PriorityBadge, StatusBadge } from "../../../../components/maintenance/maintenance-badges";
import { VendorAssignmentPanel } from "../../../../components/vendor/vendor-assignment-panel";
import { createAuthServerComponentClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { toMaintenanceCategoryLabel } from "../../../../lib/maintenance/contracts";
import { getActivityForWorkOrder, getAssigneesForOrganization, getWorkOrderForOrganization } from "../../../../lib/maintenance/server";
import { getVendorAssignmentsForWorkOrder, getVendorsForOrganization } from "../../../../lib/vendor/server";

export default async function WorkOrderDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ workOrderId: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { workOrderId } = await params;
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
  if (!evaluatePermission(authorization, "maintenance:read")) {
    redirect("/unauthorized");
  }

  const canAssignVendor = evaluatePermission(authorization, "vendor:assign");

  const [workOrder, activity, assignees, vendorAssignments, vendors] = await Promise.all([
    getWorkOrderForOrganization(organizationId, workOrderId, supabase),
    getActivityForWorkOrder(organizationId, workOrderId, supabase),
    getAssigneesForOrganization(organizationId, supabase),
    canAssignVendor ? getVendorAssignmentsForWorkOrder(organizationId, workOrderId, supabase) : Promise.resolve([]),
    canAssignVendor ? getVendorsForOrganization(organizationId, { status: "active" }, supabase) : Promise.resolve([])
  ]);

  if (!workOrder) {
    redirect("/maintenance");
  }

  const canUpdate = evaluatePermission(authorization, "maintenance:update");
  const canAssign = evaluatePermission(authorization, "maintenance:assign");
  const overdue = isWorkOrderOverdue(workOrder.dueDate, workOrder.status);
  const currentVendorAssignment = vendorAssignments.find((entry) => entry.isCurrent) ?? null;
  const vendorOptions = vendors.map((vendor) => ({
    id: vendor.id,
    businessName: vendor.businessName,
    preferredVendor: vendor.preferredVendor
  }));
  const assigneeLabel =
    assignees.find((assignee) => assignee.userId === workOrder.assignedToUserId)?.label ?? "Unassigned";

  return (
    <main className="mpa-page flex-1 space-y-5">
      <Breadcrumbs
        items={[
          { href: "/dashboard", label: "Dashboard" },
          { href: "/maintenance", label: "Maintenance" },
          { label: workOrder.workOrderNumber }
        ]}
      />

      {from === "work-order-created" ? (
        <Card className="border-[var(--mpa-color-brand-primary)] bg-[var(--mpa-color-bg-surface-muted)]">
          <p className="text-sm text-[var(--mpa-color-text-primary)]">
            Work order created. Assign internal staff and track progress from this detail view.
          </p>
        </Card>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <Card className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
                {workOrder.workOrderNumber}
              </p>
              <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">{workOrder.title}</h1>
              <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
                {toMaintenanceCategoryLabel(workOrder.category)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <PriorityBadge priority={workOrder.priority} />
              <StatusBadge status={workOrder.status} />
            </div>
          </div>

          {workOrder.description ? (
            <p className="text-sm text-[var(--mpa-color-text-secondary)]">{workOrder.description}</p>
          ) : null}

          <div className="grid gap-2 text-sm text-[var(--mpa-color-text-secondary)] md:grid-cols-2">
            <p>
              Property:{" "}
              <Link href={`/properties/${workOrder.propertyId}`} className="font-medium text-[var(--mpa-color-brand-primary)]">
                {workOrder.propertyName ?? workOrder.propertyId}
              </Link>
            </p>
            <p>
              Unit:{" "}
              {workOrder.unitId ? (
                <Link href={`/units/${workOrder.unitId}`} className="font-medium text-[var(--mpa-color-brand-primary)]">
                  {workOrder.unitNumber ? `Unit ${workOrder.unitNumber}` : workOrder.unitId}
                </Link>
              ) : (
                "Not assigned"
              )}
            </p>
            <p>
              Tenant:{" "}
              {workOrder.tenantId ? (
                <Link href={`/tenants/${workOrder.tenantId}`} className="font-medium text-[var(--mpa-color-brand-primary)]">
                  {workOrder.tenantName ?? workOrder.tenantId}
                </Link>
              ) : (
                "Not linked"
              )}
            </p>
            <p className={overdue ? "font-medium text-red-700" : ""}>Due date: {workOrder.dueDate ?? "—"}</p>
            <p>Assigned staff: {workOrder.assignedToUserId ? assigneeLabel : "Unassigned"}</p>
            <p>Completed: {workOrder.completedAt ? new Date(workOrder.completedAt).toLocaleString() : "—"}</p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-md border border-[var(--mpa-color-border-subtle)] p-3">
              <h2 className="text-sm font-medium text-[var(--mpa-color-text-primary)]">Internal notes</h2>
              <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
                {workOrder.internalNotes ?? "No internal notes."}
              </p>
            </div>
            <div className="rounded-md border border-[var(--mpa-color-border-subtle)] p-3">
              <h2 className="text-sm font-medium text-[var(--mpa-color-text-primary)]">Tenant notes</h2>
              <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
                {workOrder.tenantNotes ?? "No tenant notes."}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {canUpdate || canAssign ? (
              <Link href={`/maintenance/${workOrder.id}/edit`}>
                <Button>Edit Work Order</Button>
              </Link>
            ) : null}
            <Link href="/maintenance">
              <Button variant="ghost">Back to Maintenance</Button>
            </Link>
          </div>
        </Card>

        <div className="space-y-4">
          {canAssignVendor ? (
            <VendorAssignmentPanel
              workOrderId={workOrder.id}
              vendors={vendorOptions}
              initialAssignments={vendorAssignments}
              initialCurrentAssignment={currentVendorAssignment}
            />
          ) : null}

          <Card className="space-y-3">
            <h2 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">Future modules</h2>
            <PlaceholderBlock label="Photos" value={workOrder.photoPlaceholder} />
            <PlaceholderBlock label="Documents" value={workOrder.documentPlaceholder} />
            <PlaceholderBlock label="Recurring maintenance" value={workOrder.recurringMaintenancePlaceholder} />
            <PlaceholderBlock label="Preventive maintenance" value={workOrder.preventiveMaintenancePlaceholder} />
          </Card>

          <Card className="space-y-3">
            <h2 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">Activity history</h2>
            <MaintenanceActivityTimeline events={activity} />
          </Card>
        </div>
      </section>
    </main>
  );
}

function PlaceholderBlock({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="rounded-md border border-dashed border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface-muted)] p-3">
      <p className="text-xs uppercase tracking-wide text-[var(--mpa-color-text-muted)]">{label}</p>
      <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">{value ?? "Reserved for a future phase."}</p>
    </div>
  );
}
