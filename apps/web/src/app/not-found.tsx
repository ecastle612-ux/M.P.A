import Link from "next/link";
import { Card } from "@mpa/ui";
import { BrandLogo } from "../components/branding/brand-logo";

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--mpa-color-bg-app)] p-4">
      <Card className="w-full max-w-lg space-y-4 p-6">
        <BrandLogo purpose="header" />
        <div>
          <p className="mpa-section-label text-[var(--mpa-color-brand-primary)]">Page missing</p>
          <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
            We can’t find that page
          </h1>
        </div>
        <div className="space-y-2 text-sm text-[var(--mpa-color-text-secondary)]">
          <p>
            <span className="font-medium text-[var(--mpa-color-text-primary)]">What happened: </span>
            The link may be outdated, mistyped, or the item was moved.
          </p>
          <p>
            <span className="font-medium text-[var(--mpa-color-text-primary)]">How to fix it: </span>
            Return to Operations Center or your portal home and navigate from there.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard"
            className="rounded-md bg-[var(--mpa-color-action-primary)] px-3 py-2 text-sm font-semibold text-white"
          >
            Operations Center
          </Link>
          <Link
            href="/portal"
            className="rounded-md border border-[var(--mpa-color-border-default)] px-3 py-2 text-sm font-semibold"
          >
            Portal home
          </Link>
          <Link href="/login" className="rounded-md border border-[var(--mpa-color-border-default)] px-3 py-2 text-sm">
            Sign in
          </Link>
        </div>
      </Card>
    </main>
  );
}
