import { cn } from "../lib/cn";

export function Progress({
  value,
  label,
  className
}: {
  /** 0–100; omit for indeterminate */
  value?: number;
  label?: string;
  className?: string;
}) {
  const determinate = typeof value === "number" && Number.isFinite(value);
  const clamped = determinate ? Math.max(0, Math.min(100, value)) : 0;

  return (
    <div className={cn("w-full space-y-1", className)} role="status" aria-live="polite">
      {label ? (
        <p className="text-xs font-medium text-[var(--mpa-color-text-secondary)]">{label}</p>
      ) : null}
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-[var(--mpa-color-bg-surface-muted)]"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={determinate ? Math.round(clamped) : undefined}
        aria-label={label ?? "Progress"}
      >
        {determinate ? (
          <div
            className="h-full rounded-full bg-[var(--mpa-color-brand-primary)] transition-[width] duration-300 ease-out"
            style={{ width: `${clamped}%` }}
          />
        ) : (
          <div className="h-full w-1/3 rounded-full bg-[var(--mpa-color-brand-primary)] motion-safe:animate-[mpa-progress-indeterminate_1.4s_ease-in-out_infinite]" />
        )}
      </div>
    </div>
  );
}
