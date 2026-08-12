"use client";

import { usePathname } from "next/navigation";
import { useEffect, useReducer, useRef, type ReactNode } from "react";
import { reduceDismissibleMenu } from "../../lib/ui/dismissible-menu";

export function MarketingMobileMenu({
  denseNav,
  children
}: {
  denseNav: boolean;
  children: ReactNode;
}) {
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
    <div className="relative lg:hidden" ref={rootRef}>
      <button
        type="button"
        aria-expanded={menu.open}
        aria-haspopup="true"
        aria-controls="marketing-mobile-nav-menu"
        onClick={() => dispatch({ type: "toggle" })}
        className={
          denseNav
            ? "cursor-pointer rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-3 py-2 text-sm font-semibold text-[var(--mpa-color-text-primary)]"
            : "cursor-pointer rounded-md border border-white/30 bg-white/10 px-3 py-2 text-sm font-semibold text-white"
        }
      >
        Menu
      </button>
      {menu.open ? (
        <div
          id="marketing-mobile-nav-menu"
          className={
            denseNav
              ? "absolute right-0 z-40 mt-2 flex w-[min(18rem,calc(100vw-2rem))] flex-col gap-1 rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-3 shadow-lg"
              : "absolute right-0 z-40 mt-2 flex w-[min(18rem,calc(100vw-2rem))] flex-col gap-1 rounded-md border border-white/20 bg-[#0B1F1A]/95 p-3 shadow-lg backdrop-blur"
          }
          onClick={(event) => {
            const target = event.target as HTMLElement | null;
            if (target?.closest("a")) {
              dispatch({ type: "close" });
            }
          }}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
