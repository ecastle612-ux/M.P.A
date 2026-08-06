import type { ReactNode } from "react";
import { cn } from "../lib/cn";

export type TimelineViewItem = {
  id: string;
  title: string;
  detail?: string;
  meta?: ReactNode;
  occurredAtLabel?: string;
};

export function TimelineView({
  items,
  empty,
  className
}: {
  items: TimelineViewItem[];
  empty?: ReactNode;
  className?: string;
}) {
  if (items.length === 0) {
    return <>{empty}</>;
  }

  return (
    <ol className={cn("space-y-3", className)} aria-label="Timeline">
      {items.map((item) => (
        <li key={item.id} className="relative border-l-2 border-[var(--mpa-color-border-default)] pl-4">
          <span
            aria-hidden
            className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-[var(--mpa-color-brand-primary)]"
          />
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm font-medium text-[var(--mpa-color-text-primary)]">{item.title}</p>
            {item.occurredAtLabel ? (
              <time className="text-xs text-[var(--mpa-color-text-secondary)]">{item.occurredAtLabel}</time>
            ) : null}
          </div>
          {item.detail ? (
            <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">{item.detail}</p>
          ) : null}
          {item.meta ? <div className="mt-2">{item.meta}</div> : null}
        </li>
      ))}
    </ol>
  );
}
