"use client";

import type { ReactNode } from "react";
import { useId } from "react";
import { cn } from "../lib/cn";
import { useFocusTrap } from "../lib/focus-trap";

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

export function Modal({ open, onClose, title, children, footer, className }: ModalProps) {
  const titleId = useId();
  const containerRef = useFocusTrap<HTMLDivElement>(open, onClose);
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[var(--mpa-color-bg-overlay)] p-4 animate-[mpa-fade-in_var(--mpa-motion-normal)_var(--mpa-ease-standard)]"
      onMouseDown={onClose}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(event) => event.stopPropagation()}
        className={cn(
          "w-full max-w-lg rounded-[var(--mpa-radius-xl)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] p-5 shadow-mpa-lg focus:outline-none animate-[mpa-fade-scale-in_var(--mpa-motion-normal)_var(--mpa-ease-standard)]",
          className,
        )}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id={titleId} className="font-display text-lg font-semibold tracking-tight text-[var(--mpa-color-text-primary)]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="mpa-touch-target inline-flex items-center justify-center rounded-[var(--mpa-radius-md)] p-2 text-[var(--mpa-color-text-secondary)] transition-colors duration-[var(--mpa-motion-fast)] hover:bg-[var(--mpa-color-bg-surface-muted)] hover:text-[var(--mpa-color-text-primary)]"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>
        <div className="text-sm leading-relaxed text-[var(--mpa-color-text-primary)]">{children}</div>
        {footer ? (
          <div className="mt-5 border-t border-[var(--mpa-color-border-subtle)] pt-4">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}
