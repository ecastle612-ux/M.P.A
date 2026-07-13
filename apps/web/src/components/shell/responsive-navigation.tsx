"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@mpa/ui";

const MOBILE_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "#", label: "Search" },
  { href: "#", label: "Notifications" },
  { href: "#", label: "Settings" }
];

export function ResponsiveNavigation() {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <Button
        variant="secondary"
        size="sm"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="sr-only" aria-live="polite">
          {open ? "Navigation open" : "Navigation closed"}
        </span>
        Menu
      </Button>
      {open ? (
        <div className="absolute left-0 right-0 top-16 z-40 border-b border-[var(--mpa-color-border-default)] bg-white p-3 shadow-md">
          <ul className="space-y-2">
            {MOBILE_ITEMS.map((item) => (
              <li key={item.label}>
                <Link href={item.href} className="block rounded-md px-2 py-2 text-sm hover:bg-gray-100">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
