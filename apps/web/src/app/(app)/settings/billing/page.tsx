import { redirect } from "next/navigation";
import { Card } from "@mpa/ui";
import { CompanyBillingCenter } from "../../../../components/settings/company-billing-center";
import { createAuthServerComponentClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { getOrgSaasSnapshot } from "../../../../lib/saas/server";
import { getOrgUsageSnapshot } from "../../../../lib/saas/usage";

export default async function SettingsBillingPage({
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
        <h1 className="font-display text-xl font-semibold text-[var(--mpa-color-text-primary)]">Billing</h1>
        <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">
          Select an organization before managing your M.P.A. subscription.
        </p>
      </Card>
    );
  }

  const authorization = await resolveAuthorizationContext(user, organizationId);
  if (!evaluatePermission(authorization, "saas:read")) {
    redirect("/unauthorized");
  }

  const [{ data: org }, snapshot, usage] = await Promise.all([
    supabase.from("organizations").select("name").eq("id", organizationId).maybeSingle(),
    getOrgSaasSnapshot(organizationId, supabase),
    getOrgUsageSnapshot(organizationId, supabase)
  ]);

  const params = await searchParams;
  const saas = typeof params["saas"] === "string" ? params["saas"] : null;
  let notice: string | null = null;
  if (saas === "success") notice = "Checkout completed. Your subscription will appear here once Stripe confirms.";
  if (saas === "cancel") notice = "Checkout canceled. No changes were made.";

  return (
    <CompanyBillingCenter
      initialSnapshot={snapshot}
      usage={usage}
      canManage={evaluatePermission(authorization, "saas:manage")}
      organizationName={org?.name ?? "your organization"}
      notice={notice}
    />
  );
}
