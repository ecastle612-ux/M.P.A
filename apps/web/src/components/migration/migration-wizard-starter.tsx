"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, Select } from "@mpa/ui";
import { MIGRATION_SOURCE_SOFTWARE, toMigrationSourceLabel } from "../../lib/migration/contracts";

export function MigrationWizardStarter() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [sourceSoftware, setSourceSoftware] = useState("custom");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <Card className="mx-auto max-w-xl space-y-4 p-6">
      <div>
        <h1 className="text-xl font-semibold text-[var(--mpa-color-text-primary)]">Start a new migration</h1>
        <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
          Name this migration so your team can find it later — for example, &quot;AppFolio portfolio import&quot;.
        </p>
      </div>
      <label className="block text-sm">
        <span className="mb-1 block font-medium">Migration name</span>
        <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Portfolio import" />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium">Source software</span>
        <Select value={sourceSoftware} onChange={(event) => setSourceSoftware(event.target.value)}>
          {MIGRATION_SOURCE_SOFTWARE.map((source) => (
            <option key={source} value={source}>
              {toMigrationSourceLabel(source)}
            </option>
          ))}
        </Select>
      </label>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
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
            setError("Could not create migration job. Please try again.");
            return;
          }
          const payload = (await response.json()) as { job?: { id: string } };
          if (payload.job?.id) router.push(`/migration/${payload.job.id}`);
        }}
      >
        Continue to upload
      </Button>
    </Card>
  );
}
