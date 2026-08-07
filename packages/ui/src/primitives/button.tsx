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
        "inline-flex items-center justify-center rounded-md font-medium transition-colors duration-[var(--mpa-motion-fast,120ms)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-border-focus)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        size === "sm" && "h-8 px-3 text-sm",
        size === "md" && "h-9 px-4 text-sm",
        size === "lg" && "h-10 px-5 text-base",
        variant === "primary" &&
          "bg-[var(--mpa-color-brand-primary)] text-white hover:bg-[var(--mpa-color-brand-primary-hover)]",
        variant === "secondary" &&
          "border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] text-[var(--mpa-color-text-primary)] hover:bg-[var(--mpa-color-bg-subtle)]",
        variant === "ghost" &&
          "text-[var(--mpa-color-text-secondary)] hover:bg-[var(--mpa-color-bg-subtle)] hover:text-[var(--mpa-color-text-primary)]",
        variant === "danger" &&
          "bg-[var(--mpa-color-status-danger)] text-white hover:opacity-90",
        className
      )}
      {...props}
    />
  );
}
