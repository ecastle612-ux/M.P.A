import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, DetailHero, DetailMetric } from "@mpa/ui";
import { AiPageContextBridge } from "../../../../components/ai/ai-page-context";
import { buildAiPageContext } from "../../../../lib/ai/ai-page-context-store";
import { DetailPageLayout } from "../../../../components/presentation/detail-page-layout";
import { DiscloseSection } from "../../../../components/presentation/disclose-section";
import { EntityActionToolbelt } from "../../../../components/presentation/entity-action-toolbelt";
import { EntityRelationshipChain } from "../../../../components/presentation/entity-relationship-chain";
import { MaintenanceContextRail } from "../../../../components/presentation/context-rails/maintenance-context-rail";
import { isWorkOrderOverdue, PriorityBadge, StatusBadge } from "../../../../components/maintenance/maintenance-badges";
import { MaintenanceActivityTimeline } from "../../../../components/maintenance/activity-timeline";
import { WorkOrderWorkflowPanel } from "../../../../components/maintenance/work-order-workflow-panel";
import { VendorAssignmentPanel } from "../../../../components/vendor/vendor-assignment-panel";
import { WorkflowSuccessBanner } from "../../../../components/workflow/workflow-success-banner";
import { completedWorkOrderSuggestions } from "../../../../components/workflow/smart-suggestion-builders";
import { SmartSuggestions } from "../../../../components/workflow/smart-suggestions";
import { createAuthServerComponentClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { toMaintenanceCategoryLabel } from "../../../../lib/maintenance/contracts";
import { getActivityForWorkOrder, getAssigneesForOrganization, getWorkOrderForOrganization } from "../../../../lib/maintenance/server";
import { getThreadBySourceEntity } from "../../../../lib/messaging/server";
import { MaintenanceConversationPanel } from "../../../../components/messaging/maintenance-conversation-panel";
import { getFacilityRecordByWorkOrderId } from "../../../../lib/facility/server";
import { getVendorAssignmentsForWorkOrder, getVendorsForOrganization } from "../../../../lib/vendor/server";
import {
  buildWorkOrderCompletedSuccess,
  buildWorkOrderCreatedSuccess
} from "../../../../lib/workflow/shared/success-configs";

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

  const [workOrder, activity, assignees, vendorAssignments, vendors, maintenanceThread, facilityRecord] =
    await Promise.all([
      getWorkOrderForOrganization(organizationId, workOrderId, supabase),
      getActivityForWorkOrder(organizationId, workOrderId, supabase),
      getAssigneesForOrganization(organizationId, supabase),
      canAssignVendor
        ? getVendorAssignmentsForWorkOrder(organizationId, workOrderId, supabase)
        : Promise.resolve([]),
      canAssignVendor
        ? getVendorsForOrganization(organizationId, { status: "active" }, supabase)
        : Promise.resolve([]),
      getThreadBySourceEntity(organizationId, "maintenance", workOrderId, supabase),
      getFacilityRecordByWorkOrderId(organizationId, workOrderId, supabase)
    ]);

  if (!workOrder) {
    redirect("/maintenance");
  }

  const { data: relatedHistoryRows } = await supabase
    .from("maintenance_work_orders")
    .select("id, work_order_number, title")
    .eq("organization_id", organizationId)
    .eq("property_id", workOrder.propertyId)
    .neq("id", workOrder.id)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(5);

  const canUpdate = evaluatePermission(authorization, "maintenance:update");
  const canAssign = evaluatePermission(authorization, "maintenance:assign");
  const canArchive = evaluatePermission(authorization, "maintenance:archive");
  const canMessageResident =
    Boolean(workOrder.tenantId) &&
    (evaluatePermission(authorization, "message:read") || evaluatePermission(authorization, "message:create"));
  const canNotifyOwner = evaluatePermission(authorization, "communication:create");
  const overdue = isWorkOrderOverdue(workOrder.dueDate, workOrder.status);
  const currentVendorAssignment = vendorAssignments.find((entry) => entry.isCurrent) ?? null;
  const recentVendorIds = new Set(
    vendorAssignments
      .slice()
      .sort((left, right) => right.assignedAt.localeCompare(left.assignedAt))
      .map((entry) => entry.vendorId)
  );

  const { data: openWorkloadRows } = canAssignVendor
    ? await supabase
        .from("maintenance_vendor_assignments")
        .select("vendor_id")
        .eq("organization_id", organizationId)
        .eq("is_current", true)
        .in("assignment_status", ["pending", "awaiting_response", "accepted", "en_route", "arrived", "in_progress"])
    : { data: [] as Array<{ vendor_id: string }> | null };

  const workloadByVendor = new Map<string, number>();
  for (const row of (openWorkloadRows ?? []) as Array<{ vendor_id: string }>) {
    workloadByVendor.set(row.vendor_id, (workloadByVendor.get(row.vendor_id) ?? 0) + 1);
  }

  const vendorOptions = vendors.map((vendor) => ({
    id: vendor.id,
    businessName: vendor.businessName,
    preferredVendor: vendor.preferredVendor,
    rating: vendor.rating,
    recentlyUsed: recentVendorIds.has(vendor.id),
    openWorkload: workloadByVendor.get(vendor.id) ?? 0
  }));
  const assigneeLabel =
    assignees.find((assignee) => assignee.userId === workOrder.assignedToUserId)?.label ?? "Unassigned";

  const assignedVendor = currentVendorAssignment
    ? vendors.find((vendor) => vendor.id === currentVendorAssignment.vendorId)
    : null;

  const workOrderSuccess =
    from === "work-order-created"
      ? buildWorkOrderCreatedSuccess({
          id: workOrder.id,
          workOrderNumber: workOrder.workOrderNumber,
          propertyId: workOrder.propertyId,
          unitId: workOrder.unitId,
          tenantId: workOrder.tenantId
        })
      : from === "work-order-completed"
        ? buildWorkOrderCompletedSuccess({
            id: workOrder.id,
            workOrderNumber: workOrder.workOrderNumber,
            propertyId: workOrder.propertyId
          })
        : null;

  const relatedHistory = (
    (relatedHistoryRows ?? []) as Array<{ id: string; work_order_number: string; title: string }>
  ).map((row) => ({
    id: row.id,
    workOrderNumber: row.work_order_number,
    title: row.title
  }));

  return (
    <DetailPageLayout
      breadcrumbs={[
        { href: "/dashboard", label: "Dashboard" },
        { href: "/maintenance", label: "Maintenance" },
        { label: workOrder.workOrderNumber }
      ]}
      banner={
        workOrderSuccess ? (
          <WorkflowSuccessBanner dismissPath={`/maintenance/${workOrderId}`} {...workOrderSuccess} />
        ) : null
      }
      relationshipChain={
        <EntityRelationshipChain
          links={[
            { href: "/maintenance", label: "Maintenance" },
            { href: `/properties/${workOrder.propertyId}`, label: workOrder.propertyName ?? "Property" },
            ...(workOrder.unitId && workOrder.unitNumber
              ? [{ href: `/units/${workOrder.unitId}`, label: `Unit ${workOrder.unitNumber}` }]
              : []),
            ...(workOrder.tenantId && workOrder.tenantName
              ? [{ href: `/tenants/${workOrder.tenantId}`, label: workOrder.tenantName }]
              : []),
            { label: workOrder.workOrderNumber }
          ]}
        />
      }
      hero={
        <DetailHero
          title={workOrder.title}
          subtitle={`${workOrder.workOrderNumber} · ${toMaintenanceCategoryLabel(workOrder.category)}`}
          attention={
            overdue
              ? "Overdue — complete or reassign now."
              : !currentVendorAssignment && workOrder.status !== "completed" && workOrder.status !== "cancelled"
                ? "No vendor assigned yet."
                : `Status: ${workOrder.status.replaceAll("_", " ")}`
          }
          badges={
            <>
              <PriorityBadge priority={workOrder.priority} />
              <StatusBadge status={workOrder.status} />
            </>
          }
          metrics={
            <>
              <DetailMetric label="Property" value={workOrder.propertyName ?? "—"} />
              <DetailMetric
                label="Unit"
                value={workOrder.unitNumber ? `Unit ${workOrder.unitNumber}` : "Not assigned"}
              />
              <DetailMetric label="Assigned staff" value={workOrder.assignedToUserId ? assigneeLabel : "Unassigned"} />
              <DetailMetric label="Due date" value={workOrder.dueDate ?? "—"} />
              <DetailMetric
                label="Completed"
                value={workOrder.completedAt ? new Date(workOrder.completedAt).toLocaleDateString() : "—"}
              />
            </>
          }
        />
      }
      toolbelt={
        <EntityActionToolbelt
          actions={[
            ...(canAssignVendor &&
            (workOrder.status === "submitted" || workOrder.status === "triaged" || !currentVendorAssignment)
              ? [
                  {
                    id: "assign-vendor",
                    label: "Assign Vendor",
                    href: "#vendor",
                    variant: "primary" as const
                  }
                ]
              : []),
            ...(canUpdate || canAssign
              ? [
                  {
                    id: "complete",
                    label: "Complete",
                    href: "#workflow",
                    variant: "secondary" as const
                  }
                ]
              : []),
            {
              id: "timeline",
              label: "Timeline",
              href: "#timeline",
              variant: "secondary" as const
            },
            {
              id: "photos",
              label: "Photos",
              href: "#attachments",
              variant: "secondary" as const
            },
            ...(canMessageResident && workOrder.tenantId
              ? [
                  {
                    id: "message-resident",
                    label: "Message Resident",
                    href: `/communications/resident/${encodeURIComponent(workOrder.tenantId)}`,
                    variant: "secondary" as const
                  }
                ]
              : [])
          ]}
          moreActions={[
            ...(canNotifyOwner
              ? [
                  {
                    id: "notify-owner",
                    label: "Notify owner",
                    href: `/communications/new?propertyId=${encodeURIComponent(workOrder.propertyId)}&intent=owner-update&title=${encodeURIComponent(`Owner update — ${workOrder.workOrderNumber}`)}`
                  }
                ]
              : []),
            ...(facilityRecord
              ? [{ id: "facility", label: "View facility record", href: `/facility/records/${facilityRecord.id}` }]
              : []),
            ...(canUpdate || canAssign
              ? [{ id: "edit", label: "Edit details", href: `/maintenance/${workOrder.id}/edit` }]
              : []),
            { id: "back", label: "Back to list", href: "/maintenance" }
          ]}
        />
      }
      main={
        <>
          <AiPageContextBridge
            {...buildAiPageContext({
              entityType: "work_order",
              entityId: workOrder.id,
              entityLabel: workOrder.workOrderNumber
            })}
          />
          {workOrder.status === "completed" ? (
            <SmartSuggestions
              title="Suggested actions"
              description="Continue with existing post-completion workflows."
              suggestions={completedWorkOrderSuggestions({
                workOrderId: workOrder.id,
                propertyId: workOrder.propertyId,
                unitId: workOrder.unitId,
                facilityRecordHref: facilityRecord ? `/facility/records/${facilityRecord.id}` : null
              })}
            />
          ) : null}
          {(canUpdate || canAssign || canAssignVendor) &&
          workOrder.status !== "cancelled" ? (
            <div id="workflow">
              <WorkOrderWorkflowPanel
                workOrderId={workOrder.id}
                status={workOrder.status}
                priority={workOrder.priority}
                currentAssignment={currentVendorAssignment}
                canUpdate={canUpdate || canAssign}
                canAssignVendor={canAssignVendor}
                canArchive={canArchive}
                tenantId={workOrder.tenantId}
              />
            </div>
          ) : null}

          <Card variant="elevated" className="space-y-4">
            <h2 className="mpa-section-title">Work order details</h2>

            {workOrder.description ? (
              <p className="text-sm leading-relaxed text-[var(--mpa-color-text-secondary)]">{workOrder.description}</p>
            ) : null}

            <div className="grid gap-2 text-sm text-[var(--mpa-color-text-secondary)] md:grid-cols-2 lg:grid-cols-3">
              <p>
                Property:{" "}
                <Link
                  href={`/properties/${workOrder.propertyId}`}
                  className="font-medium text-[var(--mpa-color-brand-primary)]"
                >
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
              <div className="rounded-[var(--mpa-radius-lg)] border border-[var(--mpa-color-border-subtle)] p-4">
                <h3 className="text-sm font-medium text-[var(--mpa-color-text-primary)]">Internal notes</h3>
                <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
                  {workOrder.internalNotes ?? "No internal notes."}
                </p>
              </div>
              <div className="rounded-[var(--mpa-radius-lg)] border border-[var(--mpa-color-border-subtle)] p-4">
                <h3 className="text-sm font-medium text-[var(--mpa-color-text-primary)]">Tenant notes</h3>
                <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
                  {workOrder.tenantNotes ?? "No tenant notes."}
                </p>
              </div>
            </div>
          </Card>

          {canAssignVendor ? (
            <div id="vendor">
              <VendorAssignmentPanel
                workOrderId={workOrder.id}
                vendors={vendorOptions}
                initialAssignments={vendorAssignments}
                initialCurrentAssignment={currentVendorAssignment}
                workOrderCategory={workOrder.category}
              />
            </div>
          ) : null}

          <div id="timeline">
            <Card variant="elevated" className="space-y-3">
              <h2 className="mpa-section-title">Timeline</h2>
              <p className="text-sm text-[var(--mpa-color-text-secondary)]">
                Created → Assigned → Vendor accepted → Work started → Completed → Closed — visible without leaving this
                page.
              </p>
              <MaintenanceActivityTimeline events={activity} />
            </Card>
          </div>

          <DiscloseSection title="Conversation" description="Resident / vendor thread for this work order.">
            <div id="conversation">
              <MaintenanceConversationPanel thread={maintenanceThread} />
            </div>
          </DiscloseSection>

          <div id="attachments">
            <Card variant="elevated" className="space-y-3">
              <h2 className="mpa-section-title">Attachments & notes</h2>
              {workOrder.photoPlaceholder?.startsWith("media:") ? (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-[var(--mpa-color-text-primary)]">Photos</p>
                  <p className="text-sm text-[var(--mpa-color-text-secondary)]">
                    Photo attached to this work order. Open Edit to replace or update the image.
                  </p>
                </div>
              ) : (
                <AttachmentNoteBlock
                  label="Photos"
                  value={workOrder.photoPlaceholder}
                  emptyMessage="No photo yet. Use Edit details to attach one."
                />
              )}
              <AttachmentNoteBlock
                label="Documents"
                value={workOrder.documentPlaceholder}
                emptyMessage="No document notes yet."
              />
              <DiscloseSection
                title="Advanced maintenance notes"
                description="Recurring and preventive notes — expand when needed."
              >
                <AttachmentNoteBlock
                  label="Recurring maintenance"
                  value={workOrder.recurringMaintenancePlaceholder}
                  emptyMessage="No recurring maintenance notes."
                />
                <AttachmentNoteBlock
                  label="Preventive maintenance"
                  value={workOrder.preventiveMaintenancePlaceholder}
                  emptyMessage="No preventive maintenance notes."
                />
              </DiscloseSection>
            </Card>
          </div>
        </>
      }
      contextRail={
        <MaintenanceContextRail
          propertyId={workOrder.propertyId}
          propertyName={workOrder.propertyName}
          unitId={workOrder.unitId}
          unitNumber={workOrder.unitNumber}
          tenantId={workOrder.tenantId}
          tenantName={workOrder.tenantName}
          vendorName={assignedVendor?.businessName ?? null}
          vendorId={assignedVendor?.id ?? null}
          priority={workOrder.priority}
          status={workOrder.status}
          dueDate={workOrder.dueDate}
          overdue={overdue}
          category={workOrder.category}
          events={activity}
          relatedHistory={relatedHistory}
        />
      }
    />
  );
}

function AttachmentNoteBlock({
  label,
  value,
  emptyMessage
}: {
  label: string;
  value: string | null;
  emptyMessage: string;
}) {
  return (
    <div className="rounded-[var(--mpa-radius-lg)] border border-dashed border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface-muted)] p-3">
      <p className="mpa-section-label">{label}</p>
      <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">{value?.trim() ? value : emptyMessage}</p>
    </div>
  );
}
