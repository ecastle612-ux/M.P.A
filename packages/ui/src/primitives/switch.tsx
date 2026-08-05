"use client";

import { useId } from "react";
import { cn } from "../lib/cn";

export type SwitchProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
};

export function Switch({
  checked,
  onCheckedChange,
  disabled = false,
  label,
  className
}: SwitchProps) {
  const id = useId();
  return (
    <label htmlFor={id} className={cn("inline-flex min-h-11 items-center gap-2", className)}>
      <button
        id={id}
        role="switch"
        aria-checked={checked}
        aria-label={label ?? "Toggle switch"}
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          "relative h-6 w-11 rounded-full transition-colors duration-[var(--mpa-motion-fast)] ease-[var(--mpa-ease-standard)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-brand-primary)]/25 disabled:cursor-not-allowed disabled:opacity-50",
          checked ? "bg-[var(--mpa-color-brand-primary)]" : "bg-[var(--mpa-color-border-strong)]",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-mpa-sm transition-transform duration-[var(--mpa-motion-fast)] ease-[var(--mpa-ease-standard)]",
            checked ? "translate-x-5" : "translate-x-0.5",
          )}
        />
      </button>
      {label ? <span className="text-sm text-[var(--mpa-color-text-primary)]">{label}</span> : null}
    </label>
  );
}
