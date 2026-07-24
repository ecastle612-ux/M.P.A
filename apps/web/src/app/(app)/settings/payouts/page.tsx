import { redirect } from "next/navigation";
import { Card } from "@mpa/ui";
import { ConnectOnboardingCard } from "../../../../components/portal/connect-onboarding-card";
import { OwnerConnectRoster } from "../../../../components/settings/owner-connect-roster";
import { PayoutRunConsole } from "../../../../components/settings/payout-run-console";
import { createAuthServerComponentClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { listOrgPayoutRunSummaries } from "../../../../lib/owner-payouts/projections";
import {
  getOrgSettlementConnectStatus,
  listOwnerConnectStatusesForOrg,
  refreshConnectAccountStatus
} from "../../../../lib/owner-payouts/service";

export default async function SettingsPayoutsPage({
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
  if (!organizationId) {
    return (
      <Card className="p-5">
        <h1 className="font-display text-xl font-semibold text-[var(--mpa-color-text-primary)]">
          Owner payouts
        </h1>
        <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">
          Select an organization before managing settlement Connect onboarding.
        </p>
      </Card>
    );
  }

  const authorization = await resolveAuthorizationContext(user, organizationId);
  const canManage = evaluatePermission(authorization, "payout:manage");
  const canRead =
    canManage ||
    evaluatePermission(authorization, "financial:read") ||
    evaluatePermission(authorization, "financial:admin");
  if (!canRead) redirect("/unauthorized");

  const params = await searchParams;
  const returned = typeof params["connect"] === "string";

  const status = returned
    ? await refreshConnectAccountStatus({
        organizationId,
        purpose: "org_settlement",
        actorUserId: user.id,
        client: supabase
      })
    : await getOrgSettlementConnectStatus({
        organizationId,
        canManage,
        client: supabase
      });

  let ownerRoster = null;
  if (canManage) {
    try {
      ownerRoster = await listOwnerConnectStatusesForOrg({ organizationId, client: supabase });
    } catch {
      ownerRoster = null;
    }
  }

  let runSummaries: Awaited<ReturnType<typeof listOrgPayoutRunSummaries>> = [];
  try {
    runSummaries = await listOrgPayoutRunSummaries({ organizationId, client: supabase });
  } catch {
    runSummaries = [];
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-semibold text-[var(--mpa-color-text-primary)]">
          Owner payouts
        </h1>
        <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
          Organization settlement Connect, owner eligibility, and payout run visibility (FIN-003 Phase
          D). Separate from SaaS subscription billing. Transfers require{" "}
          <code className="text-xs">FIN003_TRANSFERS_ENABLED</code> and existing Phase C controls.
        </p>
      </div>
      <ConnectOnboardingCard
        initialStatus={status}
        mode="org"
        returnPath="/settings/payouts"
        returnedFromConnect={returned}
        title="Settlement Express account"
        description="Create or continue Stripe Connect Express onboarding for destination-charge settlement. Does not move owner money."
      />
      {!canManage ? (
        <p className="text-xs text-[var(--mpa-color-text-secondary)]">
          You can view settlement status. Starting onboarding and owner reminders require payout:manage.
        </p>
      ) : null}

      {canManage ? (
        ownerRoster ? (
          <OwnerConnectRoster initialRows={ownerRoster} canNudge={canManage} />
        ) : (
          <Card variant="muted" className="p-4 text-sm text-[var(--mpa-color-text-secondary)]">
            Owner Connect roster could not be loaded right now.
          </Card>
        )
      ) : null}

      <PayoutRunConsole initialRuns={runSummaries} canManage={canManage} />
    </div>
  );
}
