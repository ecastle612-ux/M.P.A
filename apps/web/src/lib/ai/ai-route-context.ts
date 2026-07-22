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
    /^\/vendors\/[^/]+/.test(pathname) ||
    /^\/financials\/charges\/[^/]+/.test(pathname)
  );
}

export function buildAiPageContextFromPathname(pathname: string): AiPageContextValue {
  if (pathname === "/dashboard" || pathname === "/") {
    return buildAiPageContext({ entityType: "dashboard" });
  }
  if (pathname.startsWith("/financials") || pathname.startsWith("/reports")) {
    return buildAiPageContext({ entityType: "financial", listMode: true });
  }
  if (pathname.startsWith("/communications") || pathname.startsWith("/messages")) {
    return buildAiPageContext({ entityType: "messages" });
  }
  if (pathname.startsWith("/settings")) {
    return buildAiPageContext({ entityType: "settings" });
  }
  if (pathname === "/maintenance" || pathname.startsWith("/maintenance?")) {
    return buildAiPageContext({ entityType: "work_order", listMode: true });
  }
  if (pathname.startsWith("/maintenance/")) {
    return buildAiPageContext({ entityType: "work_order" });
  }
  if (pathname === "/properties" || pathname.startsWith("/properties?")) {
    return buildAiPageContext({ entityType: "property", listMode: true });
  }
  if (pathname.startsWith("/properties/")) {
    return buildAiPageContext({ entityType: "property" });
  }
  if (
    pathname === "/tenants" ||
    pathname.startsWith("/tenants?") ||
    pathname === "/residents" ||
    pathname.startsWith("/residents?")
  ) {
    return buildAiPageContext({ entityType: "resident", listMode: true });
  }
  if (pathname.startsWith("/tenants/") || pathname.startsWith("/residents/")) {
    return buildAiPageContext({ entityType: "resident" });
  }
  if (pathname === "/units" || pathname.startsWith("/units?")) {
    return buildAiPageContext({ entityType: "unit", listMode: true });
  }
  if (pathname.startsWith("/units/")) {
    return buildAiPageContext({ entityType: "unit" });
  }
  if (pathname === "/applicants" || pathname.startsWith("/applicants?")) {
    return buildAiPageContext({ entityType: "applicant", listMode: true });
  }
  if (pathname.startsWith("/applicants/")) {
    return buildAiPageContext({ entityType: "applicant" });
  }
  if (pathname === "/leases" || pathname.startsWith("/leases?")) {
    return buildAiPageContext({ entityType: "lease", listMode: true });
  }
  if (pathname.startsWith("/leases/")) {
    return buildAiPageContext({ entityType: "lease" });
  }
  if (pathname === "/vendors" || pathname.startsWith("/vendors?")) {
    return buildAiPageContext({ entityType: "vendor", listMode: true });
  }
  if (pathname.startsWith("/vendors/")) {
    return buildAiPageContext({ entityType: "vendor" });
  }
  if (pathname.startsWith("/ai-operations")) {
    return {
      ...DEFAULT_AI_PAGE_CONTEXT,
      entityType: "generic",
      launcherLabel: "What needs attention across the portfolio?",
      suggestions: DEFAULT_AI_PAGE_CONTEXT.suggestions
    };
  }
  return DEFAULT_AI_PAGE_CONTEXT;
}
