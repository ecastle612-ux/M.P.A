import Link from "next/link";
import { Card } from "@mpa/ui";
import { AuthShell } from "../components/auth/auth-shell";

export default function NotFoundPage() {
  return (
    <AuthShell
      title="This page is not available."
      subtitle="The route you requested does not exist in the current portal foundation."
    >
      <Card className="w-full max-w-md space-y-4 shadow-mpa-md">
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-[var(--mpa-color-text-primary)]">
            Page not found
          </h1>
          <p className="text-sm leading-relaxed text-[var(--mpa-color-text-secondary)]">
            Check the URL, or return to a known foundation surface.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/portal"
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--mpa-radius-md)] bg-[var(--mpa-color-brand-primary)] px-4 text-sm font-medium text-[var(--mpa-color-text-inverse)] transition-colors duration-[var(--mpa-motion-fast)] hover:bg-[var(--mpa-color-brand-primary-hover)]"
          >
            Portal home
          </Link>
          <Link
            href="/login"
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-4 text-sm font-medium text-[var(--mpa-color-text-primary)] transition-colors duration-[var(--mpa-motion-fast)] hover:bg-[var(--mpa-color-bg-row-hover)]"
          >
            Sign in
          </Link>
        </div>
      </Card>
    </AuthShell>
  );
}
