import { redirect } from "next/navigation";
import { Card } from "@mpa/ui";
import { AppPage } from "../../../../../../components/presentation/app-page";
import { createAuthServerComponentClient } from "../../../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../../../lib/organization/server";
import {
  getActivityForWorkOrder,
  getWorkOrderForOrganization
} from "../../../../../../lib/maintenance/server";
import {
  toMaintenanceCategoryLabel,
  toMaintenancePriorityLabel,
  toMaintenanceStatusLabel
} from "../../../../../../lib/maintenance/contracts";
import { resolveLinkedTenantForUser } from "../../../../../../lib/resident/resolve-tenant";

export default async function TenantMaintenanceDetailPage({
  params
}: {
  params: Promise<{ workOrderId: string }>;
}) {
  const { workOrderId } = await params;
  const supabase = await createAuthServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const organizationId = await resolveActiveOrganizationIdForUser(user.id);
  if (!organizationId) redirect("/portal/tenant");

  const authorization = await resolveAuthorizationContext(user, organizationId);
  if (!evaluatePermission(authorization, "maintenance:read")) redirect("/unauthorized");

  const tenant = await resolveLinkedTenantForUser(organizationId, user.id, user.email, supabase);
  const workOrder = await getWorkOrderForOrganization(organizationId, workOrderId, supabase);
  if (!workOrder || (tenant && workOrder.tenantId && workOrder.tenantId !== tenant.id)) {
    redirect("/portal/tenant/maintenance");
  }

  const activity = await getActivityForWorkOrder(organizationId, workOrderId, supabase);

  return (
    <AppPage
      breadcrumbs={[
        { href: "/portal/tenant", label: "Tenant home" },
        { href: "/portal/tenant/maintenance", label: "Maintenance" },
        { label: workOrder.workOrderNumber }
      ]}
    >
      <div className="space-y-4">
        <Card className="space-y-2">
          <h1 className="text-xl font-semibold text-[var(--mpa-color-text-primary)]">{workOrder.title}</h1>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            {workOrder.workOrderNumber} · {toMaintenanceStatusLabel(workOrder.status)} ·{" "}
            {toMaintenancePriorityLabel(workOrder.priority)} · {toMaintenanceCategoryLabel(workOrder.category)}
          </p>
          {workOrder.description ? (
            <p className="text-sm text-[var(--mpa-color-text-primary)]">{workOrder.description}</p>
          ) : null}
          {workOrder.tenantNotes ? (
            <p className="text-sm text-[var(--mpa-color-text-secondary)]">Notes: {workOrder.tenantNotes}</p>
          ) : null}
        </Card>

        <Card className="space-y-3">
          <h2 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">Timeline</h2>
          {activity.length === 0 ? (
            <p className="text-sm text-[var(--mpa-color-text-secondary)]">No timeline events yet.</p>
          ) : (
            <ul className="space-y-2">
              {activity.map((event) => (
                <li key={event.id} className="border-b border-[var(--mpa-color-border-default)] pb-2 last:border-0">
                  <p className="text-sm text-[var(--mpa-color-text-primary)]">{event.summary}</p>
                  <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                    {new Date(event.createdAt).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </AppPage>
  );
}
