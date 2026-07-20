import { redirect } from "next/navigation";
import { Card } from "@mpa/ui";
import { DocumentVaultBrowser } from "../../../../components/settings/document-vault-browser";
import { createAuthServerComponentClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { listOrganizationVaultDocuments } from "../../../../lib/vault/server";

export default async function DocumentsSettingsPage() {
  const supabase = await createAuthServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const organizationId = await resolveActiveOrganizationIdForUser(user.id);
  if (!organizationId) {
    return (
      <Card>
        <h1 className="font-display text-xl font-semibold">Document Vault</h1>
        <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
          Select an organization to browse vault documents.
        </p>
      </Card>
    );
  }

  const authorization = await resolveAuthorizationContext(user, organizationId);
  if (!evaluatePermission(authorization, "document:read")) {
    redirect("/unauthorized");
  }

  const documents = await listOrganizationVaultDocuments(organizationId, { limit: 200 }, supabase);
  return <DocumentVaultBrowser initialDocuments={documents} />;
}
