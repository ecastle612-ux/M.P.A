import type { User } from "@supabase/supabase-js";
import { evaluatePermission, resolveAuthorizationContext } from "../auth/authorization";
import { formatCurrency } from "../financial/contracts";
import {
  getExpensesForOrganization,
  getOwnerStatementsForOrganization,
  getPropertyFinancialSummary
} from "../financial/server";
import { getNotificationsForUser } from "../notifications/server";
import type { createAuthServerComponentClient } from "../auth/server";
import {
  cappedOwnerPropertyIds,
  filterByOwnerPropertyScope,
  filterNotificationsForOwnerScope,
  resolveOwnerPropertyScope,
  type OwnerPropertyScope,
  type OwnerPropertyScopeMode
} from "./access";
import { loadOwnerDocumentsExperience } from "./documents-experience";
import { loadOwnerMessagingExperience } from "./messaging-experience";
import { getOwnerConnectStatus } from "../owner-payouts/service";
import { eligibilityLabel } from "../integrations/connect";

type SupabaseClient = Awaited<ReturnType<typeof createAuthServerComponentClient>>;

export type OwnerDashboardWidgetState =
  | { status: "ready"; value: string; detail?: string; href?: string }
  | { status: "empty"; message: string; href?: string }
  | { status: "unavailable"; message: string }
  | { status: "error"; message: string };

export type OwnerDashboardListItem = {
  id: string;
  title: string;
  subtitle?: string;
  href?: string;
};

export type OwnerDashboardListWidgetState =
  | { status: "ready"; items: OwnerDashboardListItem[]; href?: string }
  | { status: "empty"; message: string; href?: string }
  | { status: "unavailable"; message: string }
  | { status: "error"; message: string };

export type OwnerPortalDashboardModel = {
  welcomeName: string;
  propertyCount: number;
  scopeMode: OwnerPropertyScopeMode;
  ownerPropertyAccessTableMissing: boolean;
  propertyCountWidget: OwnerDashboardWidgetState;
  occupancy: OwnerDashboardWidgetState;
  /** Recent completed collections on accessible properties (MTD via property summaries). */
  revenue: OwnerDashboardWidgetState;
  /** Recent expenses on accessible properties (MTD via property summaries). */
  expenses: OwnerDashboardWidgetState;
  outstanding: OwnerDashboardWidgetState;
  latestStatement: OwnerDashboardListWidgetState;
  recentVendorExpenses: OwnerDashboardListWidgetState;
  pendingPayout: OwnerDashboardWidgetState;
  recentMessages: OwnerDashboardListWidgetState;
  recentDocuments: OwnerDashboardListWidgetState;
  recentReports: OwnerDashboardListWidgetState;
  notifications: OwnerDashboardListWidgetState;
  attentionItems: OwnerDashboardListItem[];
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

function toOccupancyWidget(scope: OwnerPropertyScope): OwnerDashboardWidgetState {
  if (scope.properties.length === 0) {
    return {
      status: "empty",
      message: "No properties are linked to your owner access yet.",
      href: "/portal/owner/properties"
    };
  }
  const units = scope.properties.reduce((sum, property) => sum + property.unitCount, 0);
  const occupied = scope.properties.reduce((sum, property) => sum + property.occupiedUnits, 0);
  if (units === 0) {
    return {
      status: "empty",
      message: "Units are not configured for these properties yet.",
      href: "/portal/owner/properties"
    };
  }
  const rate = Math.round((occupied / units) * 100);
  return {
    status: "ready",
    value: `${rate}%`,
    detail: `${occupied} of ${units} units occupied`,
    href: "/portal/owner/properties"
  };
}

/**
 * OWNER-001 Phase 2 — owner-scoped dashboard model from existing services only.
 * Pending payout widget shows Connect eligibility only (FIN-003 Phase A) — no payout math.
 */
export async function loadOwnerPortalDashboard(input: {
  user: User;
  organizationId: string;
  supabase: SupabaseClient;
}): Promise<OwnerPortalDashboardModel> {
  const { user, organizationId, supabase } = input;
  const authorization = await resolveAuthorizationContext(user, organizationId);

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("display_name")
    .eq("user_id", user.id)
    .maybeSingle();
  const welcomeName = (profile?.display_name as string | null | undefined)?.trim() || "";

  const canReadProperties = evaluatePermission(authorization, "property:read");
  const canReadFinancials = evaluatePermission(authorization, "financial:read");
  const canReadMessages = evaluatePermission(authorization, "message:read");
  const canReadDocuments = evaluatePermission(authorization, "document:read");
  const canReadNotifications = evaluatePermission(authorization, "notification:read");

  let scope: OwnerPropertyScope | null = null;
  let scopeLoadError: string | null = null;
  if (canReadProperties) {
    const scopeResult = await safeLoad(() =>
      resolveOwnerPropertyScope({ organizationId, user, supabase })
    );
    if (scopeResult.ok) {
      scope = scopeResult.data;
    } else {
      scopeLoadError = scopeResult.error;
    }
  }

  const activeScope: OwnerPropertyScope =
    scope ??
    ({
      organizationId,
      userId: user.id,
      properties: [],
      propertyIds: [],
      propertyIdSet: new Set(),
      scopeMode: "empty" as const,
      ownerPropertyAccessTableMissing: true
    } satisfies OwnerPropertyScope);

  const propertyCount = activeScope.properties.length;
  const propertyCountWidget: OwnerDashboardWidgetState = !canReadProperties
    ? { status: "unavailable", message: "Property access is not enabled for this account." }
    : scopeLoadError
      ? { status: "error", message: scopeLoadError }
      : propertyCount === 0
        ? {
            status: "empty",
            message: "No properties are linked to your owner access yet.",
            href: "/portal/owner/properties"
          }
        : {
            status: "ready",
            value: String(propertyCount),
            detail:
              activeScope.scopeMode === "contact_email"
                ? "Matched to your owner contact email"
                : "Properties in your organization owner access",
            href: "/portal/owner/properties"
          };

  const occupancy: OwnerDashboardWidgetState = !canReadProperties
    ? { status: "unavailable", message: "Property access is not enabled for this account." }
    : scopeLoadError
      ? { status: "error", message: scopeLoadError }
      : toOccupancyWidget(activeScope);

  let revenue: OwnerDashboardWidgetState;
  let expenses: OwnerDashboardWidgetState;
  let outstanding: OwnerDashboardWidgetState;
  let latestStatement: OwnerDashboardListWidgetState;
  let recentVendorExpenses: OwnerDashboardListWidgetState;
  let recentReports: OwnerDashboardListWidgetState;

  const pendingPayout: OwnerDashboardWidgetState = await (async () => {
    try {
      const canOnboard = evaluatePermission(authorization, "payout:onboard");
      const connect = await getOwnerConnectStatus({
        organizationId,
        ownerUserId: user.id,
        canOnboard,
        client: supabase
      });
      if (!connect.phaseAEnabled) {
        return {
          status: "empty" as const,
          message: "Owner payout Connect onboarding is temporarily disabled.",
          href: "/portal/owner/financials"
        };
      }
      if (connect.status === "not_started") {
        return {
          status: "empty" as const,
          message: connect.nextStepMessage,
          href: "/portal/owner/financials"
        };
      }
      return {
        status: "ready" as const,
        value: eligibilityLabel(connect.status),
        detail: connect.nextStepMessage,
        href: "/portal/owner/financials"
      };
    } catch {
      return {
        status: "empty" as const,
        message: "Payout connection status unavailable. Eligibility only — no money movement yet.",
        href: "/portal/owner/financials"
      };
    }
  })();

  if (!canReadFinancials) {
    revenue = {
      status: "unavailable",
      message: "Financial access is not enabled for this account."
    };
    expenses = {
      status: "unavailable",
      message: "Financial access is not enabled for this account."
    };
    outstanding = {
      status: "unavailable",
      message: "Financial access is not enabled for this account."
    };
    latestStatement = {
      status: "unavailable",
      message: "Statement access requires financial permissions."
    };
    recentVendorExpenses = {
      status: "unavailable",
      message: "Expense access requires financial permissions."
    };
    recentReports = {
      status: "unavailable",
      message: "Report access requires financial permissions."
    };
  } else if (activeScope.propertyIds.length === 0) {
    const emptyFinance: OwnerDashboardWidgetState = {
      status: "empty",
      message: "Financial activity appears when properties are linked to your owner access.",
      href: "/portal/owner/financials"
    };
    revenue = emptyFinance;
    expenses = emptyFinance;
    outstanding = emptyFinance;
    latestStatement = {
      status: "empty",
      message: "No statements yet for your properties.",
      href: "/portal/owner/financials#statements"
    };
    recentVendorExpenses = {
      status: "empty",
      message: "No vendor expenses yet for your properties.",
      href: "/portal/owner/financials"
    };
    recentReports = {
      status: "empty",
      message: "No reports yet for your properties.",
      href: "/portal/owner/reports"
    };
  } else {
    const summariesResult = await safeLoad(async () => {
      const capped = cappedOwnerPropertyIds(activeScope, 20);
      return Promise.all(
        capped.map((propertyId) => getPropertyFinancialSummary(organizationId, propertyId, supabase))
      );
    });

    if (!summariesResult.ok) {
      revenue = { status: "error", message: summariesResult.error };
      expenses = { status: "error", message: summariesResult.error };
      outstanding = { status: "error", message: summariesResult.error };
    } else {
      const collectionsMtd = summariesResult.data.reduce((sum, row) => sum + row.monthlyIncome, 0);
      const expensesMtd = summariesResult.data.reduce((sum, row) => sum + row.monthlyExpenses, 0);
      const outstandingTotal = summariesResult.data.reduce((sum, row) => sum + row.outstandingBalance, 0);

      revenue =
        collectionsMtd === 0
          ? {
              status: "empty",
              message: "No rent collections recorded for your properties this month.",
              href: "/portal/owner/financials"
            }
          : {
              status: "ready",
              value: formatCurrency(collectionsMtd),
              detail: "Collections this month (accessible properties)",
              href: "/portal/owner/financials"
            };

      expenses =
        expensesMtd === 0
          ? {
              status: "empty",
              message: "No expenses recorded for your properties this month.",
              href: "/portal/owner/financials"
            }
          : {
              status: "ready",
              value: formatCurrency(expensesMtd),
              detail: "Expenses this month (accessible properties)",
              href: "/portal/owner/financials"
            };

      outstanding =
        outstandingTotal === 0
          ? {
              status: "empty",
              message: "No outstanding balances on your properties.",
              href: "/portal/owner/financials"
            }
          : {
              status: "ready",
              value: formatCurrency(outstandingTotal),
              detail: "Outstanding rent on accessible properties",
              href: "/portal/owner/financials"
            };
    }

    const expensesListResult = await safeLoad(() =>
      getExpensesForOrganization(organizationId, { limit: 40 }, supabase)
    );
    if (!expensesListResult.ok) {
      recentVendorExpenses = { status: "error", message: expensesListResult.error };
    } else {
      const scopedExpenses = filterByOwnerPropertyScope(
        expensesListResult.data,
        activeScope,
        (item) => item.propertyId
      );
      if (scopedExpenses.length === 0) {
        recentVendorExpenses = {
          status: "empty",
          message: "No recent vendor expenses for your properties.",
          href: "/portal/owner/financials"
        };
      } else {
        recentVendorExpenses = {
          status: "ready",
          href: "/portal/owner/financials",
          items: scopedExpenses.slice(0, 5).map((item) => {
            const entry: OwnerDashboardListItem = {
              id: item.id,
              title: item.description || item.expenseNumber,
              href: "/portal/owner/financials"
            };
            entry.subtitle = `${formatCurrency(item.amount)}${item.propertyName ? ` · ${item.propertyName}` : ""}`;
            return entry;
          })
        };
      }
    }

    const statementsResult = await safeLoad(() =>
      getOwnerStatementsForOrganization(organizationId, { limit: 40 }, supabase)
    );
    if (!statementsResult.ok) {
      latestStatement = { status: "error", message: statementsResult.error };
      recentReports = { status: "error", message: statementsResult.error };
    } else {
      const scopedStatements = filterByOwnerPropertyScope(
        statementsResult.data,
        activeScope,
        (item) => item.propertyId
      );
      if (scopedStatements.length === 0) {
        latestStatement = {
          status: "empty",
          message: "No owner statements published for your properties yet.",
          href: "/portal/owner/financials#statements"
        };
        recentReports = {
          status: "empty",
          message: "No reports or statements for your properties yet.",
          href: "/portal/owner/reports"
        };
      } else {
        const latest = scopedStatements[0]!;
        latestStatement = {
          status: "ready",
          href: "/portal/owner/financials#statements",
          items: [
            {
              id: latest.id,
              title: `Statement ${latest.statementNumber}`,
              subtitle: `${latest.statementPeriodStart} → ${latest.statementPeriodEnd}${
                latest.propertyName ? ` · ${latest.propertyName}` : ""
              }`,
              href: "/portal/owner/financials#statements"
            }
          ]
        };
        recentReports = {
          status: "ready",
          href: "/portal/owner/reports",
          items: scopedStatements.slice(0, 5).map((statement) => {
            const entry: OwnerDashboardListItem = {
              id: statement.id,
              title: statement.statementNumber,
              href: "/portal/owner/reports"
            };
            entry.subtitle = `${statement.statementPeriodStart} → ${statement.statementPeriodEnd} · ${statement.status}`;
            return entry;
          })
        };
      }
    }
  }

  let recentMessages: OwnerDashboardListWidgetState;
  if (!canReadMessages) {
    recentMessages = {
      status: "unavailable",
      message: "Messaging access is not enabled for this account."
    };
  } else {
    const threadsResult = await safeLoad(() =>
      loadOwnerMessagingExperience({ organizationId, user, supabase })
    );
    if (!threadsResult.ok) {
      recentMessages = { status: "error", message: threadsResult.error };
    } else if (threadsResult.data.conversations.length === 0) {
      recentMessages = {
        status: "empty",
        message: "No messages yet for your properties.",
        href: "/portal/owner/messages"
      };
    } else {
      recentMessages = {
        status: "ready",
        href: "/portal/owner/messages",
        items: threadsResult.data.conversations.slice(0, 5).map((thread) => {
          const item: OwnerDashboardListItem = {
            id: thread.id,
            title: thread.subject,
            href: `/portal/owner/messages?thread=${encodeURIComponent(thread.id)}`
          };
          const subtitle = thread.lastMessagePreview || thread.propertyName || undefined;
          if (subtitle) item.subtitle = subtitle;
          return item;
        })
      };
    }
  }

  let recentDocuments: OwnerDashboardListWidgetState;
  if (!canReadDocuments) {
    recentDocuments = {
      status: "unavailable",
      message: "Document access is not enabled for this account."
    };
  } else if (activeScope.propertyIds.length === 0) {
    recentDocuments = {
      status: "empty",
      message: "Documents appear when properties are linked to your owner access.",
      href: "/portal/owner/documents"
    };
  } else {
    const docsResult = await safeLoad(() =>
      loadOwnerDocumentsExperience({ organizationId, user, supabase })
    );
    if (!docsResult.ok) {
      recentDocuments = { status: "error", message: docsResult.error };
    } else if (docsResult.data.documents.length === 0) {
      recentDocuments = {
        status: "empty",
        message: "No vault documents shared for your properties yet.",
        href: "/portal/owner/documents"
      };
    } else {
      recentDocuments = {
        status: "ready",
        href: "/portal/owner/documents",
        items: docsResult.data.documents.slice(0, 5).map((doc) => {
          const item: OwnerDashboardListItem = {
            id: doc.id,
            title: doc.title,
            href: doc.downloadHref || "/portal/owner/documents"
          };
          item.subtitle = `${doc.documentType} · ${doc.propertyName}`;
          return item;
        })
      };
    }
  }

  let notifications: OwnerDashboardListWidgetState;
  let unreadNotificationCount = 0;
  if (!canReadNotifications) {
    notifications = {
      status: "unavailable",
      message: "Notification access is not enabled for this account."
    };
  } else {
    const notificationsResult = await safeLoad(() =>
      getNotificationsForUser(organizationId, user.id, { limit: 20 }, supabase)
    );
    if (!notificationsResult.ok) {
      notifications = { status: "error", message: notificationsResult.error };
    } else {
      unreadNotificationCount = notificationsResult.data.unreadCount;
      const scopedNotifications = filterNotificationsForOwnerScope(
        notificationsResult.data.items,
        activeScope
      );
      if (scopedNotifications.length === 0) {
        notifications = {
          status: "empty",
          message: "You’re all caught up. New alerts will show here.",
          href: "/portal/owner/settings"
        };
      } else {
        notifications = {
          status: "ready",
          href: "/portal/owner/settings",
          items: scopedNotifications.slice(0, 5).map((item) => {
            const entry: OwnerDashboardListItem = {
              id: item.id,
              title: item.title
            };
            if (item.body) entry.subtitle = item.body;
            if (item.href) entry.href = item.href;
            return entry;
          })
        };
      }
    }
  }

  const attentionItems: OwnerDashboardListItem[] = [];
  if (outstanding.status === "ready") {
    attentionItems.push({
      id: "attention-outstanding",
      title: "Outstanding balance",
      subtitle: outstanding.value,
      href: "/portal/owner/financials"
    });
  }
  if (unreadNotificationCount > 0) {
    attentionItems.push({
      id: "attention-notifications",
      title: `${unreadNotificationCount} unread notification${unreadNotificationCount === 1 ? "" : "s"}`,
      href: "/portal/owner/settings"
    });
  }
  if (recentMessages.status === "ready" && recentMessages.items.some((item) => item.title)) {
    attentionItems.push({
      id: "attention-messages",
      title: "Recent messages need review",
      href: "/portal/owner/messages"
    });
  }
  try {
    const canOnboard = evaluatePermission(authorization, "payout:onboard");
    const connectAttention = await getOwnerConnectStatus({
      organizationId,
      ownerUserId: user.id,
      canOnboard,
      client: supabase
    });
    if (connectAttention.remediationRequired) {
      attentionItems.push({
        id: "attention-payouts",
        title: "Finish payout connection",
        subtitle: connectAttention.statusLabel + " — verification only, no money movement",
        href: "/portal/owner/financials"
      });
    } else if (connectAttention.status !== "eligible") {
      attentionItems.push({
        id: "attention-payouts",
        title: "Owner payout connection",
        subtitle: connectAttention.statusLabel + " — transfers not enabled yet",
        href: "/portal/owner/financials"
      });
    }
  } catch {
    attentionItems.push({
      id: "attention-payouts",
      title: "Owner payout connection",
      subtitle: "View Connect eligibility — transfers not enabled yet",
      href: "/portal/owner/financials"
    });
  }

  return {
    welcomeName,
    propertyCount,
    scopeMode: activeScope.scopeMode,
    ownerPropertyAccessTableMissing: activeScope.ownerPropertyAccessTableMissing,
    propertyCountWidget,
    occupancy,
    revenue,
    expenses,
    outstanding,
    latestStatement,
    recentVendorExpenses,
    pendingPayout,
    recentMessages,
    recentDocuments,
    recentReports,
    notifications,
    attentionItems
  };
}
