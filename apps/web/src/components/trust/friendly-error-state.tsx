"use client";

import Link from "next/link";
import { Button, Card } from "@mpa/ui";
import { Logo } from "../branding/logo";
import { humanizeErrorMessage } from "../../lib/api/client-error";

const SUPPORT_HREF = "mailto:support@mypropertyassistant.com?subject=M.P.A.%20help";

export function FriendlyErrorState({
  title = "Something went wrong",
  whatHappened,
  howToFix = "Try again in a moment. If it keeps happening, contact support with what you were doing.",
  error,
  onRetry,
  secondaryHref = "/dashboard",
  secondaryLabel = "Back to Operations"
}: {
  title?: string;
  whatHappened?: string;
  howToFix?: string;
  error?: Error;
  onRetry?: () => void;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  const detail = whatHappened ?? (error ? humanizeErrorMessage(error.message) : "We hit an unexpected problem.");

  return (
    <main className="mpa-page flex min-h-[50vh] items-center justify-center">
      <Card className="w-full max-w-xl space-y-4 p-6">
        <Logo size="navigation" />
        <div>
          <p className="mpa-section-label text-[var(--mpa-color-brand-primary)]">We’re on it</p>
          <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">{title}</h1>
        </div>
        <div className="space-y-2 text-sm text-[var(--mpa-color-text-secondary)]">
          <p>
            <span className="font-medium text-[var(--mpa-color-text-primary)]">What happened: </span>
            {detail}
          </p>
          <p>
            <span className="font-medium text-[var(--mpa-color-text-primary)]">How to fix it: </span>
            {howToFix}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {onRetry ? <Button onClick={onRetry}>Retry</Button> : null}
          <Link href={secondaryHref}>
            <Button variant="secondary">{secondaryLabel}</Button>
          </Link>
          <Link
            href={SUPPORT_HREF}
            className="inline-flex items-center text-sm font-semibold text-[var(--mpa-color-brand-primary)] hover:underline"
          >
            Contact support
          </Link>
        </div>
      </Card>
    </main>
  );
}
