"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, Button } from "@mpa/ui";
import { MPA_BRAND_NAME } from "../../lib/branding";

export function ProfileMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [displayName, setDisplayName] = useState(MPA_BRAND_NAME);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    void (async () => {
      const response = await fetch("/api/profile");
      if (!response.ok) {
        return;
      }
      const payload = (await response.json()) as {
        profile?: { displayName?: string; avatarUrl?: string };
      };
      if (!isMounted) {
        return;
      }
      setDisplayName(payload.profile?.displayName || MPA_BRAND_NAME);
      setAvatarUrl(payload.profile?.avatarUrl || null);
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    function handleKeydown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (!target?.closest("[data-profile-menu]")) {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeydown);
    window.addEventListener("mousedown", handlePointerDown);
    return () => {
      window.removeEventListener("keydown", handleKeydown);
      window.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  const avatarFallback = useMemo(() => {
    const initials = displayName
      .split(" ")
      .filter((segment) => segment.length > 0)
      .map((segment) => segment[0]?.toUpperCase() ?? "")
      .join("")
      .slice(0, 2);
    return initials || "MP";
  }, [displayName]);

  async function handleLogout() {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "same-origin"
    });
    router.replace("/login");
    setOpen(false);
  }

  return (
    <div className="relative" data-profile-menu>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="profile-menu"
        className="rounded-full ring-offset-2"
        aria-label="Open profile menu"
      >
        <Avatar src={avatarUrl || undefined} fallback={avatarFallback} />
      </button>
      {open ? (
        <div
          id="profile-menu"
          role="menu"
          aria-label="Profile menu"
          className="absolute right-0 top-10 z-40 w-56 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-2 shadow-lg"
        >
          <p className="px-2 py-2 text-xs text-[var(--mpa-color-text-secondary)]">{displayName}</p>
          <Button className="mb-2 w-full" variant="secondary" onClick={() => router.push("/profile")}>
            Profile
          </Button>
          <Button className="w-full" variant="secondary" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      ) : null}
    </div>
  );
}
