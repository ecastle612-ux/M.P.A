import Link from "next/link";
import { ContextRail, ContextRailSection } from "../context-rail";
import { formatCurrency } from "../../../lib/financial/contracts";
import { CONTEXT_RAIL_EMPTY } from "../../../lib/experience/context-rail-empty";
import type { RentChargeListItem } from "../../../lib/financial/server";

type PaymentSummary = {
  id: string;
  amount: number;
  paymentDate: string;
};

type ExpenseSummary = {
  id: string;
  amount: number;
  description: string;
  expenseDate: string;
};

export function FinancialChargeContextRail({
  charge,
  recentPayments,
  relatedExpenses,
  ownerStatementStatus,
  leaseHref
}: {
  charge: RentChargeListItem;
  recentPayments: PaymentSummary[];
  relatedExpenses: ExpenseSummary[];
  ownerStatementStatus: string | null;
  leaseHref: string | null;
}) {
  return (
    <ContextRail title="Financial context">
      <ContextRailSection title="Outstanding balance">
        <p className="text-lg font-semibold text-[var(--mpa-color-text-primary)]">
          {formatCurrency(charge.outstandingBalance)}
        </p>
        <p className="text-xs">
          {formatCurrency(charge.amountPaid)} paid of {formatCurrency(charge.amount)}
        </p>
      </ContextRailSection>

      <ContextRailSection title="Recent payments" emptyMessage={CONTEXT_RAIL_EMPTY.financial.payments}>
        {recentPayments.length > 0 ? (
          <ul className="space-y-2">
            {recentPayments.map((payment) => (
              <li key={payment.id} className="text-xs">
                <p className="font-medium">{formatCurrency(payment.amount)}</p>
                <p>{new Date(payment.paymentDate).toLocaleDateString()}</p>
              </li>
            ))}
          </ul>
        ) : null}
      </ContextRailSection>

      <ContextRailSection title="Expenses" emptyMessage={CONTEXT_RAIL_EMPTY.financial.expenses}>
        {relatedExpenses.length > 0 ? (
          <ul className="space-y-2">
            {relatedExpenses.slice(0, 4).map((expense) => (
              <li key={expense.id} className="text-xs">
                <p className="font-medium">{formatCurrency(expense.amount)}</p>
                <p>{expense.description}</p>
              </li>
            ))}
          </ul>
        ) : null}
      </ContextRailSection>

      <ContextRailSection title="NOI snapshot" variant="muted">
        <p className="text-xs">
          Property-level NOI available on the{" "}
          <Link href="/financials" className="font-medium text-[var(--mpa-color-brand-primary)] hover:underline">
            financials dashboard
          </Link>
          .
        </p>
      </ContextRailSection>

      <ContextRailSection title="Owner statement">
        <p className="text-xs">{ownerStatementStatus ?? "No statement linked to this charge period."}</p>
        <Link href="/financials/owner-statements" className="mt-1 inline-block text-xs font-medium text-[var(--mpa-color-brand-primary)] hover:underline">
          View statements →
        </Link>
      </ContextRailSection>

      <ContextRailSection title="Related lease">
        {leaseHref && charge.leaseId ? (
          <Link href={leaseHref} className="font-medium text-[var(--mpa-color-brand-primary)] hover:underline">
            {charge.tenantName ? `${charge.tenantName}'s lease` : charge.leaseId}
          </Link>
        ) : (
          <p className="text-xs">{charge.leaseId ?? "No lease linked"}</p>
        )}
        {charge.propertyName ? (
          <p className="mt-1 text-xs">
            {charge.propertyName}
            {charge.unitNumber ? ` · Unit ${charge.unitNumber}` : ""}
          </p>
        ) : null}
      </ContextRailSection>
    </ContextRail>
  );
}
