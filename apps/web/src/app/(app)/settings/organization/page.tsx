import { redirect } from "next/navigation";
import { Card } from "@mpa/ui";
import {
  OrganizationSettingsPanel,
  type OrganizationSettingsDetails
} from "../../../../components/settings/organization-settings-panel";
import { createAuthServerComponentClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";

export default async function OrganizationSettingsPage() {
  const supabase = await createAuthServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const organizationId = await resolveActiveOrganizationIdForUser(user.id);
  if (!organizationId) {
    return <OrganizationSettingsPanel initialOrganization={null} canManage={false} />;
  }

  const authorization = await resolveAuthorizationContext(user, organizationId);
  if (!evaluatePermission(authorization, "organization:read")) {
    redirect("/unauthorized");
  }

  const { data, error } = await supabase
    .from("organizations")
    .select("id, name, slug, created_at, updated_at")
    .eq("id", organizationId)
    .maybeSingle();

  if (error) {
    return (
      <Card>
        <p className="text-sm text-[var(--mpa-color-feedback-error)]">{error.message}</p>
      </Card>
    );
  }

  return (
    <OrganizationSettingsPanel
      initialOrganization={(data as OrganizationSettingsDetails | null) ?? null}
      canManage={evaluatePermission(authorization, "authorization:manage")}
    />
  );
}
