import Link from "next/link";

type PageProps = {
  searchParams: Promise<{ reason?: string; required?: string }>;
};

export default async function UnauthorizedPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const reason = params.reason;
  const required = params.required;

  const message =
    reason === "entitlement"
      ? "This workspace is outside your organization's purchased subscription."
      : reason === "admin"
        ? "Master Admin is available only to authorized platform operators."
        : reason === "role"
          ? "Your account does not have a recognized role for this organization. Ask your administrator to re-invite you with the correct role, then sign in again."
          : "You do not have access to this area.";

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-4 p-6">
      <p className="font-display text-sm font-semibold text-[var(--mpa-color-brand-primary)]">M.P.A.</p>
      <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">Access denied</h1>
      <p className="text-sm text-[var(--mpa-color-text-secondary)]">{message}</p>
      {required ? (
        <p className="font-mono text-xs text-[var(--mpa-color-text-secondary)]">Required: {required}</p>
      ) : null}
      <div className="flex flex-wrap gap-3 text-sm">
        <Link className="text-[var(--mpa-color-brand-primary)] underline" href="/dashboard">
          Go to your workspace
        </Link>
        <Link className="text-[var(--mpa-color-brand-primary)] underline" href="/login">
          Sign in again
        </Link>
        <Link className="text-[var(--mpa-color-brand-primary)] underline" href="/portal/tenant">
          Resident Portal
        </Link>
        <Link className="text-[var(--mpa-color-brand-primary)] underline" href="/portal/vendor">
          Vendor Portal
        </Link>
        <Link className="text-[var(--mpa-color-brand-primary)] underline" href="/portal/owner">
          Owner Portal
        </Link>
      </div>
    </main>
  );
}
