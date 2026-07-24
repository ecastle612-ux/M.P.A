import { redirect } from "next/navigation";
import { Card } from "@mpa/ui";
import { AppPage } from "../../../../../components/presentation/app-page";
import { OwnerFinancialExperience } from "../../../../../components/portal/owner-financial-experience";
import { createAuthServerComponentClient } from "../../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../../lib/organization/server";
import { loadOwnerFinancialExperience } from "../../../../../lib/owner-portal/financial-experience";
import { refreshConnectAccountStatus } from "../../../../../lib/owner-payouts/service";

export default async function OwnerFinancialsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = await createAuthServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const organizationId = await resolveActiveOrganizationIdForUser(user.id);
  if (!organizationId) redirect("/portal/owner");

  const authorization = await resolveAuthorizationContext(user, organizationId);
  if (!evaluatePermission(authorization, "financial:read")) redirect("/unauthorized");

  const params = await searchParams;
  const connectReturnedFromLink = typeof params["connect"] === "string";
  if (connectReturnedFromLink) {
    try {
      await refreshConnectAccountStatus({
        organizationId,
        purpose: "owner",
        ownerUserId: user.id,
        actorUserId: user.id,
        client: supabase
      });
    } catch {
      // Best-effort after Account Link return.
    }
  }

  let model = null;
  let loadError: string | null = null;
  try {
    model = await loadOwnerFinancialExperience({
      organizationId,
      user,
      supabase,
      connectReturnedFromLink
    });
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Financials could not be loaded.";
  }

  if (!model) {
    return (
      <AppPage
        breadcrumbs={[
          { href: "/portal/owner", label: "Owner" },
          { label: "Financials" }
        ]}
      >
        <Card variant="elevated" className="space-y-2 p-5">
          <h1 className="font-display text-xl font-semibold text-[var(--mpa-color-text-primary)]">
            Financials unavailable
          </h1>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            We couldn’t load your financial summary right now. Retry in a moment, or contact your property
            manager if this continues.
          </p>
          {loadError ? (
            <p className="text-xs text-[var(--mpa-color-text-secondary)]">{loadError}</p>
          ) : null}
        </Card>
      </AppPage>
    );
  }

  return (
    <AppPage
      breadcrumbs={[
        { href: "/portal/owner", label: "Owner" },
        { label: "Financials" }
      ]}
    >
      <OwnerFinancialExperience model={model} />
    </AppPage>
  );
}
