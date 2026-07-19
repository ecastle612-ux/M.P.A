import type { AnnouncementCategory } from "../communication/contracts";
import type { MaintenanceCategory } from "../maintenance/contracts";

const MAINTENANCE_RULES: Array<{ pattern: RegExp; category: MaintenanceCategory }> = [
  { pattern: /\b(hvac|ac|a\/c|air\s*cond|furnace|heater|thermostat)\b/i, category: "hvac" },
  { pattern: /\b(plumb|leak|pipe|drain|toilet|faucet|water\s*heater)\b/i, category: "plumbing" },
  { pattern: /\b(electr|outlet|breaker|wiring|light\s*fixture)\b/i, category: "electrical" },
  { pattern: /\b(applian|fridge|refriger|dishwasher|washer|dryer|stove|oven)\b/i, category: "appliance" },
  { pattern: /\b(pest|roach|rodent|termite|insect)\b/i, category: "pest" },
  { pattern: /\b(paint|drywall|door|window|floor|carpet|cabinet|interior)\b/i, category: "structural" },
  { pattern: /\b(roof|gutter|siding|exterior|fence|structural)\b/i, category: "structural" },
  { pattern: /\b(landscap|lawn|tree|snow|grounds)\b/i, category: "landscaping" }
];

const ANNOUNCEMENT_RULES: Array<{ pattern: RegExp; category: AnnouncementCategory }> = [
  { pattern: /\b(emergenc|urgent|evacuat|safety|fire|gas\s*leak)\b/i, category: "emergency" },
  { pattern: /\b(mainten|repair|outage|hvac|plumb|water\s*shut)\b/i, category: "maintenance" },
  { pattern: /\b(lease|renewal|rent|move[\s-]?in|move[\s-]?out|deposit)\b/i, category: "lease" },
  { pattern: /\b(community|event|bbq|pool|amenit|newsletter)\b/i, category: "community" }
];

export function suggestMaintenanceCategoryFromTitle(title: string): MaintenanceCategory | null {
  const text = title.trim();
  if (!text) return null;
  for (const rule of MAINTENANCE_RULES) {
    if (rule.pattern.test(text)) return rule.category;
  }
  return null;
}

export function suggestAnnouncementCategoryFromTitle(title: string): AnnouncementCategory | null {
  const text = title.trim();
  if (!text) return null;
  for (const rule of ANNOUNCEMENT_RULES) {
    if (rule.pattern.test(text)) return rule.category;
  }
  return null;
}

/** Default lease term suggestion (company soft default — 12 months from today). */
export function suggestLeaseDateDefaults(today = new Date()): { startDate: string; endDate: string } {
  const start = new Date(today);
  const end = new Date(today);
  end.setFullYear(end.getFullYear() + 1);
  end.setDate(end.getDate() - 1);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10)
  };
}

/** Soft lease number suggestion — server still authoritative when blank. */
export function suggestLeaseNumber(propertyName?: string | null, today = new Date()): string {
  const year = today.getFullYear();
  const slug = (propertyName ?? "LEASE")
    .replace(/[^a-zA-Z0-9]+/g, "")
    .slice(0, 6)
    .toUpperCase() || "LEASE";
  const seq = String(today.getMonth() + 1).padStart(2, "0") + String(today.getDate()).padStart(2, "0");
  return `${slug}-${year}-${seq}`;
}

/** Current calendar month as accounting period defaults. */
export function suggestCurrentAccountingPeriod(today = new Date()): { start: string; end: string; key: string } {
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const startStr = start.toISOString().slice(0, 10);
  const endStr = end.toISOString().slice(0, 10);
  return { start: startStr, end: endStr, key: `${startStr}:${endStr}` };
}
