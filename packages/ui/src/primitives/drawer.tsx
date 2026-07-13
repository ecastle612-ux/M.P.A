"use client";

import type { ReactNode } from "react";
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
};

export function Drawer({ open, onClose, title, children, footer, className }: DrawerProps) {
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
          "absolute right-0 top-0 h-full w-full max-w-xl bg-white shadow-2xl",
          className,
        )}
      >
        <header className="flex items-center justify-between border-b border-[var(--mpa-color-border-default)] px-5 py-4">
          <h2 id={titleId} className="font-display text-lg font-semibold text-[var(--mpa-color-text-primary)]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-[var(--mpa-color-text-secondary)] hover:bg-gray-100"
            aria-label="Close drawer"
          >
            ✕
          </button>
        </header>
        <div className="h-[calc(100%-128px)] overflow-auto p-5 text-sm text-[var(--mpa-color-text-primary)]">
          {children}
        </div>
        {footer ? (
          <footer className="border-t border-[var(--mpa-color-border-default)] px-5 py-4">{footer}</footer>
        ) : null}
      </aside>
    </div>
  );
}
