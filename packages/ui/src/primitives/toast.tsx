"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { cn } from "../lib/cn";

type ToastVariant = "info" | "success" | "warning" | "danger";

type ToastItem = {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
};

type ToastContextValue = {
  notify: (payload: Omit<ToastItem, "id">) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const notify = useCallback(
    (payload: Omit<ToastItem, "id">) => {
      const id = crypto.randomUUID();
      const nextItem = { id, ...payload };
      setItems((current) => [...current, nextItem]);
      setTimeout(() => {
        dismiss(id);
      }, 4000);
    },
    [dismiss],
  );

  const value = useMemo<ToastContextValue>(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-[calc(1rem+var(--mpa-safe-top))] z-[70] flex w-[min(20rem,calc(100vw-2rem))] flex-col gap-2">
        {items.map((item) => (
          <div
            key={item.id}
            role="status"
            className={cn(
              "pointer-events-auto rounded-[var(--mpa-radius-md)] border bg-[var(--mpa-color-bg-surface)] p-3 shadow-mpa-md animate-[mpa-slide-in-down_var(--mpa-motion-moderate)_var(--mpa-ease-standard)]",
              item.variant === "info" && "border-[var(--mpa-color-status-info)]",
              item.variant === "success" && "border-[var(--mpa-color-status-success)]",
              item.variant === "warning" && "border-[var(--mpa-color-status-warning)]",
              item.variant === "danger" && "border-[var(--mpa-color-status-danger)]",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">{item.title}</p>
                {item.description ? (
                  <p className="mt-1 text-xs leading-relaxed text-[var(--mpa-color-text-secondary)]">
                    {item.description}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => dismiss(item.id)}
                className="rounded-[var(--mpa-radius-sm)] p-1 text-[var(--mpa-color-text-muted)] transition-colors duration-[var(--mpa-motion-fast)] hover:bg-[var(--mpa-color-bg-surface-muted)] hover:text-[var(--mpa-color-text-primary)]"
                aria-label="Dismiss notification"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
}
