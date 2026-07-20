import { redirect } from "next/navigation";
import { Card } from "@mpa/ui";
import { AppPage } from "../../../../../components/presentation/app-page";
import { RecordPaymentFlow } from "../../../../../components/financial/record-payment-flow";
import { createAuthServerComponentClient } from "../../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../../lib/organization/server";
import { fetchAuthedApi } from "../../../../../lib/financial/server-fetch";
import type { RentChargeListItem } from "../../../../../lib/financial/server";

export default async function RecordPaymentPage({
  searchParams
}: {
  searchParams: Promise<{ chargeId?: string }>;
}) {
  const { chargeId } = await searchParams;
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
      <RecordPaymentFlow charges={items} initialChargeId={chargeId ?? null} />
    </AppPage>
  );
}
