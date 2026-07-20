import Link from "next/link";
import { Card } from "@mpa/ui";
import { Logo } from "../../components/branding/logo";

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--mpa-color-bg-app)] p-4">
      <Card className="w-full max-w-lg space-y-4 p-6">
        <Logo size="navigation" />
        <div>
          <p className="mpa-section-label text-[var(--mpa-color-brand-primary)]">Access check</p>
          <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
            You don’t have access to this page
          </h1>
        </div>
        <div className="space-y-2 text-sm text-[var(--mpa-color-text-secondary)]">
          <p>
            <span className="font-medium text-[var(--mpa-color-text-primary)]">What happened: </span>
            Your current role in this organization doesn’t include permission for that area.
          </p>
          <p>
            <span className="font-medium text-[var(--mpa-color-text-primary)]">How to fix it: </span>
            Switch organizations if you belong to more than one, or ask an administrator to grant access.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard"
            className="rounded-md bg-[var(--mpa-color-action-primary)] px-3 py-2 text-sm font-semibold text-white"
          >
            Go to Operations
          </Link>
          <Link
            href="/portal"
            className="rounded-md border border-[var(--mpa-color-border-default)] px-3 py-2 text-sm font-semibold"
          >
            Portal home
          </Link>
          <a
            href="mailto:support@mypropertyassistant.com?subject=M.P.A.%20access%20help"
            className="inline-flex items-center px-3 py-2 text-sm font-semibold text-[var(--mpa-color-brand-primary)] hover:underline"
          >
            Contact support
          </a>
        </div>
      </Card>
    </main>
  );
}
