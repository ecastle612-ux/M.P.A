import { Card } from "@mpa/ui";
import type { ProviderStatusItem } from "../../lib/integrations/provider-status";

function statusTone(status: ProviderStatusItem["status"]): string {
  if (status === "production_ready") {
    return "bg-[var(--mpa-color-feedback-success-soft,rgba(22,163,74,0.12))] text-[var(--mpa-color-feedback-success,#15803d)]";
  }
  if (status === "connected") {
    return "bg-[var(--mpa-color-feedback-info-soft,rgba(37,99,235,0.12))] text-[var(--mpa-color-feedback-info,#1d4ed8)]";
  }
  if (status === "sandbox") {
    return "bg-[var(--mpa-color-feedback-warning-soft,rgba(217,119,6,0.12))] text-[var(--mpa-color-feedback-warning,#b45309)]";
  }
  if (status === "configuration_required") {
    return "bg-[var(--mpa-color-feedback-danger-soft,rgba(220,38,38,0.12))] text-[var(--mpa-color-feedback-danger,#b91c1c)]";
  }
  return "bg-[var(--mpa-color-surface-muted)] text-[var(--mpa-color-text-secondary)]";
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] gap-2 text-xs">
      <dt className="font-medium text-[var(--mpa-color-text-muted)]">{label}</dt>
      <dd className="text-[var(--mpa-color-text-secondary)]">{value}</dd>
    </div>
  );
}

export function ProviderStatusCenter({ providers }: { providers: ProviderStatusItem[] }) {
  const attention = providers.filter(
    (provider) =>
      provider.status === "configuration_required" ||
      provider.status === "disabled" ||
      provider.status === "sandbox" ||
      Boolean(provider.lastError)
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-xl font-semibold text-[var(--mpa-color-text-primary)]">
          Integrations
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-[var(--mpa-color-text-secondary)]">
          Provider Health Dashboard. Status reflects environment configuration and read-only API probes —
          never assume a Disabled, Sandbox, or Configuration Required provider is live for residents.
          Secrets are never displayed.
        </p>
      </div>

      {attention.length > 0 ? (
        <Card className="space-y-2 border-[var(--mpa-color-feedback-warning,#b45309)]/30">
          <p className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">Needs attention</p>
          <ul className="space-y-1 text-xs text-[var(--mpa-color-text-secondary)]">
            {attention.map((provider) => (
              <li key={provider.id}>
                <span className="font-medium text-[var(--mpa-color-text-primary)]">{provider.name}</span>
                {" — "}
                {provider.statusLabel}
                {provider.lastError ? ` · ${provider.lastError}` : ""}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {providers.map((provider) => (
          <Card key={provider.id} className="flex flex-col space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-[var(--mpa-color-text-tertiary)]">
                  {provider.category}
                </p>
                <h2 className="mt-1 text-base font-semibold text-[var(--mpa-color-text-primary)]">
                  {provider.name}
                </h2>
              </div>
              <span
                className={`shrink-0 rounded-md px-2 py-1 text-xs font-semibold ${statusTone(provider.status)}`}
              >
                {provider.statusLabel}
              </span>
            </div>

            <dl className="space-y-1.5">
              <MetaRow label="Connection" value={provider.statusLabel} />
              <MetaRow label="Environment" value={provider.environment} />
              {provider.id === "resend" ? (
                <>
                  <MetaRow
                    label="Verified domain"
                    value={provider.verifiedDomain ?? "Not probed"}
                  />
                  <MetaRow
                    label="Last delivery"
                    value={provider.lastDelivery ?? "No delivery yet"}
                  />
                </>
              ) : null}
              <MetaRow
                label="Last success"
                value={provider.lastCommunication ?? "No successful probe yet"}
              />
              <MetaRow label="Last failure" value={provider.lastError ?? "None recorded"} />
              <MetaRow
                label="Webhooks"
                value={
                  provider.webhookReady === null
                    ? "Not applicable"
                    : provider.webhookReady
                      ? "Secret configured"
                      : "Secret missing"
                }
              />
            </dl>

            <p className="text-sm text-[var(--mpa-color-text-secondary)]">{provider.guidance}</p>
            <p className="mt-auto border-t border-[var(--mpa-color-border-subtle)] pt-3 text-xs text-[var(--mpa-color-text-primary)]">
              <span className="font-semibold">Next action: </span>
              {provider.nextAction}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
