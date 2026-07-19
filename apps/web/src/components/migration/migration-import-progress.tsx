"use client";

import { Progress } from "@mpa/ui";
import { OperationalStatus } from "../trust/operational-status";

const PHASES = [
  "Reading file…",
  "Validating…",
  "Matching properties…",
  "Creating residents…",
  "Creating leases…",
  "Finalizing…"
] as const;

export function MigrationImportProgress({
  active,
  completionPct
}: {
  active: boolean;
  completionPct?: number;
}) {
  if (!active) return null;

  const phaseIndex =
    typeof completionPct === "number"
      ? Math.min(PHASES.length - 1, Math.floor((completionPct / 100) * PHASES.length))
      : 0;

  return (
    <div className="space-y-3">
      {typeof completionPct === "number" ? (
        <OperationalStatus message={PHASES[phaseIndex] ?? "Importing…"} progress={completionPct} />
      ) : (
        <OperationalStatus message={PHASES[phaseIndex] ?? "Importing…"} />
      )}
      <ul className="space-y-1 text-xs text-[var(--mpa-color-text-secondary)]">
        {PHASES.map((phase, index) => (
          <li
            key={phase}
            className={index <= phaseIndex ? "font-medium text-[var(--mpa-color-text-primary)]" : undefined}
          >
            {index < phaseIndex ? "✓ " : index === phaseIndex ? "→ " : "· "}
            {phase}
          </li>
        ))}
      </ul>
      {typeof completionPct === "number" ? <Progress value={completionPct} label="Import progress" /> : null}
    </div>
  );
}
