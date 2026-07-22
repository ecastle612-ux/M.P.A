import { redirect } from "next/navigation";
import { Card } from "@mpa/ui";
import { AppPage } from "../../../../../components/presentation/app-page";
import { RecordPaymentFlow } from "../../../../../components/financial/record-payment-flow";
import { WorkflowContinuityChips } from "../../../../../components/workflow/workflow-continuity-chips";
import { createAuthServerComponentClient } from "../../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../../lib/organization/server";
import { fetchAuthedApi } from "../../../../../lib/financial/server-fetch";
import type { RentChargeListItem } from "../../../../../lib/financial/server";
import { getTenantForOrganization } from "../../../../../lib/tenant/server";

export default async function RecordPaymentPage({
  searchParams
}: {
  searchParams: Promise<{ chargeId?: string; tenantId?: string }>;
}) {
  const { chargeId, tenantId } = await searchParams;
  const supabase = await createAuthServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const organizationId = await resolveActiveOrganizationIdForUser(user.id);
  if (!organizationId) {
    return (
      <AppPage
        wide
        breadcrumbs={[
          { href: "/dashboard", label: "Dashboard" },
          { href: "/financials", label: "Financials" },
          { label: "Record payment" }
        ]}
      >
        <Card>
          <h1 className="text-xl font-semibold text-[var(--mpa-color-text-primary)]">No active organization</h1>
        </Card>
      </AppPage>
    );
  }

  const authorization = await resolveAuthorizationContext(user, organizationId);
  if (!evaluatePermission(authorization, "financial:create")) {
    redirect("/unauthorized");
  }

  const result = await fetchAuthedApi<{ items: RentChargeListItem[] }>("/api/rent-charges");
  const items = result.ok ? result.data.items : [];
  const scopedTenant =
    tenantId && evaluatePermission(authorization, "tenant:read")
      ? await getTenantForOrganization(organizationId, tenantId, supabase)
      : null;
  const tenantLabel = scopedTenant
    ? scopedTenant.preferredName || `${scopedTenant.firstName} ${scopedTenant.lastName}`
    : null;
  const propertyId =
    scopedTenant?.propertyId ?? items.find((item) => item.tenantId === tenantId)?.propertyId ?? null;

  return (
    <AppPage
      wide
      breadcrumbs={[
        { href: "/dashboard", label: "Dashboard" },
        { href: "/financials", label: "Financials" },
        { href: "/financials/charges", label: "Rent Charges" },
        { label: "Record payment" }
      ]}
    >
      <div className="space-y-4">
        <WorkflowContinuityChips
          chips={[
            ...(tenantId
              ? [
                  {
                    id: "resident",
                    label: tenantLabel ? `Return to ${tenantLabel}` : "Return to Resident",
                    href: `/tenants/${tenantId}`,
                    variant: "primary" as const
                  }
                ]
              : []),
            ...(propertyId
              ? [{ id: "property", label: "Return to Property", href: `/properties/${propertyId}` }]
              : []),
            ...(tenantId
              ? [
                  {
                    id: "message",
                    label: "Send Message",
                    href: `/communications/resident/${encodeURIComponent(tenantId)}`
                  }
                ]
              : []),
            { id: "charges", label: "Open Charges", href: "/financials/charges" }
          ]}
        />
        <RecordPaymentFlow
          charges={items}
          initialChargeId={chargeId ?? null}
          initialTenantId={tenantId ?? null}
        />
      </div>
    </AppPage>
  );
}
