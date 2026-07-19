"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, Select } from "@mpa/ui";
import { MIGRATION_SOURCE_SOFTWARE, toMigrationSourceLabel } from "../../lib/migration/contracts";
import { readApiError } from "../../lib/api/client-error";
import { ApiErrorAlert } from "../trust/validation-alert";
import { OperationalStatus } from "../trust/operational-status";
import { PORTFOLIO_GUIDE_PHASES } from "../../lib/migration/guide";

export function MigrationWizardStarter() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [sourceSoftware, setSourceSoftware] = useState("custom");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="mx-auto grid max-w-4xl gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <Card className="space-y-4 p-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
            Bring your portfolio into M.P.A.
          </h1>
          <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
            We’ll guide you through Properties, Units, Residents, Leases, and Vendors — then preview everything before
            any live records are created.
          </p>
        </div>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-[var(--mpa-color-text-primary)]">Migration name</span>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="AppFolio portfolio import"
            aria-label="Migration name"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-[var(--mpa-color-text-primary)]">
            Previous property management software
          </span>
          <Select
            value={sourceSoftware}
            onChange={(event) => setSourceSoftware(event.target.value)}
            aria-label="Source software"
          >
            {MIGRATION_SOURCE_SOFTWARE.map((source) => (
              <option key={source} value={source}>
                {toMigrationSourceLabel(source)}
              </option>
            ))}
          </Select>
        </label>
        {error ? <ApiErrorAlert message={error} /> : null}
        {loading ? <OperationalStatus message="Starting migration…" /> : null}
        <Button
          type="button"
          disabled={loading || name.trim().length < 2}
          onClick={async () => {
            setLoading(true);
            setError(null);
            const response = await fetch("/api/migration/jobs", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name: name.trim(), sourceSoftware })
            });
            setLoading(false);
            if (!response.ok) {
              const payload = await response.json().catch(() => ({}));
              setError(readApiError(payload, "Could not create migration job. Please try again."));
              return;
            }
            const payload = (await response.json()) as { job?: { id: string } };
            if (payload.job?.id) router.push(`/migration/${payload.job.id}`);
          }}
        >
          Start guided migration
        </Button>
      </Card>

      <Card className="space-y-3 p-6">
        <h2 className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">What to expect</h2>
        <ol className="space-y-2 text-sm text-[var(--mpa-color-text-secondary)]">
          {PORTFOLIO_GUIDE_PHASES.slice(0, 7).map((phase, index) => (
            <li key={phase.id} className="flex gap-2">
              <span className="font-semibold text-[var(--mpa-color-brand-primary)]">{index + 1}.</span>
              <span>
                <span className="font-medium text-[var(--mpa-color-text-primary)]">{phase.label}</span>
                {" — "}
                {phase.description}
              </span>
            </li>
          ))}
        </ol>
        <p className="text-xs text-[var(--mpa-color-text-secondary)]">
          Tip: export CSV or Excel from your current system. Downloadable templates are available on each upload step.
        </p>
      </Card>
    </div>
  );
}
