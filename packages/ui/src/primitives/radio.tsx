import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/cn";

export type RadioProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label?: ReactNode;
};

/**
 * UX-012 Slice B — Radio primitive with optional label.
 * States: on / off / disabled + labeled.
 */
export function Radio({ className, label, id, disabled, ...props }: RadioProps) {
  const control = (
    <input
      id={id}
      type="radio"
      disabled={disabled}
      className={cn(
        "h-4 w-4 border border-[var(--mpa-color-border-default)] text-[var(--mpa-color-brand-primary)] focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-brand-primary)]/25 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );

  if (label == null) return control;

  return (
    <label
      htmlFor={id}
      className={cn(
        "inline-flex items-center gap-[var(--mpa-space-2)] mpa-text-body text-[var(--mpa-color-text-primary)]",
        disabled && "cursor-not-allowed opacity-50"
      )}
    >
      {control}
      <span>{label}</span>
    </label>
  );
}
