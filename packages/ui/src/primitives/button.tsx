import type { ButtonHTMLAttributes } from "react";
import { cn } from "../lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center rounded-[var(--mpa-radius-md)] font-medium transition-[color,background-color,border-color,box-shadow,transform] duration-[var(--mpa-motion-fast)] ease-[var(--mpa-ease-standard)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-brand-primary)]/25 focus-visible:ring-offset-2 active:scale-[0.98] disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-[var(--mpa-color-interactive-disabled-bg)] disabled:text-[var(--mpa-color-interactive-disabled-text)] disabled:opacity-100 disabled:active:scale-100",
        size === "sm" && "h-8 min-h-8 px-3 text-sm",
        size === "md" && "h-9 min-h-9 px-4 text-sm",
        size === "lg" && "h-10 min-h-10 px-5 text-base",
        variant === "primary" &&
          "bg-[var(--mpa-color-brand-primary)] text-[var(--mpa-color-text-inverse)] hover:bg-[var(--mpa-color-brand-primary-hover)] active:bg-[var(--mpa-color-brand-primary-active)] disabled:bg-[var(--mpa-color-interactive-disabled-bg)]",
        variant === "secondary" &&
          "border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] text-[var(--mpa-color-text-primary)] hover:bg-[var(--mpa-color-bg-row-hover)] hover:border-[var(--mpa-color-border-strong)]",
        variant === "ghost" &&
          "text-[var(--mpa-color-text-secondary)] hover:bg-[var(--mpa-color-bg-surface-muted)] hover:text-[var(--mpa-color-text-primary)]",
        variant === "danger" &&
          "bg-[var(--mpa-color-status-danger)] text-white hover:bg-[#A93226]",
        className,
      )}
      {...props}
    />
  );
}
