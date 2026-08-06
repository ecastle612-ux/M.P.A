import { J1CertificationPanel } from "../../../../components/admin/j1-certification-panel";

export default function Page() {
  return (
    <main className="space-y-6 p-4 md:p-6">
      <section className="space-y-2">
        <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
          Launch Readiness
        </h1>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          Customer Promise launch evidence. J0 certified; verify J1 below. Overall GO still requires
          J2–J8.
        </p>
        <p className="text-xs uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          Status: aligned
        </p>
      </section>
      <J1CertificationPanel />
    </main>
  );
}
