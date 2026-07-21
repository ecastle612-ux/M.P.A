"use client";

import Link from "next/link";
import { useId, useState, type ReactNode } from "react";
import { Button } from "@mpa/ui";

export type ToolbeltAction = {
  id: string;
  label: string;
  href?: string;
  onClick?: () => void;
  /** Primary visible slot (80% actions). Default true when in `actions`. */
  primary?: boolean;
  variant?: "primary" | "secondary" | "ghost";
};

/**
 * UX-009 entity action toolbelt — Amendment A/G/H.
 * Sticky on mobile for thumb reach; overflow goes to More.
 * Use stable `id`s so future personalization can promote slots (Amendment H).
 */
export function EntityActionToolbelt({
  actions,
  moreActions = [],
  "aria-label": ariaLabel = "Page actions"
}: {
  actions: ToolbeltAction[];
  moreActions?: ToolbeltAction[];
  "aria-label"?: string;
}) {
  const menuId = useId();
  const [moreOpen, setMoreOpen] = useState(false);
  const primary = actions.filter((action) => action.primary !== false);
  const overflow = [...actions.filter((action) => action.primary === false), ...moreActions];

  if (primary.length === 0 && overflow.length === 0) return null;

  return (
    <nav
      aria-label={ariaLabel}
      data-mpa-toolbelt="true"
      className="sticky bottom-16 z-30 -mx-1 border-t border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)]/95 px-1 py-2 backdrop-blur-sm supports-[backdrop-filter]:bg-[var(--mpa-color-bg-surface)]/90 md:static md:bottom-auto md:z-0 md:mx-0 md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none lg:bottom-0"
    >
      <div className="flex flex-wrap items-center gap-2">
        {primary.map((action) => (
          <ToolbeltButton key={action.id} action={action} data-toolbelt-slot={action.id} />
        ))}
        {overflow.length > 0 ? (
          <div className="relative">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              aria-expanded={moreOpen}
              aria-controls={menuId}
              onClick={() => setMoreOpen((value) => !value)}
            >
              More
            </Button>
            {moreOpen ? (
              <ul
                id={menuId}
                role="menu"
                className="absolute bottom-full right-0 z-40 mb-2 min-w-[12rem] rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-1 shadow-[var(--mpa-shadow-md)] md:bottom-auto md:top-full md:mb-0 md:mt-2"
              >
                {overflow.map((action) => (
                  <li key={action.id} role="none">
                    {action.href ? (
                      <Link
                        role="menuitem"
                        href={action.href}
                        className="block rounded-[var(--mpa-radius-sm)] px-3 py-2.5 text-sm text-[var(--mpa-color-text-primary)] hover:bg-[var(--mpa-color-interactive-row-hover)]"
                        onClick={() => setMoreOpen(false)}
                        data-toolbelt-slot={action.id}
                      >
                        {action.label}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        role="menuitem"
                        className="block w-full rounded-[var(--mpa-radius-sm)] px-3 py-2.5 text-left text-sm text-[var(--mpa-color-text-primary)] hover:bg-[var(--mpa-color-interactive-row-hover)]"
                        onClick={() => {
                          action.onClick?.();
                          setMoreOpen(false);
                        }}
                        data-toolbelt-slot={action.id}
                      >
                        {action.label}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </div>
    </nav>
  );
}

function ToolbeltButton({ action }: { action: ToolbeltAction }) {
  const variant = action.variant ?? "secondary";
  if (action.href) {
    return (
      <Link href={action.href} data-toolbelt-slot={action.id}>
        <Button size="sm" variant={variant}>
          {action.label}
        </Button>
      </Link>
    );
  }
  return (
    <Button size="sm" variant={variant} type="button" onClick={action.onClick} data-toolbelt-slot={action.id}>
      {action.label}
    </Button>
  );
}

/** Server-friendly wrapper: place toolbelt under hero inside detail layouts. */
export function EntityActionToolbeltSlot({ children }: { children: ReactNode }) {
  return <div className="space-y-3">{children}</div>;
}
