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
    <div className="fixed inset-0 z-[50]">
      <button
        type="button"
        aria-label="Close drawer backdrop"
        onClick={onClose}
        className="absolute inset-0 bg-[var(--mpa-color-bg-overlay)] animate-[mpa-fade-in_var(--mpa-motion-normal)_var(--mpa-ease-standard)]"
      />
      <aside
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "absolute right-0 top-0 flex h-full w-full max-w-xl flex-col border-l border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] shadow-mpa-lg animate-[mpa-slide-in-right_var(--mpa-motion-moderate)_var(--mpa-ease-standard)]",
          className,
        )}
      >
        <header className="flex items-center justify-between border-b border-[var(--mpa-color-border-subtle)] px-5 py-4">
          <h2 id={titleId} className="font-display text-lg font-semibold tracking-tight text-[var(--mpa-color-text-primary)]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="mpa-touch-target inline-flex items-center justify-center rounded-[var(--mpa-radius-md)] p-2 text-[var(--mpa-color-text-secondary)] transition-colors duration-[var(--mpa-motion-fast)] hover:bg-[var(--mpa-color-bg-surface-muted)]"
            aria-label="Close drawer"
          >
            ✕
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-auto p-5 text-sm text-[var(--mpa-color-text-primary)]">
          {children}
        </div>
        {footer ? (
          <footer className="border-t border-[var(--mpa-color-border-subtle)] px-5 py-4 pb-[max(1rem,var(--mpa-safe-bottom))]">
            {footer}
          </footer>
        ) : null}
      </aside>
    </div>
  );
}
