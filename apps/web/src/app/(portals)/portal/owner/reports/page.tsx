import { redirect } from "next/navigation";
import { Card } from "@mpa/ui";
import { AppPage } from "../../../../../components/presentation/app-page";
import { OwnerReportsBrowser } from "../../../../../components/portal/owner-reports-browser";
import {
  OwnerFoundationNote,
  OwnerSectionHeader
} from "../../../../../components/portal/owner-section-placeholder";
import { createAuthServerComponentClient } from "../../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../../lib/organization/server";
import { loadOwnerReportsExperience } from "../../../../../lib/owner-portal/reports-experience";

export default async function OwnerReportsPage() {
  const supabase = await createAuthServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const organizationId = await resolveActiveOrganizationIdForUser(user.id);
  if (!organizationId) redirect("/portal/owner");

  const authorization = await resolveAuthorizationContext(user, organizationId);
  if (!evaluatePermission(authorization, "financial:read")) redirect("/unauthorized");

  let model = null;
  let loadError: string | null = null;
  try {
    model = await loadOwnerReportsExperience({ organizationId, user, supabase });
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Reports could not be loaded.";
  }

  if (!model) {
    return (
      <AppPage
        breadcrumbs={[
          { href: "/portal/owner", label: "Owner" },
          { label: "Reports" }
        ]}
      >
        <Card variant="elevated" className="space-y-2 p-5">
          <h1 className="font-display text-xl font-semibold text-[var(--mpa-color-text-primary)]">
            Reports unavailable
          </h1>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            We couldn’t load your reports right now. Retry in a moment, or contact your property manager if
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
        { label: "Reports" }
      ]}
    >
      <div className="space-y-5">
        <OwnerSectionHeader
          title="Reports"
          description="Browse and download owner-facing reports and statements already generated for your properties. Read-only — no report generation."
        />
        <OwnerFoundationNote>
          Reports are loaded per authorized property via ReportingService vault versions. Rent roll,
          delinquency, maintenance, and other PM-operational report types are excluded. Search and filters
          run in your browser.
        </OwnerFoundationNote>
        <OwnerReportsBrowser
          reports={model.reports}
          statements={model.statements}
          properties={model.properties}
          reportTypes={model.reportTypes}
          periods={model.periods}
          loadNotes={model.loadNotes}
        />
      </div>
    </AppPage>
  );
}
