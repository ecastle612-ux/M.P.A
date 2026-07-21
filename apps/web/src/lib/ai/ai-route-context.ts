/**
 * Derive floating-copilot page context from the URL.
 * Detail pages with AiPageContextBridge supply richer labels; this covers list/settings routes.
 */

import { buildAiPageContext, DEFAULT_AI_PAGE_CONTEXT, type AiPageContextValue } from "./ai-page-context-store";

/** Paths where a page-level AiPageContextBridge owns context (do not overwrite from shell). */
export function isBridgeOwnedPath(pathname: string): boolean {
  return (
    /^\/properties\/[^/]+/.test(pathname) ||
    /^\/tenants\/[^/]+/.test(pathname) ||
    /^\/units\/[^/]+/.test(pathname) ||
    /^\/maintenance\/[^/]+/.test(pathname) ||
    /^\/applicants\/[^/]+/.test(pathname) ||
    /^\/leases\/[^/]+/.test(pathname) ||
    /^\/vendors\/[^/]+/.test(pathname)
  );
}

export function buildAiPageContextFromPathname(pathname: string): AiPageContextValue {
  if (pathname === "/dashboard" || pathname === "/") {
    return buildAiPageContext({ entityType: "dashboard" });
  }
  if (pathname.startsWith("/financials") || pathname.startsWith("/reports")) {
    return buildAiPageContext({ entityType: "financial" });
  }
  if (pathname.startsWith("/communications") || pathname.startsWith("/messages")) {
    return buildAiPageContext({ entityType: "messages" });
  }
  if (pathname.startsWith("/settings")) {
    return buildAiPageContext({ entityType: "settings" });
  }
  if (pathname.startsWith("/maintenance")) {
    return buildAiPageContext({ entityType: "work_order" });
  }
  if (pathname.startsWith("/properties")) {
    return buildAiPageContext({ entityType: "property" });
  }
  if (pathname.startsWith("/tenants") || pathname.startsWith("/residents")) {
    return buildAiPageContext({ entityType: "resident" });
  }
  if (pathname.startsWith("/units")) {
    return buildAiPageContext({ entityType: "unit" });
  }
  if (pathname.startsWith("/applicants")) {
    return buildAiPageContext({ entityType: "applicant" });
  }
  if (pathname.startsWith("/leases")) {
    return buildAiPageContext({ entityType: "lease" });
  }
  if (pathname.startsWith("/vendors")) {
    return buildAiPageContext({ entityType: "vendor" });
  }
  if (pathname.startsWith("/ai-operations")) {
    return {
      ...DEFAULT_AI_PAGE_CONTEXT,
      entityType: "generic",
      launcherLabel: "Ask about your portfolio",
      suggestions: DEFAULT_AI_PAGE_CONTEXT.suggestions
    };
  }
  return DEFAULT_AI_PAGE_CONTEXT;
}
