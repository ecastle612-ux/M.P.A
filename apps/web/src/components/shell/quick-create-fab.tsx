"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { MOBILE_QUICK_CREATE_ACTIONS, isMasterAdminOnlyPermissions } from "./navigation-config";
import { useSessionPermissions } from "./use-session-permissions";

/**
 * UX-016 Slice C — persistent Quick Create control (existing create hrefs only).
 */
export function QuickCreateFab() {
  const { permissions, masterAdminOnlyShell } = useSessionPermissions();
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);

  const hidden =
    masterAdminOnlyShell || isMasterAdminOnlyPermissions(permissions) || permissions.length === 0;

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    function onPointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onPointer);
    };
  }, [open]);

  if (hidden) return null;

  return (
    <div
      ref={rootRef}
      data-ux016="quick-create"
      className="fixed bottom-[calc(4.75rem+var(--mpa-safe-bottom))] right-4 z-40 lg:bottom-6 lg:right-24"
    >
      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label="Quick create"
          className="mb-2 min-w-[12rem] overflow-hidden rounded-[var(--mpa-radius-xl)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] shadow-[var(--mpa-shadow-md)]"
        >
          <ul className="py-1">
            {MOBILE_QUICK_CREATE_ACTIONS.map((action) => (
              <li key={action.href + action.label} role="none">
                <Link
                  role="menuitem"
                  href={action.href}
                  className="block px-4 py-2.5 text-sm text-[var(--mpa-color-text-primary)] hover:bg-[var(--mpa-color-bg-surface-muted)]"
                  onClick={() => setOpen(false)}
                >
                  {action.label.startsWith("Create") || action.label.startsWith("Add") || action.label.startsWith("Invite")
                    ? action.label
                    : action.label === "Work Order"
                      ? "Create Work Order"
                      : action.label === "Lease"
                        ? "Create Lease"
                        : action.label === "Resident"
                          ? "Add Resident"
                          : action.label === "Document"
                            ? "Upload Document"
                            : action.label === "Property"
                              ? "New Property"
                              : action.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-12 min-h-12 items-center justify-center gap-2 rounded-full bg-[var(--mpa-color-brand-primary)] px-5 text-sm font-semibold text-[var(--mpa-color-text-inverse)] shadow-[var(--mpa-shadow-sm)] hover:bg-[var(--mpa-color-brand-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-border-focus)]"
      >
        <span aria-hidden="true">+</span>
        Quick Create
      </button>
    </div>
  );
}
