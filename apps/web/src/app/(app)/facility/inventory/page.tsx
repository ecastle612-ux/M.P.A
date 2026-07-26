import { redirect } from "next/navigation";
import { Card } from "@mpa/ui";
import { AppPage } from "../../../../components/presentation/app-page";
import { InventoryList } from "../../../../components/facility/inventory-list";
import { createAuthServerComponentClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { listFacilityInventory } from "../../../../lib/facility/inventory-server";
import {
  isFacilityInventoryStatus,
  type FacilityInventoryStatus
} from "../../../../lib/facility/inventory-contracts";

export default async function FacilityInventoryPage({
  searchParams
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status: statusParam, q: queryParam } = await searchParams;
  const supabase = await createAuthServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const organizationId = await resolveActiveOrganizationIdForUser(user.id);
  if (!organizationId) {
    return (
      <AppPage
        wide
        breadcrumbs={[
          { href: "/dashboard", label: "Dashboard" },
          { href: "/facility", label: "Facility" },
          { label: "Inventory" }
        ]}
      >
        <Card>
          <h1 className="text-xl font-semibold text-[var(--mpa-color-text-primary)]">No active organization</h1>
        </Card>
      </AppPage>
    );
  }

  const authorization = await resolveAuthorizationContext(user, organizationId);
  if (!evaluatePermission(authorization, "facility:inventory:read")) {
    redirect("/unauthorized");
  }

  const status: FacilityInventoryStatus | undefined =
    statusParam && isFacilityInventoryStatus(statusParam) ? statusParam : undefined;

  const items = await listFacilityInventory(
    organizationId,
    {
      ...(status ? { status } : {}),
      ...(queryParam?.trim() ? { search: queryParam.trim() } : {}),
      limit: 200
    },
    supabase
  );

  return (
    <AppPage
      wide
      breadcrumbs={[
        { href: "/dashboard", label: "Dashboard" },
        { href: "/facility", label: "Facility" },
        { label: "Inventory" }
      ]}
    >
      <InventoryList
        items={items}
        canWrite={evaluatePermission(authorization, "facility:inventory:write")}
        {...(statusParam ? { statusFilter: statusParam } : {})}
        {...(queryParam ? { query: queryParam } : {})}
      />
    </AppPage>
  );
}
