import { evaluateCapability } from "@mpa/shared";
import { fuzzyFilter } from "../fuzzy";
import { applyUsageRanking } from "../ranking";
import type { CommandCenterProvider, CommandCenterResult } from "../types";

const NAV_ITEMS = [
  { id: "nav-dashboard", label: "Open Today's Work", href: "/dashboard#todays-work", shortcut: "G D", icon: "⌁" },
  { id: "nav-properties", label: "Open Property list", href: "/properties", shortcut: "G P", icon: "→" },
  { id: "nav-units", label: "Open Unit list", href: "/units", shortcut: "G U", icon: "→" },
  { id: "nav-applicants", label: "Open Applicant list", href: "/applicants", shortcut: "G A", icon: "→" },
  { id: "nav-tenants", label: "Open Resident list", href: "/tenants", shortcut: "G T", icon: "→" },
  { id: "nav-move-in", label: "Continue Move In", href: "/residents/move-in", shortcut: "G R", icon: "+" },
  { id: "nav-move-out", label: "Continue Move Out", href: "/residents/move-out", shortcut: null, icon: "+" },
  { id: "nav-leases", label: "Open Lease list", href: "/leases", shortcut: "G L", icon: "→" },
  { id: "nav-inbox", label: "Open Inbox", href: "/communications/inbox", shortcut: "G I", icon: "→" },
  { id: "nav-communications", label: "Communications", href: "/communications", shortcut: "G C", icon: "→" },
  { id: "nav-financials", label: "Financials", href: "/financials", shortcut: "G F", icon: "→" },
  { id: "nav-ai-operations", label: "AI Operations", href: "/ai-operations", shortcut: "G Q", icon: "→" },
  { id: "nav-maintenance", label: "Open Maintenance", href: "/maintenance", shortcut: "G M", icon: "→" },
  { id: "nav-vendors", label: "Open Vendor list", href: "/vendors", shortcut: "G V", icon: "→" },
  { id: "nav-migration", label: "Continue Migration", href: "/migration", shortcut: null, icon: "→" },
  { id: "nav-profile", label: "Profile", href: "/profile", shortcut: null, icon: "→" },
  { id: "nav-portals", label: "Portals", href: "/portal", shortcut: null, icon: "→" }
] as const;

export const navigationProvider: CommandCenterProvider = {
  id: "navigation",
  category: "navigation",
  sectionTitle: "Go to",
  priority: 80,
  search: async (context) => {
    const matches = fuzzyFilter(
      context.query,
      [...NAV_ITEMS],
      (item) => [item.label, item.href],
      10
    );

    return applyUsageRanking(matches.map(({ item, score }) => toNavigationResult(item, score)));
  }
};

export const pinnedActionsProvider: CommandCenterProvider = {
  id: "pinned-actions",
  category: "pinned",
  sectionTitle: "Start or continue work",
  priority: 10,
  enabled: (context) => !context.query.trim(),
  search: async (context) =>
    applyUsageRanking(
      buildActionItems(context.permissions).map((item) => ({
        ...item,
        category: "pinned" as const
      }))
    )
};

export const actionsProvider: CommandCenterProvider = {
  id: "actions",
  category: "actions",
  sectionTitle: "Actions",
  priority: 12,
  enabled: (context) => context.query.trim().length > 0,
  search: async (context) => {
    const actions = buildActionItems(context.permissions);
    const matches = fuzzyFilter(
      context.query,
      actions,
      (item) => [item.label, item.subtitle ?? "", item.context ?? "", item.badge],
      12
    );
    return applyUsageRanking(matches.map(({ item, score }) => ({ ...item, score })));
  }
};

function buildActionItems(permissions: readonly string[]): CommandCenterResult[] {
  const items: CommandCenterResult[] = [
    {
      id: "action-todays-work",
      kind: "dashboard",
      category: "actions",
      label: "Open Today's Work",
      subtitle: "See what to do next — Resolve from Ops",
      context: "Operations Center",
      badge: "Primary",
      status: "Live",
      statusVariant: "success",
      icon: "⌁",
      href: "/dashboard#todays-work",
      shortcut: "G D",
      score: 170,
      favoriteKey: "action:todays-work"
    }
  ];

  if (evaluateCapability(permissions, "tenant:create")) {
    items.push(
      {
        id: "action-continue-move-in",
        kind: "action",
        category: "actions",
        label: "Continue Move In",
        subtitle: "Resume guided resident onboarding",
        context: "Resident lifecycle",
        badge: "Primary",
        status: "Continue",
        statusVariant: "info",
        icon: "▶",
        href: "/residents/move-in",
        shortcut: "C T",
        score: 165,
        favoriteKey: "action:continue-move-in"
      },
      {
        id: "action-continue-move-out",
        kind: "action",
        category: "actions",
        label: "Continue Move Out",
        subtitle: "Resume guided move-out",
        context: "Resident lifecycle",
        badge: "Primary",
        status: "Continue",
        statusVariant: "info",
        icon: "▶",
        href: "/residents/move-out",
        shortcut: "C O",
        score: 160,
        favoriteKey: "action:continue-move-out"
      }
    );
  }

  if (evaluateCapability(permissions, "financial:create")) {
    items.push({
      id: "action-record-payment",
      kind: "action",
      category: "actions",
      label: "Record Payment",
      subtitle: "One-shot: charge → amount → method",
      context: "Financial workflow",
      badge: "Primary",
      status: "Quick",
      statusVariant: "info",
      icon: "+",
      href: "/financials/payments/new",
      shortcut: "C Y",
      score: 158,
      favoriteKey: "action:record-payment"
    });
  }

  if (evaluateCapability(permissions, "vendor:assign") || evaluateCapability(permissions, "maintenance:update")) {
    items.push({
      id: "action-assign-vendor",
      kind: "action",
      category: "actions",
      label: "Assign Vendor",
      subtitle: "Open unassigned work orders — one-click assign",
      context: "Maintenance workflow",
      badge: "Primary",
      status: "Continue",
      statusVariant: "warning",
      icon: "▶",
      href: "/maintenance?status=unassigned",
      shortcut: null,
      score: 156,
      favoriteKey: "action:assign-vendor"
    });
  }

  if (evaluateCapability(permissions, "maintenance:update")) {
    items.push({
      id: "action-complete-work-order",
      kind: "action",
      category: "actions",
      label: "Complete Work Order",
      subtitle: "Finish in-progress maintenance from the workflow",
      context: "Maintenance workflow",
      badge: "Primary",
      status: "Continue",
      statusVariant: "info",
      icon: "▶",
      href: "/maintenance?status=in_progress",
      shortcut: null,
      score: 154,
      favoriteKey: "action:complete-work-order"
    });
  }

  if (evaluateCapability(permissions, "tenant:read")) {
    items.push({
      id: "action-open-resident",
      kind: "action",
      category: "actions",
      label: "Open Resident",
      subtitle: "Search residents — type a name after opening",
      context: "Residents",
      badge: "Go",
      status: null,
      statusVariant: "neutral",
      icon: "→",
      href: "/tenants",
      shortcut: "G T",
      score: 140,
      favoriteKey: "action:open-resident"
    });
  }

  if (evaluateCapability(permissions, "applicant:read")) {
    items.push(
      {
        id: "action-open-applicant",
        kind: "action",
        category: "actions",
        label: "Open Applicant",
        subtitle: "Applicant list — continue review",
        context: "Applicants",
        badge: "Go",
        status: null,
        statusVariant: "neutral",
        icon: "→",
        href: "/applicants",
        shortcut: "G A",
        score: 138,
        favoriteKey: "action:open-applicant"
      },
      {
        id: "action-continue-applicant-review",
        kind: "action",
        category: "actions",
        label: "Continue Applicant Review",
        subtitle: "Pending applications awaiting decision",
        context: "Applicants",
        badge: "Continue",
        status: "Queue",
        statusVariant: "warning",
        icon: "▶",
        href: "/applicants?status=pending_review",
        shortcut: null,
        score: 148,
        favoriteKey: "action:applicant-review"
      }
    );
  }

  if (evaluateCapability(permissions, "property:read")) {
    items.push({
      id: "action-open-property",
      kind: "action",
      category: "actions",
      label: "Open Property",
      subtitle: "Property list — type to search in palette",
      context: "Portfolio",
      badge: "Go",
      status: null,
      statusVariant: "neutral",
      icon: "→",
      href: "/properties",
      shortcut: "G P",
      score: 136,
      favoriteKey: "action:open-property"
    });
  }

  if (evaluateCapability(permissions, "unit:read")) {
    items.push({
      id: "action-open-unit",
      kind: "action",
      category: "actions",
      label: "Open Unit",
      subtitle: "Unit inventory — type a unit number in palette",
      context: "Portfolio",
      badge: "Go",
      status: null,
      statusVariant: "neutral",
      icon: "→",
      href: "/units",
      shortcut: "G U",
      score: 134,
      favoriteKey: "action:open-unit"
    });
  }

  if (evaluateCapability(permissions, "lease:read") || evaluateCapability(permissions, "signature:read")) {
    items.push({
      id: "action-continue-signature",
      kind: "action",
      category: "actions",
      label: "Continue Lease Signing",
      subtitle: "Draft leases awaiting signature",
      context: "Signatures",
      badge: "Continue",
      status: "Pending",
      statusVariant: "warning",
      icon: "▶",
      href: "/leases?status=draft",
      shortcut: null,
      score: 150,
      favoriteKey: "action:continue-signing"
    });
  }

  if (evaluateCapability(permissions, "communication:read")) {
    items.push({
      id: "action-open-inbox",
      kind: "action",
      category: "actions",
      label: "Open Inbox",
      subtitle: "Resident and vendor threads",
      context: "Communications",
      badge: "Continue",
      status: null,
      statusVariant: "info",
      icon: "→",
      href: "/communications/inbox",
      shortcut: "G I",
      score: 145,
      favoriteKey: "action:open-inbox"
    });
  }

  if (evaluateCapability(permissions, "migration:read")) {
    items.push({
      id: "action-continue-migration",
      kind: "action",
      category: "actions",
      label: "Continue Migration",
      subtitle: "Resume import / switching work",
      context: "Migration",
      badge: "Continue",
      status: null,
      statusVariant: "info",
      icon: "▶",
      href: "/migration",
      shortcut: null,
      score: 142,
      favoriteKey: "action:continue-migration"
    });
  }

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
      score: 100,
      favoriteKey: "action:create-property"
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
      score: 100,
      favoriteKey: "action:create-unit"
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
      shortcut: "C N",
      score: 100,
      favoriteKey: "action:create-applicant"
    });
  }

  if (evaluateCapability(permissions, "tenant:create")) {
    items.push({
      id: "action-create-tenant-advanced",
      kind: "action",
      category: "actions",
      label: "Manual resident entry",
      subtitle: "Advanced — record only",
      context: "Admin exception path",
      badge: "Advanced",
      status: "Secondary",
      statusVariant: "neutral",
      icon: "+",
      href: "/tenants/new",
      shortcut: null,
      score: 40,
      favoriteKey: "action:manual-resident"
    });
  }

  if (evaluateCapability(permissions, "lease:create")) {
    items.push({
      id: "action-create-lease",
      kind: "action",
      category: "actions",
      label: "New lease (advanced)",
      subtitle: "Exceptional cases — prefer Move in",
      context: "Lease · admin",
      badge: "Advanced",
      status: "Secondary",
      statusVariant: "neutral",
      icon: "+",
      href: "/leases/new",
      shortcut: "C L",
      score: 45,
      favoriteKey: "action:create-lease"
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
      score: 100,
      favoriteKey: "action:create-announcement"
    });
  }

  if (evaluateCapability(permissions, "financial:create")) {
    items.push(
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
        score: 100,
        favoriteKey: "action:record-expense"
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
        score: 95,
        favoriteKey: "action:generate-statement"
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
      score: 100,
      favoriteKey: "action:create-work-order"
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
      score: 100,
      favoriteKey: "action:create-vendor"
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
    badge: "Go",
    status: null,
    statusVariant: "neutral",
    icon: item.icon,
    href: item.href,
    shortcut: item.shortcut,
    score,
    favoriteKey: `nav:${item.id}`
  };
}
