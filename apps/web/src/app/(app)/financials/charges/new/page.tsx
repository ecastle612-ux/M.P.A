import { redirect } from "next/navigation";
import { CreatePageLayout } from "../../../../../components/presentation/create-page-layout";
import { CreateFormContextRail } from "../../../../../components/presentation/create-form-context-rail";
import { RentChargeForm } from "../../../../../components/financial/rent-charge-form";
import { createAuthServerComponentClient } from "../../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../../lib/organization/server";
import { fetchAuthedApi } from "../../../../../lib/financial/server-fetch";
import type { LeaseListItem } from "../../../../../lib/lease/server";

export default async function NewRentChargePage() {
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
  if (!evaluatePermission(authorization, "financial:create")) {
    redirect("/unauthorized");
  }

  const leasesResult = await fetchAuthedApi<{ items: LeaseListItem[] }>("/api/leases?status=active");
  const leases = leasesResult.ok ? leasesResult.data.items : [];

  return (
    <CreatePageLayout
      breadcrumbs={[
        { href: "/dashboard", label: "Dashboard" },
        { href: "/financials", label: "Financials" },
        { href: "/financials/charges", label: "Rent Charges" },
        { label: "Create" }
      ]}
      form={
        <RentChargeForm
          leases={leases.map((lease) => ({
            id: lease.id,
            propertyName: lease.propertyName,
            unitNumber: lease.unitNumber,
            tenantName: lease.tenantName,
            status: lease.status
          }))}
        />
      }
      contextRail={
        <CreateFormContextRail
          module="financial"
          relatedLinks={[
            { label: "Financials dashboard", href: "/financials" },
            { label: "Rent charges", href: "/financials/charges" }
          ]}
        />
      }
    />
  );
}
