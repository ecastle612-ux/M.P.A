import type {
  HTMLAttributes,
  ReactNode,
  TableHTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes
} from "react";
import { cn } from "../lib/cn";

export type TableDensity = "compact" | "comfortable";

export type TableContainerProps = HTMLAttributes<HTMLDivElement> & {
  density?: TableDensity;
};

/**
 * UX-012 Slice B — data table container with density (data-attribute driven).
 */
export function TableContainer({
  className,
  density = "comfortable",
  ...props
}: TableContainerProps) {
  return (
    <div
      data-density={density}
      className={cn(
        "group/table overflow-hidden rounded-[var(--mpa-radius-lg)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] shadow-[var(--mpa-shadow-xs)]",
        className
      )}
      {...props}
    />
  );
}

export function Table({ className, ...props }: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <table
      className={cn("w-full border-collapse text-[var(--mpa-font-size-body)]", className)}
      {...props}
    />
  );
}

export function TableHead({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={cn(
        "sticky top-0 z-[var(--mpa-z-sticky)] border-b border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface-muted)]/80 backdrop-blur-sm",
        className
      )}
      {...props}
    />
  );
}

export function TableBody({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={cn("divide-y divide-[var(--mpa-color-border-subtle)]", className)} {...props} />
  );
}

export function TableRow({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        "transition-colors duration-[var(--mpa-duration-fast)] hover:bg-[var(--mpa-color-interactive-row-hover)] group-data-[density=compact]/table:[&>td]:min-h-9 group-data-[density=comfortable]/table:[&>td]:min-h-11",
        className
      )}
      {...props}
    />
  );
}

export function TableHeaderCell({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "text-left font-[var(--mpa-font-weight-semibold)] uppercase tracking-[0.05em] text-[var(--mpa-color-text-muted)] text-[var(--mpa-font-size-micro)]",
        "px-[var(--mpa-space-4)] py-[var(--mpa-space-2)] group-data-[density=compact]/table:px-[var(--mpa-space-3)]",
        className
      )}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn(
        "align-middle text-[var(--mpa-font-size-body)] text-[var(--mpa-color-text-primary)]",
        "px-[var(--mpa-space-4)] py-[var(--mpa-space-3)] group-data-[density=compact]/table:px-[var(--mpa-space-3)] group-data-[density=compact]/table:py-[var(--mpa-space-2)]",
        className
      )}
      {...props}
    />
  );
}

export type TableEmptyProps = HTMLAttributes<HTMLDivElement> & {
  colSpan: number;
  children?: ReactNode;
};

/** Empty row pattern for tables (tokenized). */
export function TableEmpty({ colSpan, className, children, ...props }: TableEmptyProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="p-0">
        <div
          className={cn(
            "px-[var(--mpa-space-4)] py-[var(--mpa-space-8)] text-center mpa-text-body text-[var(--mpa-color-text-secondary)]",
            className
          )}
          {...props}
        >
          {children ?? "No rows yet."}
        </div>
      </td>
    </tr>
  );
}
