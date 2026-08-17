/** Shared Badge variant names used across Canopy surfaces. */
export type StatusBadgeVariant = "neutral" | "success" | "warning" | "danger" | "info";

/**
 * Map free-form status strings to Canopy Badge variants.
 * Preserves domain labels; only the visual tone is shared.
 */
export function resolveStatusBadgeVariant(status: string): StatusBadgeVariant {
  const normalized = status.toLowerCase();
  if (
    [
      "active",
      "occupied",
      "paid",
      "complete",
      "completed",
      "closed",
      "ok",
      "accepted",
      "succeeded",
      "yes"
    ].some(
      (k) => normalized.includes(k)
    )
  ) {
    return "success";
  }
  if (
    [
      "pending",
      "invited",
      "draft",
      "sent",
      "in_progress",
      "in progress",
      "assigned",
      "open",
      "available",
      "trial",
      "processing",
      "incomplete",
      "warn",
      "scheduled",
      "waiting"
    ].some((k) => normalized.includes(k))
  ) {
    return "warning";
  }
  if (
    [
      "overdue",
      "emergency",
      "critical",
      "failed",
      "fail",
      "cancelled",
      "cancel",
      "delinquent",
      "vacant",
      "suspend",
      "down",
      "expired",
      "unpaid",
      "revoked",
      "no"
    ].some((k) => normalized.includes(k))
  ) {
    return "danger";
  }
  if (["moved_out", "moved out", "former"].some((k) => normalized.includes(k))) {
    return "neutral";
  }
  if (["info", "trialing"].some((k) => normalized.includes(k))) {
    return "info";
  }
  return "neutral";
}

/** Priority / urgency tones used by Complete + Mission Control. */
export function resolvePriorityToneVariant(
  tone: "critical" | "watch" | "ok" | "neutral" | string
): StatusBadgeVariant {
  if (tone === "critical") return "danger";
  if (tone === "watch") return "warning";
  if (tone === "ok") return "success";
  return "neutral";
}

/** Admin health tones. */
export function resolveHealthToneVariant(
  tone: "ok" | "warn" | "down" | "info" | "neutral" | string
): StatusBadgeVariant {
  switch (tone) {
    case "ok":
      return "success";
    case "warn":
      return "warning";
    case "down":
      return "danger";
    case "info":
      return "info";
    default:
      return "neutral";
  }
}

/** Work-order / maintenance priority labels (PM + FO + Complete). */
export function resolveWorkOrderPriorityVariant(priority: string): StatusBadgeVariant {
  const p = priority.toLowerCase();
  if (
    p.includes("urgent") ||
    p.includes("critical") ||
    p.includes("emergency") ||
    p === "p0" ||
    p === "high"
  ) {
    return "danger";
  }
  if (p.includes("medium") || p === "p1" || p === "p2") {
    return "warning";
  }
  if (p.includes("low") || p === "p3") {
    return "neutral";
  }
  return resolveStatusBadgeVariant(priority);
}
