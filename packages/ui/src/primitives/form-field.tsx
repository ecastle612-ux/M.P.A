import type { ReactNode } from "react";
import { cn } from "../lib/cn";

export type FormFieldProps = {
  label: string;
  children: ReactNode;
  /** Required — associates label with control `id` for a11y. */
  htmlFor: string;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  className?: string;
};

/**
 * UX-012 Slice B — Form field pattern: label + control + hint + error.
 * RSC-safe (no hooks). Pair `htmlFor` with the control `id`.
 */
export function FormField({
  label,
  children,
  hint,
  error,
  htmlFor,
  required = false,
  className
}: FormFieldProps) {
  const hintId = hint ? `${htmlFor}-hint` : undefined;
  const errorId = error ? `${htmlFor}-error` : undefined;

  return (
    <div className={cn("space-y-[var(--mpa-space-1)]", className)}>
      <label
        htmlFor={htmlFor}
        className="mpa-text-caption font-[var(--mpa-font-weight-medium)] text-[var(--mpa-color-text-secondary)]"
      >
        {label}
        {required ? (
          <span className="text-[var(--mpa-color-status-danger)]" aria-hidden="true">
            {" "}
            *
          </span>
        ) : null}
      </label>
      {children}
      {hint && !error ? (
        <p id={hintId} className="mpa-text-micro text-[var(--mpa-color-text-muted)]">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p
          id={errorId}
          role="alert"
          className="mpa-text-caption text-[var(--mpa-color-status-danger)]"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Destructive confirm verb helper — prefer explicit verbs (“Delete property”).
 */
export function destructiveConfirmLabel(noun: string, verb = "Delete"): string {
  const trimmed = noun.trim();
  if (!trimmed) return verb;
  return `${verb} ${trimmed}`;
}
