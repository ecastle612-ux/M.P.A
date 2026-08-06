"use client";

import { useMemo, useState } from "react";
import { FINANCE_NOTIFICATION_CATALOG } from "@mpa/shared";
import { Badge } from "@mpa/ui";
import { useCommercialContext } from "./commercial-context";

type NotificationItem = {
  id: string;
  title: string;
  detail: string;
  badge: string;
};

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const { canAccess } = useCommercialContext();

  const items = useMemo<NotificationItem[]>(() => {
    const base: NotificationItem[] = [
      {
        id: "platform-framework",
        title: "Notification framework initialized",
        detail: "Platform-level alerts use this center.",
        badge: "Framework"
      }
    ];

    if (canAccess("pm.financial_operations")) {
      const charge = FINANCE_NOTIFICATION_CATALOG.find((item) => item.key === "finance.charge.created");
      base.unshift({
        id: "finance-billing",
        title: "Resident billing is live",
        detail: charge
          ? "Charges, payments, receipts, and portal Pay Now are active (S1)."
          : "Financial Operations billing notifications are registered.",
        badge: "Finance"
      });
    }

    return base;
  }, [canAccess]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="relative rounded-md border border-[var(--mpa-color-border-default)] bg-white px-3 py-2 text-sm text-[var(--mpa-color-text-secondary)] hover:bg-gray-50"
        aria-label="Open notifications"
      >
        Notifications
        <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--mpa-color-brand-primary)] text-xs text-white">
          {items.length}
        </span>
      </button>

      {open ? (
        <div
          role="menu"
          aria-label="Notifications"
          className="absolute right-0 top-12 z-40 w-80 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-3 shadow-xl"
        >
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">Notifications</p>
            <Badge variant="info">Registered</Badge>
          </div>
          <ul className="space-y-2">
            {items.map((item) => (
              <li
                key={item.id}
                className="rounded-md border border-[var(--mpa-color-border-subtle)] p-2 text-xs text-[var(--mpa-color-text-secondary)]"
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="font-medium text-[var(--mpa-color-text-primary)]">{item.title}</span>
                  <Badge variant="neutral">{item.badge}</Badge>
                </div>
                {item.detail}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
