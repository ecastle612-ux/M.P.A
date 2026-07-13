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

  const notify = useCallback((payload: Omit<ToastItem, "id">) => {
    const id = crypto.randomUUID();
    const nextItem = { id, ...payload };
    setItems((current) => [...current, nextItem]);
    setTimeout(() => {
      setItems((current) => current.filter((item) => item.id !== id));
    }, 4000);
  }, []);

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
              "rounded-md border bg-white p-3 shadow-md",
              item.variant === "info" && "border-[#1D6AA5]",
              item.variant === "success" && "border-[#0E7A57]",
              item.variant === "warning" && "border-[#B45309]",
              item.variant === "danger" && "border-[#C0392B]",
            )}
          >
            <p className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">{item.title}</p>
            {item.description ? (
              <p className="mt-1 text-xs text-[var(--mpa-color-text-secondary)]">{item.description}</p>
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
