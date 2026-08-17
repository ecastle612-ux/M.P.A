import type { ReactNode } from "react";
import { cn } from "../lib/cn";

export function FormField({
  id,
  label,
  required,
  optional,
  hint,
  error,
  children,
  className
}: {
  id?: string;
  label: string;
  required?: boolean;
  optional?: boolean;
  hint?: string;
  error?: string | null;
  children: ReactNode;
  className?: string;
}) {
  const hintId = id ? `${id}-hint` : undefined;
  const errorId = id ? `${id}-error` : undefined;
  return (
    <div className={cn("space-y-1.5", className)}>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-[var(--mpa-color-text-primary)]"
      >
        {label}
        {required ? (
          <span className="ml-1 text-xs font-normal text-[var(--mpa-color-text-muted)]">(required)</span>
        ) : null}
        {optional ? (
          <span className="ml-1 text-xs font-normal text-[var(--mpa-color-text-muted)]">(optional)</span>
        ) : null}
      </label>
      {children}
      {hint ? (
        <p id={hintId} className="text-xs leading-5 text-[var(--mpa-color-text-secondary)]">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="text-sm text-[var(--mpa-color-text-danger,#B42318)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
