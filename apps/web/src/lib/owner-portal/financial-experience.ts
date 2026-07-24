import type { User } from "@supabase/supabase-js";
import { evaluatePermission, resolveAuthorizationContext } from "../auth/authorization";
import type { createAuthServerComponentClient } from "../auth/server";
import { formatCurrency, type StatementStatus } from "../financial/contracts";
import {
  getExpensesForOrganization,
  getOwnerStatementsForOrganization,
  getPaymentsForOrganization,
  getPropertyFinancialSummary,
  getRentChargesForOrganization
} from "../financial/server";
import { ReportingService } from "../reporting/service";
import {
  getOwnerConnectStatus,
  type ConnectStatusView
} from "../owner-payouts/service";
import {
  listOwnerPayoutHistory,
  listOwnerRemittanceRecords,
  ownerPayoutProjectionPropertyIds,
  type OwnerPayoutHistoryRow,
  type PayoutRemittanceRecord
} from "../owner-payouts/projections";
import {
  cappedOwnerPropertyIds,
  resolveOwnerPropertyScope,
  type OwnerPropertyScope
} from "./access";
import type { OwnerFinancialStatementRow } from "./financial-shared";

export type { OwnerFinancialStatementRow } from "./financial-shared";

type SupabaseClient = Awaited<ReturnType<typeof createAuthServerComponentClient>>;

export type OwnerFinancialKpis = {
  currentBalanceLabel: string;
  collectionsMtdLabel: string;
  expensesMtdLabel: string;
  outstandingBalanceLabel: string;
  noiLabel: string | null;
};

export type OwnerFinancialPropertyCard = {
  propertyId: string;
  propertyName: string;
  revenueLabel: string;
  expensesLabel: string;
  outstandingLabel: string;
  occupancyLabel: string;
  latestStatementLabel: string | null;
  href: string;
};

export type OwnerFinancialTransactionRow = {
  id: string;
  kind: "payment" | "expense" | "adjustment";
  title: string;
  propertyName: string;
  amountLabel: string;
  dateLabel: string;
  statusLabel: string;
};

export type OwnerFinancialExperienceModel = {
  scope: OwnerPropertyScope;
  empty: boolean;
  kpis: OwnerFinancialKpis | null;
  propertyCards: OwnerFinancialPropertyCard[];
  statements: OwnerFinancialStatementRow[];
  transactions: OwnerFinancialTransactionRow[];
  loadNotes: string[];
  connectStatus: ConnectStatusView | null;
  canOnboardPayouts: boolean;
  /** Phase B — Account Link return query was present */
  connectReturnedFromLink: boolean;
  /** FIN-003 Phase D — TransferIntent projections (read-only) */
  payoutHistory: OwnerPayoutHistoryRow[];
  remittanceRecords: PayoutRemittanceRecord[];
};

async function safeLoad<T>(loader: () => Promise<T>): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  try {
    return { ok: true, data: await loader() };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unable to load data."
    };
  }
}

function statementStatusLabel(status: StatementStatus): string {
  const labels: Record<StatementStatus, string> = {
    draft: "Draft",
    generated: "Generated",
    sent: "Sent",
    archived: "Archived"
  };
  return labels[status];
}

function formatDateLabel(value: string | null | undefined): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString();
}

function periodYearMonth(periodEnd: string): { year: number; month: number } | null {
  const match = /^(\d{4})-(\d{2})/.exec(periodEnd);
  if (!match) return null;
  return { year: Number(match[1]), month: Number(match[2]) };
}

/**
 * OWNER-001 Phase 4 — read-only financial experience for owner-authorized properties.
 * Aggregates only values already returned by getPropertyFinancialSummary (no new math engines).
 */
export async function loadOwnerFinancialExperience(input: {
  user: User;
  organizationId: string;
  supabase: SupabaseClient;
  connectReturnedFromLink?: boolean;
}): Promise<OwnerFinancialExperienceModel> {
  const { user, organizationId, supabase } = input;
  const connectReturnedFromLink = Boolean(input.connectReturnedFromLink);
  const authorization = await resolveAuthorizationContext(user, organizationId);
  if (!evaluatePermission(authorization, "financial:read")) {
    throw new Error("Financial access is not enabled for this account.");
  }

  const scope = await resolveOwnerPropertyScope({ organizationId, user, supabase });
  const canOnboardPayouts = evaluatePermission(authorization, "payout:onboard");
  let connectStatus: ConnectStatusView | null = null;
  try {
    connectStatus = await getOwnerConnectStatus({
      organizationId,
      ownerUserId: user.id,
      canOnboard: canOnboardPayouts,
      client: supabase
    });
  } catch {
    connectStatus = null;
  }

  if (scope.propertyIds.length === 0) {
    return {
      scope,
      empty: true,
      kpis: null,
      propertyCards: [],
      statements: [],
      transactions: [],
      loadNotes: [],
      connectStatus,
      canOnboardPayouts,
      connectReturnedFromLink,
      payoutHistory: [],
      remittanceRecords: []
    };
  }

  const cappedIds = cappedOwnerPropertyIds(scope, 20);
  const propertyNameById = new Map(scope.properties.map((property) => [property.id, property.name]));
  const loadNotes: string[] = [];

  const summariesResult = await safeLoad(() =>
    Promise.all(cappedIds.map((propertyId) => getPropertyFinancialSummary(organizationId, propertyId, supabase)))
  );

  if (!summariesResult.ok) {
    return {
      scope,
      empty: false,
      kpis: null,
      propertyCards: [],
      statements: [],
      transactions: [],
      loadNotes: [summariesResult.error],
      connectStatus,
      canOnboardPayouts,
      connectReturnedFromLink,
      payoutHistory: [],
      remittanceRecords: []
    };
  }

  const summaries = summariesResult.data;
  const collectionsMtd = summaries.reduce((sum, row) => sum + row.monthlyIncome, 0);
  const expensesMtd = summaries.reduce((sum, row) => sum + row.monthlyExpenses, 0);
  const outstandingTotal = summaries.reduce((sum, row) => sum + row.outstandingBalance, 0);
  const collectedRentTotal = summaries.reduce((sum, row) => sum + row.collectedRent, 0);
  const noiTotal = summaries.reduce((sum, row) => sum + row.noi, 0);

  const kpis: OwnerFinancialKpis = {
    currentBalanceLabel: formatCurrency(collectedRentTotal),
    collectionsMtdLabel: formatCurrency(collectionsMtd),
    expensesMtdLabel: formatCurrency(expensesMtd),
    outstandingBalanceLabel: formatCurrency(outstandingTotal),
    noiLabel: formatCurrency(noiTotal)
  };

  const statementsByProperty = await Promise.all(
    cappedIds.map(async (propertyId) => {
      const result = await safeLoad(() =>
        getOwnerStatementsForOrganization(organizationId, { propertyId, limit: 10 }, supabase)
      );
      return { propertyId, result };
    })
  );

  const downloadByStatementKey = new Map<string, string>();
  const propertiesWithStatements = new Set(
    statementsByProperty.filter((row) => row.result.ok && row.result.data.length > 0).map((row) => row.propertyId)
  );

  await Promise.all(
    [...propertiesWithStatements].map(async (propertyId) => {
      const versionsResult = await safeLoad(() =>
        ReportingService.listVersions({
          organizationId,
          propertyId,
          reportType: "owner_statement"
        })
      );
      if (!versionsResult.ok) {
        loadNotes.push(`Statement PDF lookup unavailable for one property.`);
        return;
      }
      for (const version of versionsResult.data) {
        const key = `${propertyId}:${version.year}-${String(version.month).padStart(2, "0")}`;
        if (!downloadByStatementKey.has(key) && version.downloadPath) {
          downloadByStatementKey.set(key, version.downloadPath);
        }
      }
    })
  );

  const statements: OwnerFinancialStatementRow[] = [];
  for (const { propertyId, result } of statementsByProperty) {
    if (!result.ok) {
      loadNotes.push(`Statements could not be loaded for ${propertyNameById.get(propertyId) ?? "a property"}.`);
      continue;
    }
    for (const statement of result.data) {
      const ym = periodYearMonth(statement.statementPeriodEnd);
      const downloadHref =
        ym != null
          ? (downloadByStatementKey.get(
              `${propertyId}:${ym.year}-${String(ym.month).padStart(2, "0")}`
            ) ?? null)
          : null;
      statements.push({
        id: statement.id,
        propertyId,
        propertyName: propertyNameById.get(propertyId) ?? statement.propertyName ?? "Property",
        statementNumber: statement.statementNumber,
        statementDateLabel:
          formatDateLabel(statement.generatedAt) ??
          formatDateLabel(statement.createdAt) ??
          formatDateLabel(statement.statementPeriodEnd) ??
          "—",
        periodLabel: `${statement.statementPeriodStart} → ${statement.statementPeriodEnd}`,
        status: statement.status,
        statusLabel: statementStatusLabel(statement.status),
        generatedAtLabel: formatDateLabel(statement.generatedAt),
        downloadHref
      });
    }
  }
  statements.sort((a, b) => (a.periodLabel < b.periodLabel ? 1 : a.periodLabel > b.periodLabel ? -1 : 0));

  const latestStatementLabelByProperty = new Map<string, string>();
  for (const statement of statements) {
    if (!latestStatementLabelByProperty.has(statement.propertyId)) {
      latestStatementLabelByProperty.set(statement.propertyId, statement.periodLabel);
    }
  }

  const propertyCards: OwnerFinancialPropertyCard[] = cappedIds.map((propertyId) => {
    const summary = summaries.find((row) => row.propertyId === propertyId);
    const property = scope.properties.find((item) => item.id === propertyId);
    const occupancy =
      property && property.unitCount > 0
        ? `${Math.round((property.occupiedUnits / property.unitCount) * 100)}%`
        : "—";
    return {
      propertyId,
      propertyName: propertyNameById.get(propertyId) ?? "Property",
      revenueLabel: formatCurrency(summary?.monthlyIncome ?? 0),
      expensesLabel: formatCurrency(summary?.monthlyExpenses ?? 0),
      outstandingLabel: formatCurrency(summary?.outstandingBalance ?? 0),
      occupancyLabel: occupancy,
      latestStatementLabel: latestStatementLabelByProperty.get(propertyId) ?? null,
      href: `/portal/owner/properties/${propertyId}`
    };
  });

  const [paymentsBundles, expensesBundles, chargesBundles] = await Promise.all([
    Promise.all(
      cappedIds.map(async (propertyId) => {
        const result = await safeLoad(() =>
          getPaymentsForOrganization(organizationId, { propertyId, limit: 8 }, supabase)
        );
        return { propertyId, result };
      })
    ),
    Promise.all(
      cappedIds.map(async (propertyId) => {
        const result = await safeLoad(() =>
          getExpensesForOrganization(organizationId, { propertyId, limit: 8 }, supabase)
        );
        return { propertyId, result };
      })
    ),
    Promise.all(
      cappedIds.map(async (propertyId) => {
        const result = await safeLoad(() =>
          getRentChargesForOrganization(organizationId, { propertyId, limit: 20 }, supabase)
        );
        return { propertyId, result };
      })
    )
  ]);

  const transactions: OwnerFinancialTransactionRow[] = [];

  for (const { propertyId, result } of paymentsBundles) {
    if (!result.ok) {
      loadNotes.push("Some payment history could not be loaded.");
      continue;
    }
    for (const payment of result.data) {
      // Safe projection — no payment method, bank refs, or metadata.
      transactions.push({
        id: `pay-${payment.id}`,
        kind: "payment",
        title: payment.paymentNumber || "Payment",
        propertyName: propertyNameById.get(propertyId) ?? "Property",
        amountLabel: formatCurrency(payment.amount),
        dateLabel: formatDateLabel(payment.paymentDate) ?? payment.paymentDate,
        statusLabel: payment.status
      });
    }
  }

  for (const { propertyId, result } of expensesBundles) {
    if (!result.ok) {
      loadNotes.push("Some expense history could not be loaded.");
      continue;
    }
    for (const expense of result.data) {
      // Safe projection — no vendor ids, bill placeholders, or metadata.
      transactions.push({
        id: `exp-${expense.id}`,
        kind: "expense",
        title: expense.description || expense.expenseNumber,
        propertyName: propertyNameById.get(propertyId) ?? "Property",
        amountLabel: formatCurrency(expense.amount),
        dateLabel: formatDateLabel(expense.expenseDate) ?? expense.expenseDate,
        statusLabel: expense.status
      });
    }
  }

  for (const { propertyId, result } of chargesBundles) {
    if (!result.ok) {
      loadNotes.push("Some adjustment history could not be loaded.");
      continue;
    }
    for (const charge of result.data) {
      if (charge.chargeType !== "adjustment" && charge.chargeType !== "credit") continue;
      transactions.push({
        id: `adj-${charge.id}`,
        kind: "adjustment",
        title: charge.description || charge.chargeNumber,
        propertyName: propertyNameById.get(propertyId) ?? "Property",
        amountLabel: formatCurrency(charge.amount),
        dateLabel: formatDateLabel(charge.dueDate) ?? charge.dueDate,
        statusLabel: charge.status
      });
    }
  }

  transactions.sort((a, b) => (a.dateLabel < b.dateLabel ? 1 : a.dateLabel > b.dateLabel ? -1 : 0));

  if (scope.propertyIds.length > cappedIds.length) {
    loadNotes.push(
      `Showing financial detail for the first ${cappedIds.length} of ${scope.propertyIds.length} properties.`
    );
  }

  // R-D3 — payout/remittance projections use full owner property scope (not summary cap)
  const payoutPropertyIds = ownerPayoutProjectionPropertyIds(scope.propertyIds);
  let payoutHistory: OwnerPayoutHistoryRow[] = [];
  let remittanceRecords: PayoutRemittanceRecord[] = [];
  const payoutResult = await safeLoad(() =>
    listOwnerPayoutHistory({
      organizationId,
      ownerUserId: user.id,
      propertyIds: payoutPropertyIds,
      client: supabase,
      limit: 100
    })
  );
  if (payoutResult.ok) {
    payoutHistory = payoutResult.data;
  } else {
    loadNotes.push("Owner payout history could not be loaded.");
  }
  const remittanceResult = await safeLoad(() =>
    listOwnerRemittanceRecords({
      organizationId,
      ownerUserId: user.id,
      propertyIds: payoutPropertyIds,
      client: supabase,
      limit: 100
    })
  );
  if (remittanceResult.ok) {
    remittanceRecords = remittanceResult.data;
  } else {
    loadNotes.push("Payout remittance records could not be loaded.");
  }

  return {
    scope,
    empty: false,
    kpis,
    propertyCards,
    statements: statements.slice(0, 40),
    transactions: transactions.slice(0, 30),
    loadNotes: [...new Set(loadNotes)],
    connectStatus,
    canOnboardPayouts,
    connectReturnedFromLink,
    payoutHistory,
    remittanceRecords
  };
}
