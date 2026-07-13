"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, Button } from "@mpa/ui";

export function ProfileMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="rounded-full"
        aria-label="Open profile menu"
      >
        <Avatar fallback="MP" />
      </button>
      {open ? (
        <div
          role="menu"
          aria-label="Profile menu"
          className="absolute right-0 top-10 z-40 w-56 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-2 shadow-lg"
        >
          <p className="px-2 py-2 text-xs text-[var(--mpa-color-text-secondary)]">Foundation profile menu</p>
          <Button className="w-full" variant="secondary" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      ) : null}
    </div>
  );
}
