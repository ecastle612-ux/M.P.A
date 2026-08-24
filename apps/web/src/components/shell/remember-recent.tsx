"use client";

import { useEffect } from "react";
import type { RecentRecordType } from "@mpa/shared";
import { writeRecentItem } from "../../lib/simplicity/recent-items-client";
import { useOrganizationContext } from "./organization-context";
import { useProfileContext } from "./profile-provider";

export function RememberRecent({ type, id }: { type: RecentRecordType; id?: string | null }) {
  const { activeOrganizationId } = useOrganizationContext();
  const { userId } = useProfileContext();

  useEffect(() => {
    if (!activeOrganizationId || !userId || !id) return;
    writeRecentItem(activeOrganizationId, userId, { type, id });
  }, [activeOrganizationId, id, type, userId]);

  return null;
}
