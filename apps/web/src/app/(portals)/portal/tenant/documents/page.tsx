import { redirect } from "next/navigation";
import { Card } from "@mpa/ui";
import { AppPage } from "../../../../../components/presentation/app-page";
import { createAuthServerComponentClient } from "../../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../../lib/organization/server";
import { getVaultDocumentsForEntity } from "../../../../../lib/vault/server";
import { resolveLinkedTenantForUser } from "../../../../../lib/resident/resolve-tenant";

export default async function TenantDocumentsPage() {
  const supabase = await createAuthServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const organizationId = await resolveActiveOrganizationIdForUser(user.id);
  if (!organizationId) redirect("/portal/tenant");

  const authorization = await resolveAuthorizationContext(user, organizationId);
  if (!evaluatePermission(authorization, "document:read")) redirect("/unauthorized");

  const tenant = await resolveLinkedTenantForUser(organizationId, user.id, user.email, supabase);
  const documents = tenant
    ? await getVaultDocumentsForEntity(organizationId, "tenant", tenant.id, supabase)
    : [];

  return (
    <AppPage
      breadcrumbs={[
        { href: "/portal/tenant", label: "Tenant home" },
        { label: "Documents" }
      ]}
    >
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-semibold text-[var(--mpa-color-text-primary)]">Documents</h1>
          <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
            Lease and resident files shared with you.
          </p>
        </div>

        {!tenant ? (
          <Card>
            <p className="text-sm text-[var(--mpa-color-text-secondary)]">
              No resident profile is linked to this account yet.
            </p>
          </Card>
        ) : documents.length === 0 ? (
          <Card>
            <p className="text-sm text-[var(--mpa-color-text-secondary)]">No documents are available yet.</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <Card key={doc.id} className="space-y-1">
                <p className="text-sm font-medium text-[var(--mpa-color-text-primary)]">{doc.title}</p>
                <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                  {doc.documentType}
                  {doc.fileUrl ? (
                    <>
                      {" · "}
                      <a className="underline" href={doc.fileUrl} target="_blank" rel="noreferrer">
                        Open
                      </a>
                    </>
                  ) : null}
                </p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppPage>
  );
}
