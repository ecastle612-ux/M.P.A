import type { ReactNode } from "react";

export function AuthShell({
  children,
  eyebrow = "My Property Assistant",
  title,
  subtitle
}: {
  children: ReactNode;
  eyebrow?: string;
  title: string;
  subtitle: string;
}) {
  return (
    <main className="mpa-safe-pad relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_600px_at_10%_-10%,color-mix(in_srgb,var(--mpa-color-brand-primary)_18%,transparent),transparent_60%),radial-gradient(900px_500px_at_90%_110%,color-mix(in_srgb,var(--mpa-color-brand-primary)_12%,transparent),transparent_55%),linear-gradient(180deg,var(--mpa-color-bg-app),#e8ebef)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(var(--mpa-color-text-primary) 1px, transparent 1px), linear-gradient(90deg, var(--mpa-color-text-primary) 1px, transparent 1px)",
          backgroundSize: "48px 48px"
        }}
      />

      <div className="relative z-10 grid w-full max-w-5xl gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <section className="mpa-page-enter hidden space-y-4 px-2 lg:block">
          <p className="font-display text-5xl font-semibold tracking-tight text-[var(--mpa-color-text-primary)]">
            M.P.A.
          </p>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-[var(--mpa-color-brand-primary)]">
            {eyebrow}
          </p>
          <h1 className="max-w-md font-display text-3xl font-semibold leading-tight tracking-tight text-[var(--mpa-color-text-primary)]">
            {title}
          </h1>
          <p className="max-w-md text-base leading-relaxed text-[var(--mpa-color-text-secondary)]">
            {subtitle}
          </p>
        </section>

        <section className="mpa-page-enter mx-auto w-full max-w-md lg:mx-0">
          <div className="mb-5 space-y-1 lg:hidden">
            <p className="font-display text-3xl font-semibold tracking-tight text-[var(--mpa-color-text-primary)]">
              M.P.A.
            </p>
            <p className="text-sm text-[var(--mpa-color-text-secondary)]">{subtitle}</p>
          </div>
          {children}
        </section>
      </div>
    </main>
  );
}
