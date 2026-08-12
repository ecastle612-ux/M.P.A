import {
  COM_002_FLAGS,
  DEMO_ISOLATION,
  DEMO_PRODUCTS,
  DEMO_RESTRICTIONS,
  DEMO_SNAPSHOT_VERSION,
  assertSnapshotIntegrity,
  demoConversionHref,
  getDemoSnapshot,
  personasForDemoProduct,
  toDemoProductLabel,
  toSkuLabel
} from "@mpa/shared";
import { listDemoSessionDiagnostics } from "../../lib/demo/session-store";

export function DemoVerificationConsole() {
  const sessions = listDemoSessionDiagnostics();

  return (
    <main className="space-y-6 p-4 md:p-6">
      <header className="space-y-2">
        <h1 className="font-display text-2xl font-semibold">Live Demo Verification</h1>
        <p className="max-w-3xl text-sm text-[var(--mpa-color-text-secondary)]">
          COM-002 Slice B operator panel — verify products, personas, dataset integrity, reset
          model, isolation, and conversion paths. Demo never writes production tenants.
        </p>
        <p className="text-xs uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          Status: aligned · snapshot {DEMO_SNAPSHOT_VERSION}
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold">Flags & isolation</h2>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <FlagCard label="sliceB_demoPlatform" value={COM_002_FLAGS.sliceB_demoPlatform} />
          <FlagCard label="foReady" value={COM_002_FLAGS.foReady} />
          <FlagCard label="sliceC_stripeCheckout" value={COM_002_FLAGS.sliceC_stripeCheckout} />
          <FlagCard label="productionDbAccess" value={DEMO_ISOLATION.productionDbAccess} />
          <FlagCard
            label="sharedSnapshotMutable"
            value={DEMO_ISOLATION.sharedSnapshotMutable}
          />
          <li className="rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-3 py-2 text-sm">
            <span className="font-mono text-xs text-[var(--mpa-color-text-muted)]">tenancyModel</span>
            <p className="mt-1 font-semibold">{DEMO_ISOLATION.tenancyModel}</p>
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold">Product demos</h2>
        <div className="overflow-x-auto rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)]">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[var(--mpa-color-bg-subtle,#F7F8FA)]">
              <tr>
                <th className="px-3 py-2">Demo</th>
                <th className="px-3 py-2">Personas</th>
                <th className="px-3 py-2">Dataset</th>
                <th className="px-3 py-2">Conversion</th>
                <th className="px-3 py-2">Open</th>
              </tr>
            </thead>
            <tbody>
              {DEMO_PRODUCTS.map((product) => {
                const issues = assertSnapshotIntegrity(getDemoSnapshot(product));
                return (
                  <tr key={product} className="border-t border-[var(--mpa-color-border-subtle)]">
                    <td className="px-3 py-2">{toDemoProductLabel(product)}</td>
                    <td className="px-3 py-2">{personasForDemoProduct(product).length}</td>
                    <td className="px-3 py-2">
                      {issues.length === 0 ? "integrity pass" : issues.join(", ")}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">
                      {demoConversionHref(product, "start_subscription")}
                    </td>
                    <td className="px-3 py-2">
                      <a
                        href={`/demo/${product}`}
                        className="font-semibold text-[var(--mpa-color-brand-primary)]"
                      >
                        Launch
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold">Boundary restrictions</h2>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(DEMO_RESTRICTIONS).map(([key, value]) => (
            <FlagCard key={key} label={key} value={value} invert />
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold">Active sessions (this instance)</h2>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          Shared snapshot + session overlay. Sessions hydrate from a signed cookie across
          serverless isolates; this list shows only what is loaded on this instance. Count:{" "}
          {sessions.length}
        </p>
        {sessions.length === 0 ? (
          <p className="text-sm text-[var(--mpa-color-text-muted)]">No active demo sessions on this instance.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {sessions.map((session) => (
              <li
                key={session.id}
                className="rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-3 py-2 font-mono text-xs"
              >
                {session.id} · {toSkuLabel(session.product)} · {session.persona} · overlayOps=
                {session.overlayOps} · analytics={session.analyticsCount}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2 text-sm text-[var(--mpa-color-text-secondary)]">
        <h2 className="font-display text-lg font-semibold text-[var(--mpa-color-text-primary)]">
          Checklist
        </h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Property Manager Demo — interactive PM surfaces + portals</li>
          <li>Facility Demo — product-shape FO surfaces + honesty banner</li>
          <li>Complete Platform Demo — PM + FO relationship bundle</li>
          <li>Role switching — instant, no logout</li>
          <li>Dataset integrity — synthetic watermarked snapshots</li>
          <li>Reset integrity — overlay clear + 30s cooldown</li>
          <li>Conversion flow — Get Started / Request Enterprise / Schedule Consultation</li>
        </ul>
      </section>
    </main>
  );
}

function FlagCard({
  label,
  value,
  invert = false
}: {
  label: string;
  value: boolean;
  invert?: boolean;
}) {
  const good = invert ? value === false : value === true;
  return (
    <li className="rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-3 py-2 text-sm">
      <span className="font-mono text-xs text-[var(--mpa-color-text-muted)]">{label}</span>
      <p className={`mt-1 font-semibold ${good ? "text-[var(--mpa-color-brand-primary)]" : ""}`}>
        {value ? "true" : "false"}
      </p>
    </li>
  );
}
