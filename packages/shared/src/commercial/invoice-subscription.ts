/**
 * Resolve Stripe subscription IDs from Invoice webhook payloads.
 *
 * Stripe Invoice objects may expose the subscription as:
 * - legacy/top-level: `invoice.subscription`
 * - nested (newer API shapes): `invoice.parent.subscription_details.subscription`
 */

export type InvoiceSubscriptionSource = {
  subscription?: unknown;
  parent?: unknown;
};

function asSubscriptionId(value: unknown): string | null {
  if (typeof value === "string" && value.startsWith("sub_")) {
    return value;
  }
  if (
    value &&
    typeof value === "object" &&
    "id" in value &&
    typeof (value as { id: unknown }).id === "string" &&
    (value as { id: string }).id.startsWith("sub_")
  ) {
    return (value as { id: string }).id;
  }
  return null;
}

/**
 * Returns the subscription id for lifecycle invoice handlers, or null when absent/malformed.
 * Prefer top-level `subscription` when present; otherwise read nested parent details.
 */
export function resolveInvoiceSubscriptionId(
  invoice: InvoiceSubscriptionSource | null | undefined
): string | null {
  if (!invoice || typeof invoice !== "object") {
    return null;
  }

  const topLevel = asSubscriptionId(invoice.subscription);
  if (topLevel) {
    return topLevel;
  }

  const parent = invoice.parent;
  if (!parent || typeof parent !== "object") {
    return null;
  }

  const details = (parent as { subscription_details?: unknown }).subscription_details;
  if (!details || typeof details !== "object") {
    return null;
  }

  return asSubscriptionId((details as { subscription?: unknown }).subscription);
}
