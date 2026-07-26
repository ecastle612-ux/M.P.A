import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/cn";
import { Spinner } from "./spinner";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows spinner and disables the control (a11y: aria-busy). */
  loading?: boolean;
  children?: ReactNode;
};

/**
 * UX-012 Slice B — Button primitive (Production intent).
 * States: default / hover / focus / active / disabled / loading.
 */
export function Button({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const isDisabled = Boolean(disabled || loading);

  return (
    <button
      type={type}
      aria-busy={loading || undefined}
      disabled={isDisabled}
      className={cn(
        "inline-flex items-center justify-center gap-[var(--mpa-space-2)] rounded-[var(--mpa-radius-md)] font-[var(--mpa-font-weight-medium)] transition-all duration-[var(--mpa-duration-fast)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-border-focus)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        size === "sm" && "h-8 px-[var(--mpa-space-3)] text-[var(--mpa-font-size-caption)]",
        size === "md" && "h-9 px-[var(--mpa-space-4)] text-[var(--mpa-font-size-body)]",
        size === "lg" && "h-11 px-[var(--mpa-space-5)] text-[var(--mpa-font-size-body)]",
        variant === "primary" &&
          "bg-[var(--mpa-color-brand-primary)] font-[var(--mpa-font-weight-semibold)] text-[var(--mpa-color-text-inverse)] shadow-[var(--mpa-shadow-xs)] hover:bg-[var(--mpa-color-brand-primary-hover)] active:bg-[var(--mpa-color-brand-primary-active)]",
        variant === "secondary" &&
          "border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] text-[var(--mpa-color-text-primary)] shadow-[var(--mpa-shadow-xs)] hover:bg-[var(--mpa-color-interactive-row-hover)]",
        variant === "ghost" &&
          "text-[var(--mpa-color-text-secondary)] hover:bg-[var(--mpa-color-interactive-row-hover)] hover:text-[var(--mpa-color-text-primary)]",
        variant === "danger" &&
          "bg-[var(--mpa-color-status-danger)] text-[var(--mpa-color-text-inverse)] shadow-[var(--mpa-shadow-xs)] hover:opacity-90",
        className
      )}
      {...props}
    >
      {loading ? <Spinner className="h-3.5 w-3.5" /> : null}
      {children}
    </button>
  );
}
