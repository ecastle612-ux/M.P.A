import { evaluateCapability } from "@mpa/shared";
import { fuzzyFilter } from "../fuzzy";
import type { CommandCenterProvider, CommandCenterResult } from "../types";

const NAV_ITEMS = [
  { id: "nav-dashboard", label: "Operations Center", href: "/dashboard", shortcut: "G D", icon: "⌁" },
  { id: "nav-properties", label: "Properties", href: "/properties", shortcut: "G P", icon: "→" },
  { id: "nav-units", label: "Units", href: "/units", shortcut: "G U", icon: "→" },
  { id: "nav-applicants", label: "Applicants", href: "/applicants", shortcut: "G A", icon: "→" },
  { id: "nav-tenants", label: "Tenants", href: "/tenants", shortcut: "G T", icon: "→" },
  { id: "nav-leases", label: "Leases", href: "/leases", shortcut: "G L", icon: "→" },
  { id: "nav-communications", label: "Communications", href: "/communications", shortcut: "G C", icon: "→" },
  { id: "nav-financials", label: "Financials", href: "/financials", shortcut: "G F", icon: "→" },
  { id: "nav-ai-operations", label: "AI Operations", href: "/ai-operations", shortcut: "G A", icon: "→" },
  { id: "nav-maintenance", label: "Maintenance", href: "/maintenance", shortcut: "G M", icon: "→" },
  { id: "nav-vendors", label: "Vendors", href: "/vendors", shortcut: "G V", icon: "→" },
  { id: "nav-profile", label: "Profile", href: "/profile", shortcut: "G R", icon: "→" },
  { id: "nav-portals", label: "Portals", href: "/portal", shortcut: null, icon: "→" }
] as const;

export const navigationProvider: CommandCenterProvider = {
  id: "navigation",
  category: "navigation",
  sectionTitle: "Navigation",
  priority: 80,
  search: async (context) => {
    const matches = fuzzyFilter(
      context.query,
      [...NAV_ITEMS],
      (item) => [item.label, item.href],
      8
    );

    return matches.map(({ item, score }) => toNavigationResult(item, score));
  }
};

export const pinnedActionsProvider: CommandCenterProvider = {
  id: "pinned-actions",
  category: "pinned",
  sectionTitle: "Pinned Actions",
  priority: 10,
  enabled: (context) => !context.query.trim(),
  search: async (context) =>
    buildActionItems(context.permissions).map((item) => ({
      ...item,
      category: "pinned" as const
    }))
};

export const actionsProvider: CommandCenterProvider = {
  id: "actions",
  category: "actions",
  sectionTitle: "Actions",
  priority: 70,
  enabled: (context) => context.query.trim().length > 0,
  search: async (context) => {
    const actions = buildActionItems(context.permissions);
    const matches = fuzzyFilter(
      context.query,
      actions,
      (item) => [item.label, item.subtitle ?? "", item.context ?? ""],
      8
    );
    return matches.map(({ item, score }) => ({ ...item, score }));
  }
};

function buildActionItems(permissions: readonly string[]): CommandCenterResult[] {
  const items: CommandCenterResult[] = [
    {
      id: "action-dashboard",
      kind: "dashboard",
      category: "actions",
      label: "Open Operations Center",
      subtitle: "Portfolio command surface",
      context: "Dashboard",
      badge: "Action",
      status: "Live",
      statusVariant: "success",
      icon: "⌁",
      href: "/dashboard",
      shortcut: "G D",
      score: 100
    }
  ];

  if (evaluateCapability(permissions, "property:create")) {
    items.push({
      id: "action-create-property",
      kind: "action",
      category: "actions",
      label: "Create property",
      subtitle: "Add a managed property",
      context: "Portfolio setup",
      badge: "Action",
      status: "Quick",
      statusVariant: "info",
      icon: "+",
      href: "/properties/new",
      shortcut: "C P",
      score: 100
    });
  }

  if (evaluateCapability(permissions, "unit:create")) {
    items.push({
      id: "action-create-unit",
      kind: "action",
      category: "actions",
      label: "Create unit",
      subtitle: "Add inventory to a property",
      context: "Occupancy setup",
      badge: "Action",
      status: "Quick",
      statusVariant: "info",
      icon: "+",
      href: "/units/new",
      shortcut: "C U",
      score: 100
    });
  }

  if (evaluateCapability(permissions, "applicant:create")) {
    items.push({
      id: "action-create-applicant",
      kind: "action",
      category: "actions",
      label: "Create applicant",
      subtitle: "Start a rental application",
      context: "Onboarding workflow",
      badge: "Action",
      status: "Quick",
      statusVariant: "info",
      icon: "+",
      href: "/applicants/new",
      shortcut: "C A",
      score: 100
    });
  }

  if (evaluateCapability(permissions, "tenant:create")) {
    items.push({
      id: "action-create-tenant",
      kind: "action",
      category: "actions",
      label: "Create tenant",
      subtitle: "Assign a resident profile",
      context: "Move-in workflow",
      badge: "Action",
      status: "Quick",
      statusVariant: "info",
      icon: "+",
      href: "/tenants/new",
      shortcut: "C T",
      score: 100
    });
  }

  if (evaluateCapability(permissions, "lease:create")) {
    items.push({
      id: "action-create-lease",
      kind: "action",
      category: "actions",
      label: "Create lease",
      subtitle: "Connect tenant to unit",
      context: "Lease workflow",
      badge: "Action",
      status: "Quick",
      statusVariant: "info",
      icon: "+",
      href: "/leases/new",
      shortcut: "C L",
      score: 100
    });
  }

  if (evaluateCapability(permissions, "communication:create")) {
    items.push({
      id: "action-create-announcement",
      kind: "action",
      category: "actions",
      label: "Create announcement",
      subtitle: "Broadcast to residents",
      context: "Communication workflow",
      badge: "Action",
      status: "Quick",
      statusVariant: "info",
      icon: "+",
      href: "/communications/new",
      shortcut: "C A",
      score: 100
    });
  }

  if (evaluateCapability(permissions, "communication:read")) {
    items.push({
      id: "action-qr-enrollment",
      kind: "action",
      category: "actions",
      label: "QR enrollment",
      subtitle: "Resident property join codes",
      context: "Open property QR codes from property detail",
      badge: "Action",
      status: "QR",
      statusVariant: "info",
      icon: "▦",
      href: "/properties",
      shortcut: null,
      score: 90
    });
  }

  if (evaluateCapability(permissions, "financial:create")) {
    items.push(
      {
        id: "action-record-payment",
        kind: "action",
        category: "actions",
        label: "Record payment",
        subtitle: "Apply rent payment to charge",
        context: "Financial workflow",
        badge: "Action",
        status: "Quick",
        statusVariant: "info",
        icon: "+",
        href: "/financials/charges",
        shortcut: "C Y",
        score: 100
      },
      {
        id: "action-record-expense",
        kind: "action",
        category: "actions",
        label: "Record expense",
        subtitle: "Track property expense",
        context: "Financial workflow",
        badge: "Action",
        status: "Quick",
        statusVariant: "info",
        icon: "+",
        href: "/financials/expenses/new",
        shortcut: "C E",
        score: 100
      },
      {
        id: "action-generate-statement",
        kind: "action",
        category: "actions",
        label: "Generate owner statement",
        subtitle: "Summarize property income and expenses",
        context: "Owner reporting",
        badge: "Action",
        status: "Quick",
        statusVariant: "info",
        icon: "+",
        href: "/financials/owner-statements/generate",
        shortcut: null,
        score: 95
      }
    );
  }

  if (evaluateCapability(permissions, "maintenance:create")) {
    items.push({
      id: "action-create-work-order",
      kind: "action",
      category: "actions",
      label: "Create work order",
      subtitle: "Open a maintenance request",
      context: "Maintenance workflow",
      badge: "Action",
      status: "Quick",
      statusVariant: "info",
      icon: "+",
      href: "/maintenance/new",
      shortcut: "C M",
      score: 100
    });
  }

  if (evaluateCapability(permissions, "vendor:create")) {
    items.push({
      id: "action-create-vendor",
      kind: "action",
      category: "actions",
      label: "Create vendor",
      subtitle: "Add a service provider",
      context: "Vendor workflow",
      badge: "Action",
      status: "Quick",
      statusVariant: "info",
      icon: "+",
      href: "/vendors/new",
      shortcut: "C V",
      score: 100
    });
  }

  return items;
}

function toNavigationResult(
  item: (typeof NAV_ITEMS)[number],
  score: number
): CommandCenterResult {
  return {
    id: item.id,
    kind: "navigation",
    category: "navigation",
    label: item.label,
    subtitle: "Navigate",
    context: item.href,
    badge: "Navigation",
    status: null,
    statusVariant: "neutral",
    icon: item.icon,
    href: item.href,
    shortcut: item.shortcut,
    score
  };
}
