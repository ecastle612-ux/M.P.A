"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, Button } from "@mpa/ui";
import { useDismissiblePopover } from "../../lib/ui/use-dismissible-popover";
import { useOperatorContext } from "./operator-context";
import { useProfileContext } from "./profile-provider";

export type AccountMenuPlacement = "sidebar" | "header";

export function AccountMenu({
  placement,
  roleLabel,
  collapsed = false
}: {
  placement: AccountMenuPlacement;
  roleLabel?: string | null;
  collapsed?: boolean;
}) {
  const router = useRouter();
  const { isPlatformOperator } = useOperatorContext();
  const { displayName, avatarUrl, avatarFallback } = useProfileContext();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const { rootRef, triggerRef, panelId } = useDismissiblePopover(open, close);

  async function handleLogout() {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "same-origin"
    });
    router.replace("/login");
    setOpen(false);
  }

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  const panelPosition =
    placement === "sidebar"
      ? "bottom-full left-0 mb-2 w-[16.5rem]"
      : "right-0 top-10 w-56";

  return (
    <div className="relative" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        id={`${panelId}-trigger`}
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label="Open account menu"
        className={
          placement === "sidebar"
            ? "flex min-h-11 w-full items-center gap-3 rounded-md px-2 py-1.5 text-left text-[var(--mpa-color-text-sidebar)] motion-safe:transition-colors hover:bg-[var(--mpa-color-bg-sidebar-hover)] hover:text-[var(--mpa-color-text-sidebar-active)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-border-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--mpa-color-bg-sidebar)]"
            : "rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-border-focus)] focus-visible:ring-offset-2"
        }
      >
        <Avatar src={avatarUrl || undefined} fallback={avatarFallback} />
        {placement === "sidebar" && !collapsed ? (
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-[var(--mpa-color-text-sidebar-active)]">
              {displayName}
            </span>
            {roleLabel ? (
              <span className="block truncate text-xs text-[var(--mpa-color-text-sidebar)]">{roleLabel}</span>
            ) : null}
          </span>
        ) : null}
      </button>
      {open ? (
        <div
          id={panelId}
          role="menu"
          aria-label="Account menu"
          className={`absolute z-40 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-2 shadow-lg ${panelPosition}`}
        >
          <p className="px-2 py-2 text-xs text-[var(--mpa-color-text-secondary)]">{displayName}</p>
          <Button className="mb-2 w-full" variant="secondary" role="menuitem" onClick={() => go("/profile")}>
            Profile
          </Button>
          <Button className="mb-2 w-full" variant="secondary" role="menuitem" onClick={() => go("/billing")}>
            Billing & Plan
          </Button>
          <Button className="mb-2 w-full" variant="secondary" role="menuitem" onClick={() => go("/setup")}>
            Guided Setup
          </Button>
          {isPlatformOperator ? (
            <Button className="mb-2 w-full" variant="secondary" role="menuitem" onClick={() => go("/admin")}>
              Owner Operations
            </Button>
          ) : null}
          <Button className="w-full" variant="secondary" role="menuitem" onClick={() => void handleLogout()}>
            Sign out
          </Button>
        </div>
      ) : null}
    </div>
  );
}
