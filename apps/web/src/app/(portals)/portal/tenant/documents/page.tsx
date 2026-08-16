import Link from "next/link";
import { createAuthServerClient } from "../../../../../lib/auth/server";
import { resolveActiveOrganizationIdForUser } from "../../../../../lib/organization/resolve-active-organization";
import { loadTenantPortalContext } from "../../../../../lib/tenant-lifecycle/portal-context";
import {
  ResidentDocumentsStrip,
  ResidentPageIntro,
  ResidentSection,
  ResidentStatusBadge
} from "../../../../../components/shell/resident-workspace";

type AnyRow = Record<string, unknown>;

export default async function TenantDocumentsPage() {
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const organizationId = user
    ? await resolveActiveOrganizationIdForUser(supabase, user.id)
    : null;

  let documentName: string | null = null;
  let documentBody: string | null = null;

  if (user && organizationId) {
    const occupancy = await loadTenantPortalContext(supabase, organizationId, user.id);
    const leaseId = occupancy.current?.lease_id ?? occupancy.historical[0]?.lease_id ?? null;

    if (leaseId) {
      const { data: leaseRaw } = await supabase
        .from("lease_agreements")
        .select("document_name, document_body, status")
        .eq("id", leaseId)
        .maybeSingle();
      const lease = leaseRaw as AnyRow | null;
      if (lease && (lease["status"] === "signed" || lease["status"] === "active")) {
        documentName = (lease["document_name"] as string | null) ?? "Lease agreement";
        documentBody = (lease["document_body"] as string | null) ?? null;
      }
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <ResidentPageIntro
        eyebrow="Documents"
        title="Your papers"
        description="Lease, policies, and notices in one calm place — ready for Document Intelligence later."
      />

      <ResidentSection title="Lease" description="Your signed agreement when available.">
        {documentBody ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium text-[var(--mpa-color-text-primary)]">{documentName}</p>
              <ResidentStatusBadge tone="ok">Available</ResidentStatusBadge>
            </div>
            <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap rounded-xl bg-[var(--mpa-color-bg-app)] p-3 text-sm leading-6">
              {documentBody}
            </pre>
          </>
        ) : (
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            Signed lease documents appear here after activation.
          </p>
        )}
      </ResidentSection>

      <ResidentSection
        title="Also in Document Intelligence"
        description="These document types attach to your home records — no duplicate folders."
      >
        <ul className="space-y-2 text-sm text-[var(--mpa-color-text-secondary)]">
          {[
            "Renewals",
            "Move-in / move-out packets",
            "Community rules & policies",
            "Inspection reports",
            "Maintenance reports",
            "Notices",
            "Receipts"
          ].map((item) => (
            <li
              key={item}
              className="flex items-center justify-between gap-2 border-b border-[var(--mpa-color-border-default)] py-2 last:border-0"
            >
              <span>{item}</span>
              <ResidentStatusBadge tone="neutral">Connected</ResidentStatusBadge>
            </li>
          ))}
        </ul>
      </ResidentSection>

      <ResidentDocumentsStrip
        title="Document Intelligence"
        detail="Your lease and related home documents are organized by the same Document Intelligence Center staff use — with resident permissions only."
      />

      <Link
        href="/portal/tenant"
        className="inline-flex min-h-11 items-center text-sm font-medium text-[var(--mpa-color-brand-primary)] underline"
      >
        Back home
      </Link>
    </div>
  );
}
