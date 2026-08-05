import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn";

type BadgeVariant = "neutral" | "success" | "warning" | "danger" | "info";

export function Badge({
  className,
  variant = "neutral",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[var(--mpa-radius-sm)] px-2 py-0.5 text-xs font-medium",
        variant === "neutral" && "bg-[var(--mpa-color-bg-surface-muted)] text-[var(--mpa-color-text-secondary)]",
        variant === "success" &&
          "bg-[var(--mpa-color-status-success-subtle)] text-[var(--mpa-color-status-success)]",
        variant === "warning" &&
          "bg-[var(--mpa-color-status-warning-subtle)] text-[var(--mpa-color-status-warning)]",
        variant === "danger" &&
          "bg-[var(--mpa-color-status-danger-subtle)] text-[var(--mpa-color-status-danger)]",
        variant === "info" &&
          "bg-[var(--mpa-color-status-info-subtle)] text-[var(--mpa-color-status-info)]",
        className,
      )}
      {...props}
    />
  );
}
