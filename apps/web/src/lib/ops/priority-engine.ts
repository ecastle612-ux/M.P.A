/**
 * OPS-001 Slice C — Operational Priority Engine (A03).
 * Single scale: Critical → High → Medium → Low.
 */

export const OPS_PRIORITIES = ["critical", "high", "medium", "low"] as const;
export type OpsPriority = (typeof OPS_PRIORITIES)[number];

const RANK: Record<OpsPriority, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1
};

const SAFETY_HINTS = [
  "gas leak",
  "gas_leak",
  "fire",
  "flood",
  "smoke",
  "electrical hazard",
  "emergency",
  "life safety",
  "carbon monoxide",
  "co leak",
  "structural collapse"
];

export function isOpsPriority(value: string): value is OpsPriority {
  return (OPS_PRIORITIES as readonly string[]).includes(value);
}

export function priorityRank(priority: OpsPriority): number {
  return RANK[priority];
}

/** Higher rank wins. */
export function maxPriority(...priorities: OpsPriority[]): OpsPriority {
  return priorities.reduce((best, next) =>
    priorityRank(next) > priorityRank(best) ? next : best
  );
}

/**
 * Map maintenance work-order domain priority → OPS Priority Engine scale.
 * WO: low | medium | high | emergency
 */
export function mapWorkOrderPriorityToOps(
  woPriority: string | null | undefined
): OpsPriority {
  switch ((woPriority ?? "").toLowerCase()) {
    case "emergency":
      return "critical";
    case "high":
      return "high";
    case "low":
      return "low";
    case "medium":
    default:
      return "medium";
  }
}

/** Map OPS priority → Slice B notify priority slots. */
export function opsPriorityToNotifyPriority(
  priority: OpsPriority
): "low" | "normal" | "high" | "emergency" {
  switch (priority) {
    case "critical":
      return "emergency";
    case "high":
      return "high";
    case "low":
      return "low";
    case "medium":
    default:
      return "normal";
  }
}

export type ResolvePriorityInput = {
  /** Event-type default when no other signal */
  eventType?: string | null | undefined;
  /** Domain WO priority or explicit OPS priority */
  domainPriority?: string | null | undefined;
  /** Free-text title/summary/details for safety keyword scan */
  safetyText?: string | null | undefined;
  /** Manual override (audited at call site) */
  manualOverride?: OpsPriority | null | undefined;
  /** Inherited from parent workflow / subject */
  inherited?: OpsPriority | null | undefined;
};

function defaultForEventType(eventType: string | null | undefined): OpsPriority {
  if (!eventType) return "medium";
  if (eventType === "maintenance.overdue") return "high";
  if (eventType.startsWith("maintenance.")) return "medium";
  return "medium";
}

function detectSafetyCritical(text: string | null | undefined): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  return SAFETY_HINTS.some((hint) => lower.includes(hint));
}

/**
 * Resolve operational priority (max of signals). Safety keywords force Critical.
 */
export function resolveOpsPriority(input: ResolvePriorityInput): OpsPriority {
  if (input.manualOverride && isOpsPriority(input.manualOverride)) {
    return input.manualOverride;
  }

  if (detectSafetyCritical(input.safetyText)) {
    return "critical";
  }

  const candidates: OpsPriority[] = [defaultForEventType(input.eventType ?? null)];

  if (input.inherited && isOpsPriority(input.inherited)) {
    candidates.push(input.inherited);
  }

  const domain = (input.domainPriority ?? "").toLowerCase();
  if (isOpsPriority(domain)) {
    candidates.push(domain);
  } else if (domain) {
    candidates.push(mapWorkOrderPriorityToOps(domain));
  }

  return maxPriority(...candidates);
}

/** Sort comparator: critical first, then due date ascending (nulls last). */
export function compareTasksByPriorityThenDue(
  a: { priority: OpsPriority; dueAt?: string | null },
  b: { priority: OpsPriority; dueAt?: string | null }
): number {
  const rankDiff = priorityRank(b.priority) - priorityRank(a.priority);
  if (rankDiff !== 0) return rankDiff;
  if (!a.dueAt && !b.dueAt) return 0;
  if (!a.dueAt) return 1;
  if (!b.dueAt) return -1;
  return a.dueAt.localeCompare(b.dueAt);
}
