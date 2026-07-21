"use client";

import type { ReactNode, UIEvent } from "react";
import { useId } from "react";
import { cn } from "../lib/cn";
import { useFocusTrap } from "../lib/focus-trap";

export type DrawerProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  contentClassName?: string;
  /** When true, omit the default title bar (caller supplies branded chrome). */
  hideHeader?: boolean;
  onContentScroll?: (event: UIEvent<HTMLDivElement>) => void;
};

export function Drawer({
  open,
  onClose,
  title,
  children,
  footer,
  className,
  contentClassName,
  hideHeader = false,
  onContentScroll
}: DrawerProps) {
  const titleId = useId();
  const containerRef = useFocusTrap<HTMLElement>(open, onClose);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close drawer backdrop"
        onClick={onClose}
        className="absolute inset-0 bg-[var(--mpa-color-bg-overlay)]"
      />
      <aside
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "absolute right-0 top-0 flex h-full w-full max-w-xl flex-col bg-[var(--mpa-color-bg-surface)] shadow-2xl",
          className,
        )}
      >
        {hideHeader ? (
          <h2 id={titleId} className="sr-only">
            {title}
          </h2>
        ) : (
          <header className="flex shrink-0 items-center justify-between border-b border-[var(--mpa-color-border-default)] px-5 py-4">
            <h2 id={titleId} className="font-display text-lg font-semibold text-[var(--mpa-color-text-primary)]">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1 text-[var(--mpa-color-text-secondary)] hover:bg-[var(--mpa-color-bg-app)]"
              aria-label="Close drawer"
            >
              ✕
            </button>
          </header>
        )}
        <div
          onScroll={onContentScroll}
          className={cn(
            "min-h-0 flex-1 overflow-auto p-5 text-sm text-[var(--mpa-color-text-primary)]",
            contentClassName,
          )}
        >
          {children}
        </div>
        {footer ? (
          <footer className="shrink-0 border-t border-[var(--mpa-color-border-default)] px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            {footer}
          </footer>
        ) : null}
      </aside>
    </div>
  );
}
