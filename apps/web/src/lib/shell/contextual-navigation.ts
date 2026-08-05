/**
 * UX-016 Slice C — pathname-driven contextual navigation (presentation only).
 * Uses existing deep-link / query patterns — no new routes.
 */

export type ContextualNavItem = {
  href: string;
  label: string;
  exact?: boolean;
};

export type ContextualNavigation = {
  kind: "property" | "vendor";
  entityId: string;
  title: string;
  items: ContextualNavItem[];
};

const PROPERTY_PATH = /^\/properties\/([^/]+)(?:\/|$)/;
const VENDOR_PATH = /^\/vendors\/([^/]+)(?:\/|$)/;

export function resolveContextualNavigation(pathname: string): ContextualNavigation | null {
  const propertyMatch = pathname.match(PROPERTY_PATH);
  if (propertyMatch?.[1] && propertyMatch[1] !== "new") {
    const propertyId = decodeURIComponent(propertyMatch[1]);
    return {
      kind: "property",
      entityId: propertyId,
      title: "This property",
      // CORE-004 Phase 1 — property workspace organized around operations (reuse framework).
      items: [
        { href: `/properties/${propertyId}`, label: "Overview", exact: true },
        { href: `/tenants?propertyId=${encodeURIComponent(propertyId)}`, label: "Residents" },
        { href: "/leases", label: "Leasing" },
        { href: `/maintenance?propertyId=${encodeURIComponent(propertyId)}`, label: "Maintenance" },
        { href: "/vendors", label: "Vendors" },
        {
          href: `/financials/reports?propertyId=${encodeURIComponent(propertyId)}`,
          label: "Financial"
        },
        { href: "/settings/documents", label: "Documents" },
        { href: "/communications/inbox", label: "Communications" },
        { href: `/facility/calendar?propertyId=${encodeURIComponent(propertyId)}`, label: "Inspections" },
        { href: "/activity", label: "Activity" },
        { href: `/properties/${propertyId}/edit`, label: "Settings" }
      ]
    };
  }

  const vendorMatch = pathname.match(VENDOR_PATH);
  if (vendorMatch?.[1] && vendorMatch[1] !== "new") {
    const vendorId = decodeURIComponent(vendorMatch[1]);
    return {
      kind: "vendor",
      entityId: vendorId,
      title: "This vendor",
      items: [
        { href: `/vendors/${vendorId}`, label: "Jobs", exact: true },
        { href: "/financials/expenses", label: "Invoices" },
        { href: "/communications/inbox", label: "Messages" },
        { href: "/settings/documents", label: "Documents" },
        { href: `/vendors/${vendorId}`, label: "Performance", exact: true }
      ]
    };
  }

  return null;
}

export function isContextualNavActive(pathname: string, search: string, item: ContextualNavItem): boolean {
  const pathOnly = item.href.split("?")[0] ?? item.href;
  if (item.exact) {
    return pathname === pathOnly;
  }
  if (item.href.includes("?")) {
    const query = item.href.split("?")[1] ?? "";
    return pathname === pathOnly && (search.includes(query) || search.length === 0);
  }
  return pathname === pathOnly || pathname.startsWith(`${pathOnly}/`);
}
