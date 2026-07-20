import { emptyMoveOutChecklist } from "../../lib/resident-lifecycle/contracts";

export { emptyMoveOutChecklist };

export function formatCurrencySafe(amount: number): string {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}
