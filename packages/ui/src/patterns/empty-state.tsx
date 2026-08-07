import type { ReactNode } from "react";
import { cn } from "../lib/cn";

export function EmptyState({
  title,
  description,
  action,
  density = "default",
  className
}: {
  title: string;
  description: string;
  action?: ReactNode;
  /** `inline` for queue/timeline wells inside consoles. */
  density?: "default" | "inline";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-start gap-3 rounded-md border border-dashed border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-subtle)]",
        density === "default" && "px-4 py-6",
        density === "inline" && "gap-2 px-3 py-4",
        className
      )}
    >
      <div>
        <h3
          className={cn(
            "font-semibold text-[var(--mpa-color-text-primary)]",
            density === "default" ? "text-sm" : "text-xs"
          )}
        >
          {title}
        </h3>
        <p
          className={cn(
            "mt-1 max-w-prose text-[var(--mpa-color-text-secondary)]",
            density === "default" ? "text-sm" : "text-xs"
          )}
        >
          {description}
        </p>
      </div>
      {action ? <div className="flex flex-wrap gap-2">{action}</div> : null}
    </div>
  );
}
