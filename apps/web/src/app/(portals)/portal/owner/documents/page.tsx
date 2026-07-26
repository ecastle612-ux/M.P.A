import { redirect } from "next/navigation";
import { Card } from "@mpa/ui";
import { AppPage } from "../../../../../components/presentation/app-page";
import { OwnerDocumentsBrowser } from "../../../../../components/portal/owner-documents-browser";
import {
  OwnerFoundationNote,
  OwnerSectionHeader
} from "../../../../../components/portal/owner-section-placeholder";
import { createAuthServerComponentClient } from "../../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../../lib/organization/server";
import { loadOwnerDocumentsExperience } from "../../../../../lib/owner-portal/documents-experience";

export default async function OwnerDocumentsPage() {
  const supabase = await createAuthServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const organizationId = await resolveActiveOrganizationIdForUser(user.id);
  if (!organizationId) redirect("/portal/owner");

  const authorization = await resolveAuthorizationContext(user, organizationId);
  if (!evaluatePermission(authorization, "document:read")) redirect("/unauthorized");

  let model = null;
  let loadError: string | null = null;
  try {
    model = await loadOwnerDocumentsExperience({ organizationId, user, supabase });
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Documents could not be loaded.";
  }

  if (!model) {
    return (
      <AppPage
        breadcrumbs={[
          { href: "/portal/owner", label: "Owner" },
          { label: "Documents" }
        ]}
      >
        <Card variant="elevated" className="space-y-2 p-5">
          <h1 className="font-display text-xl font-semibold text-[var(--mpa-color-text-primary)]">
            Documents unavailable
          </h1>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            We couldn’t load your documents right now. Retry in a moment, or contact your property manager if
            this continues.
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
        { label: "Documents" }
      ]}
    >
      <div className="space-y-5">
        <OwnerSectionHeader
          title="Documents"
          description="Browse and download files shared for your properties from the Document Vault. Read-only — no uploads or sharing."
        />
        <OwnerFoundationNote>
          Documents are loaded per authorized property via the Document Vault. Internal, vendor-only, and
          non-property files are excluded. Search and filters run in your browser.
        </OwnerFoundationNote>
        <OwnerDocumentsBrowser
          documents={model.documents}
          properties={model.properties}
          documentTypes={model.documentTypes}
          loadNotes={model.loadNotes}
        />
      </div>
    </AppPage>
  );
}
