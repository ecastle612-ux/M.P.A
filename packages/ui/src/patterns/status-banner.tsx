import type { ReactNode } from "react";
import { cn } from "../lib/cn";

type StatusBannerVariant = "success" | "danger" | "warning" | "info" | "neutral";

export function StatusBanner({
  variant = "neutral",
  children,
  className
}: {
  variant?: StatusBannerVariant;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      role={variant === "danger" ? "alert" : "status"}
      className={cn(
        "rounded-md border px-3 py-2 text-sm",
        variant === "success" &&
          "border-[var(--mpa-color-status-success)]/30 bg-[var(--mpa-color-status-success-subtle)] text-[var(--mpa-color-status-success)]",
        variant === "danger" &&
          "border-[var(--mpa-color-status-danger)]/30 bg-[var(--mpa-color-status-danger-subtle)] text-[var(--mpa-color-status-danger)]",
        variant === "warning" &&
          "border-[var(--mpa-color-status-warning)]/30 bg-[var(--mpa-color-status-warning-subtle)] text-[var(--mpa-color-status-warning)]",
        variant === "info" &&
          "border-[var(--mpa-color-status-info)]/30 bg-[var(--mpa-color-status-info-subtle)] text-[var(--mpa-color-status-info)]",
        variant === "neutral" &&
          "border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-subtle)] text-[var(--mpa-color-text-secondary)]",
        className
      )}
    >
      {children}
    </div>
  );
}
