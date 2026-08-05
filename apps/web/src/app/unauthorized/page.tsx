import Link from "next/link";
import { Card } from "@mpa/ui";
import { AuthShell } from "../../components/auth/auth-shell";

export default function UnauthorizedPage() {
  return (
    <AuthShell
      title="You do not have access here."
      subtitle="Your current role or organization context does not allow this route."
    >
      <Card className="w-full max-w-md space-y-4 shadow-mpa-md">
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-[var(--mpa-color-text-primary)]">
            Unauthorized
          </h1>
          <p className="text-sm leading-relaxed text-[var(--mpa-color-text-secondary)]">
            Switch organization or role, or return to a portal you can access.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/portal"
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--mpa-radius-md)] bg-[var(--mpa-color-brand-primary)] px-4 text-sm font-medium text-[var(--mpa-color-text-inverse)] transition-colors duration-[var(--mpa-motion-fast)] hover:bg-[var(--mpa-color-brand-primary-hover)]"
          >
            Go to portal
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-4 text-sm font-medium text-[var(--mpa-color-text-primary)] transition-colors duration-[var(--mpa-motion-fast)] hover:bg-[var(--mpa-color-bg-row-hover)]"
          >
            Go to dashboard
          </Link>
        </div>
      </Card>
    </AuthShell>
  );
}
