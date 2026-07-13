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
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--mpa-color-bg-overlay)] p-4"
      onMouseDown={onClose}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(event) => event.stopPropagation()}
        className={cn(
          "w-full max-w-lg rounded-xl bg-white p-5 shadow-2xl focus:outline-none",
          className,
        )}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id={titleId} className="font-display text-lg font-semibold text-[var(--mpa-color-text-primary)]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-[var(--mpa-color-text-secondary)] hover:bg-gray-100"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>
        <div className="text-sm text-[var(--mpa-color-text-primary)]">{children}</div>
        {footer ? <div className="mt-4 border-t border-[var(--mpa-color-border-default)] pt-4">{footer}</div> : null}
      </div>
    </div>
  );
}
