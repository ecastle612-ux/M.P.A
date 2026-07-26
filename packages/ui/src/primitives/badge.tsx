import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn";

export type BadgeVariant = "neutral" | "success" | "warning" | "danger" | "info";

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
  showDot?: boolean;
};

const STATUS_DOT: Record<BadgeVariant, string> = {
  neutral: "bg-[var(--mpa-color-text-muted)]",
  success: "bg-[var(--mpa-color-status-success)]",
  warning: "bg-[var(--mpa-color-status-warning)]",
  danger: "bg-[var(--mpa-color-status-danger)]",
  info: "bg-[var(--mpa-color-status-info)]"
};

export function Badge({
  className,
  variant = "neutral",
  showDot = false,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-[var(--mpa-space-1)] rounded-full px-[var(--mpa-space-2)] py-[var(--mpa-space-1)] text-[var(--mpa-font-size-micro)] font-[var(--mpa-font-weight-medium)] leading-none",
        variant === "neutral" && "bg-[var(--mpa-color-bg-surface-muted)] text-[var(--mpa-color-text-secondary)]",
        variant === "success" && "bg-[var(--mpa-color-status-success-subtle)] text-[var(--mpa-color-status-success)]",
        variant === "warning" && "bg-[var(--mpa-color-status-warning-subtle)] text-[var(--mpa-color-status-warning)]",
        variant === "danger" && "bg-[var(--mpa-color-status-danger-subtle)] text-[var(--mpa-color-status-danger)]",
        variant === "info" && "bg-[var(--mpa-color-status-info-subtle)] text-[var(--mpa-color-status-info)]",
        className
      )}
      {...props}
    >
      {showDot ? (
        <span className={cn("inline-block h-1.5 w-1.5 shrink-0 rounded-full", STATUS_DOT[variant])} aria-hidden="true" />
      ) : null}
      {props.children}
    </span>
  );
}
