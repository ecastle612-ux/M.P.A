import type { ReactNode } from "react";
import { cn } from "../lib/cn";

type KpiTone = "default" | "success" | "warning" | "danger" | "info";

const TONE_STYLES: Record<KpiTone, string> = {
  default: "text-[var(--mpa-color-text-primary)]",
  success: "text-[var(--mpa-color-status-success)]",
  warning: "text-[var(--mpa-color-status-warning)]",
  danger: "text-[var(--mpa-color-status-danger)]",
  info: "text-[var(--mpa-color-status-info)]"
};

export function KpiMetric({
  label,
  value,
  hint,
  href,
  tone = "default",
  footer,
  className
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  href?: string;
  tone?: KpiTone;
  footer?: ReactNode;
  className?: string;
}) {
  const content = (
    <>
      <p className="mpa-section-label">{label}</p>
      <p className={cn("mt-1 font-display text-2xl font-semibold tabular-nums tracking-tight", TONE_STYLES[tone])}>
        {value}
      </p>
      {hint ? (
        <p className="mt-1.5 text-xs text-[var(--mpa-color-text-link)] opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          {hint} →
        </p>
      ) : null}
      {footer ? <div className="mt-2">{footer}</div> : null}
    </>
  );

  const shellClass = cn(
    "group block rounded-[var(--mpa-radius-lg)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] p-3.5 shadow-[var(--mpa-shadow-xs)] transition-all duration-[var(--mpa-duration-normal)] hover:border-[var(--mpa-color-border-default)] hover:shadow-[var(--mpa-shadow-sm)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--mpa-color-border-focus)] md:p-4",
    className
  );

  if (href) {
    return (
      <a href={href} aria-label={`${label}: ${value}. ${hint ?? ""}`} className={shellClass}>
        {content}
      </a>
    );
  }

  return <div className={shellClass}>{content}</div>;
}
