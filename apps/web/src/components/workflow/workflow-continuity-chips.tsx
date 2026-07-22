import Link from "next/link";
import { Button } from "@mpa/ui";

export type ContinuityChip = {
  id: string;
  label: string;
  href: string;
  variant?: "primary" | "secondary" | "ghost";
};

/**
 * DPX-002 — contextual next steps after lease / payment screens.
 * Keeps the operator in the resident/property workflow without back-hunting.
 */
export function WorkflowContinuityChips({
  chips,
  "aria-label": ariaLabel = "Continue workflow"
}: {
  chips: ContinuityChip[];
  "aria-label"?: string;
}) {
  const visible = chips.filter((chip) => Boolean(chip.href));
  if (visible.length === 0) return null;

  return (
    <nav
      aria-label={ariaLabel}
      className="flex flex-wrap items-center gap-2 rounded-[var(--mpa-radius-lg)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface-muted)]/60 px-3 py-2.5"
    >
      <span className="mr-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--mpa-color-text-muted)]">
        Continue
      </span>
      {visible.map((chip) => (
        <Link key={chip.id} href={chip.href}>
          <Button type="button" size="sm" variant={chip.variant ?? "secondary"}>
            {chip.label}
          </Button>
        </Link>
      ))}
    </nav>
  );
}
