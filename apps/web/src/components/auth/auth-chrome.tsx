import Link from "next/link";
import type { ReactNode } from "react";

/** Minimal brand chrome for auth surfaces (Login / Sign Up / password flows). */
export function AuthChrome({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col bg-[var(--mpa-color-bg-app)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,#0B1F1A_0%,#0F6B56_38%,#F3F4F6_38%)] opacity-90"
      />
      <header className="relative z-10 mx-auto flex w-full max-w-md items-center justify-between px-4 pt-8">
        <Link
          href="/"
          className="font-display text-sm font-semibold tracking-wide text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        >
          My Property Assistant
        </Link>
        <Link
          href="/pricing"
          className="text-sm font-medium text-white/85 underline-offset-2 hover:text-white hover:underline"
        >
          Pricing
        </Link>
      </header>
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md motion-safe:animate-[mpa-rise_500ms_ease-out]">{children}</div>
      </main>
    </div>
  );
}

export function AuthLoadingCard({ label = "Loading…" }: { label?: string }) {
  return (
    <div
      className="w-full max-w-md rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-6 shadow-sm"
      role="status"
      aria-live="polite"
    >
      <p className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">M.P.A.</p>
      <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">{label}</p>
      <div
        className="mt-4 h-1.5 w-32 overflow-hidden rounded-full bg-[var(--mpa-color-bg-subtle,#F7F8FA)]"
        aria-hidden
      >
        <div className="h-full w-1/2 animate-pulse rounded-full bg-[var(--mpa-color-brand-primary)]" />
      </div>
    </div>
  );
}
