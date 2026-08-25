"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type ProfileContextValue = {
  userId: string | null;
  displayName: string;
  avatarUrl: string | null;
  avatarFallback: string;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

function initialsFromName(displayName: string): string {
  const initials = displayName
    .split(" ")
    .filter((segment) => segment.length > 0)
    .map((segment) => segment[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);
  return initials || "MP";
}

export function ProfileProvider({
  children,
  userId = null
}: {
  children: ReactNode;
  userId?: string | null;
}) {
  const [displayName, setDisplayName] = useState("M.P.A.");
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
      setDisplayName(payload.profile?.displayName || "M.P.A.");
      setAvatarUrl(payload.profile?.avatarUrl || null);
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo<ProfileContextValue>(
    () => ({
      userId,
      displayName,
      avatarUrl,
      avatarFallback: initialsFromName(displayName)
    }),
    [avatarUrl, displayName, userId]
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfileContext(): ProfileContextValue {
  const value = useContext(ProfileContext);
  if (!value) {
    throw new Error("useProfileContext must be used within ProfileProvider");
  }
  return value;
}
