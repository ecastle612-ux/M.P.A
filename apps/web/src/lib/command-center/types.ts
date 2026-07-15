import type { OrganizationSummary } from "../organization/contracts";

export const COMMAND_CENTER_CATEGORIES = [
  "pinned",
  "favorites",
  "recent",
  "properties",
  "units",
  "tenants",
  "maintenance",
  "vendors",
  "leases",
  "organizations",
  "actions",
  "navigation"
] as const;

export type CommandCenterCategory = (typeof COMMAND_CENTER_CATEGORIES)[number];

export type CommandCenterItemKind =
  | "property"
  | "unit"
  | "tenant"
  | "maintenance"
  | "vendor"
  | "lease"
  | "organization"
  | "navigation"
  | "action"
  | "recent"
  | "favorite"
  | "dashboard";

export type CommandCenterStatusVariant = "success" | "warning" | "danger" | "neutral" | "info";

export type CommandCenterResult = {
  id: string;
  kind: CommandCenterItemKind;
  category: CommandCenterCategory;
  label: string;
  subtitle: string | null;
  context: string | null;
  badge: string;
  status: string | null;
  statusVariant: CommandCenterStatusVariant;
  icon: string;
  href: string | null;
  shortcut: string | null;
  score: number;
  onSelect?: () => void | Promise<void>;
  favoriteKey?: string;
};

export type CommandCenterSection = {
  category: CommandCenterCategory;
  title: string;
  items: CommandCenterResult[];
};

export type CommandCenterSearchContext = {
  query: string;
  organizations: OrganizationSummary[];
  permissions: readonly string[];
  signal: AbortSignal;
};

export type CommandCenterProvider = {
  id: string;
  category: CommandCenterCategory;
  sectionTitle: string;
  priority: number;
  enabled?: (context: CommandCenterSearchContext) => boolean;
  search: (context: CommandCenterSearchContext) => Promise<CommandCenterResult[]>;
};

export type CommandCenterProviderRegistration = CommandCenterProvider & {
  source: "core" | "extension";
};
