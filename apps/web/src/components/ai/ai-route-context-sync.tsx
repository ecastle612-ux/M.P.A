"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { setAiPageContext } from "../../lib/ai/ai-page-context-store";
import { buildAiPageContextFromPathname, isBridgeOwnedPath } from "../../lib/ai/ai-route-context";
import { shellTrace } from "../../lib/debug/shell-runtime-trace";

/**
 * AI-001: keep copilot context aligned with the authenticated route.
 * Skips bridge-owned entity detail paths so page bridges keep labeled context.
 */
export function AiRouteContextSync() {
  const pathname = usePathname();

  useEffect(() => {
    if (isBridgeOwnedPath(pathname)) {
      shellTrace("ai-route-sync-skip-bridge-owned", { pathname });
      return;
    }
    const next = buildAiPageContextFromPathname(pathname);
    setAiPageContext(next);
    shellTrace("ai-route-sync", { pathname, entityType: next.entityType });
  }, [pathname]);

  return null;
}
