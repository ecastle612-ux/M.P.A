import Link from "next/link";
import { createAuthServerClient } from "../../../../../lib/auth/server";
import { resolveActiveOrganizationIdForUser } from "../../../../../lib/organization/resolve-active-organization";

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
    const { data: residentRaw } = await supabase
      .from("pm_residents")
      .select("lease_id")
      .eq("organization_id", organizationId)
      .or(`user_id.eq.${user.id},email.eq.${user.email ?? ""}`)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const resident = residentRaw as AnyRow | null;
    const leaseId = (resident?.["lease_id"] as string | null) ?? null;

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
    <section className="space-y-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-5">
      <h2 className="font-display text-xl font-semibold text-[var(--mpa-color-text-primary)]">
        Documents
      </h2>
      {documentBody ? (
        <>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">{documentName}</p>
          <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-md bg-[var(--mpa-color-bg-app)] p-3 text-xs">
            {documentBody}
          </pre>
        </>
      ) : (
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          Signed lease documents appear here after activation.
        </p>
      )}
      <Link href="/portal/tenant" className="text-sm text-[var(--mpa-color-brand-primary)] underline">
        Back to welcome
      </Link>
    </section>
  );
}
