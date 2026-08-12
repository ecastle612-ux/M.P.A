"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useReducer, useRef } from "react";
import { useCommercialContext } from "./commercial-context";
import { reduceDismissibleMenu } from "../../lib/ui/dismissible-menu";

export function ResponsiveNavigation() {
  const { navigationGroups } = useCommercialContext();
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement>(null);
  const [menu, dispatch] = useReducer(reduceDismissibleMenu, {
    open: false,
    pathname
  });

  useEffect(() => {
    dispatch({ type: "pathname", pathname });
  }, [pathname]);

  useEffect(() => {
    if (!menu.open) {
      return;
    }
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        dispatch({ type: "close" });
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        dispatch({ type: "close" });
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menu.open]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        className="cursor-pointer rounded-md border border-[var(--mpa-color-border-default)] px-3 py-2 text-sm"
        aria-expanded={menu.open}
        aria-haspopup="true"
        aria-controls="app-mobile-nav-menu"
        onClick={() => dispatch({ type: "toggle" })}
      >
        Menu
      </button>
      {menu.open ? (
        <div
          id="app-mobile-nav-menu"
          className="absolute right-0 z-40 mt-2 max-h-[70vh] w-72 overflow-auto rounded-md border border-[var(--mpa-color-border-default)] bg-white p-3 shadow-lg"
        >
          {navigationGroups.map((group) => (
            <div key={group.id} className="mb-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
                {group.title}
              </p>
              <ul className="space-y-1">
                {group.items.map((item) => (
                  <li key={`${group.id}-${item.href}`}>
                    <Link
                      href={item.href}
                      className="block rounded px-2 py-2 text-sm hover:bg-[var(--mpa-color-bg-app)]"
                      onClick={() => dispatch({ type: "close" })}
                    >
                      {item.label}
                      {item.readiness === "planned" ? " (Planned)" : ""}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
