import type { ReactNode } from "react";
import { cn } from "../lib/cn";

export type MetricCardTone = "neutral" | "brand" | "success" | "warning" | "danger";

const toneClasses: Record<MetricCardTone, string> = {
  neutral: "border-[var(--mpa-color-border-default)] border-l-[3px] border-l-[var(--mpa-color-border-default)] bg-white",
  brand:
    "border-[var(--mpa-color-brand-primary)]/25 border-l-[3px] border-l-[var(--mpa-color-brand-primary)] bg-[var(--mpa-color-brand-primary-subtle,#E6F4EF)]",
  success:
    "border-[var(--mpa-color-status-success)]/25 border-l-[3px] border-l-[var(--mpa-color-status-success,#0E7A57)] bg-[var(--mpa-color-status-success-subtle,#E3F5EE)]",
  warning:
    "border-[var(--mpa-color-status-warning)]/30 border-l-[3px] border-l-[var(--mpa-color-status-warning,#B45309)] bg-[var(--mpa-color-status-warning-subtle,#FEF3C7)]",
  danger:
    "border-[var(--mpa-color-status-danger)]/25 border-l-[3px] border-l-[var(--mpa-color-status-danger,#C0392B)] bg-[var(--mpa-color-status-danger-subtle,#FCE8E6)]"
};

const labelClasses: Record<MetricCardTone, string> = {
  neutral: "text-[var(--mpa-color-text-muted)]",
  brand: "text-[var(--mpa-color-brand-primary)]",
  success: "text-[var(--mpa-color-status-success,#0E7A57)]",
  warning: "text-[var(--mpa-color-status-warning,#B45309)]",
  danger: "text-[var(--mpa-color-status-danger,#C0392B)]"
};

export function MetricCard({
  label,
  value,
  hint,
  tone = "neutral",
  size = "metric",
  className
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: MetricCardTone;
  size?: "metric" | "copy";
  className?: string;
}) {
  return (
    <article className={cn("rounded-lg border px-3.5 py-3.5 shadow-[0_1px_0_rgba(18,21,26,0.04)]", toneClasses[tone], className)}>
      <p className={cn("text-[10px] font-semibold uppercase tracking-wide", labelClasses[tone])}>
        {label}
      </p>
      <p
        className={cn(
          "mt-1 font-semibold text-[var(--mpa-color-text-primary)]",
          size === "metric"
            ? "font-display text-2xl tabular-nums"
            : "text-sm font-medium leading-5"
        )}
      >
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-xs leading-5 text-[var(--mpa-color-text-secondary)]">{hint}</p>
      ) : null}
    </article>
  );
}
