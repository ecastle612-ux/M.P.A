"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { cn } from "../lib/cn";

type ToastVariant = "info" | "success" | "warning" | "danger";

type ToastItem = {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
  actionLabel?: string;
  onAction?: () => void;
  durationMs?: number;
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
      setTimeout(() => dismiss(id), payload.durationMs ?? 4000);
    },
    [dismiss]
  );

  const value = useMemo<ToastContextValue>(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-[70] flex w-80 flex-col gap-2">
        {items.map((item) => (
          <div
            key={item.id}
            role="status"
            className={cn(
              "rounded-md border bg-[var(--mpa-color-bg-surface)] p-3 shadow-[var(--mpa-shadow-md)]",
              item.variant === "info" && "border-[var(--mpa-color-status-info)]",
              item.variant === "success" && "border-[var(--mpa-color-status-success)]",
              item.variant === "warning" && "border-[var(--mpa-color-status-warning)]",
              item.variant === "danger" && "border-[var(--mpa-color-status-danger)]",
            )}
          >
            <p className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">{item.title}</p>
            {item.description ? (
              <p className="mt-1 text-xs text-[var(--mpa-color-text-secondary)]">{item.description}</p>
            ) : null}
            {item.actionLabel && item.onAction ? (
              <button
                type="button"
                className="mt-2 text-xs font-semibold text-[var(--mpa-color-brand-primary)] hover:underline"
                onClick={() => {
                  item.onAction?.();
                  dismiss(item.id);
                }}
              >
                {item.actionLabel}
              </button>
            ) : null}
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
