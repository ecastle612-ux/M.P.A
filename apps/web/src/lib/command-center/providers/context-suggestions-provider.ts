import { evaluateCapability } from "@mpa/shared";
import type { CommandCenterProvider, CommandCenterResult } from "../types";

type DashboardPayload = {
  snapshot?: {
    vacanciesTotal?: number;
    vacantReadyUnits?: number;
    maintenance?: {
      overdueWorkOrders?: number;
      highPriorityWorkOrders?: number;
      openWorkOrderSample?: Array<{ id: string; status?: string; href?: string }>;
      overdueSample?: Array<{ id: string; status?: string; href?: string }>;
      highPrioritySample?: Array<{ id: string; status?: string; href?: string }>;
    } | null;
    financial?: { lateRentCount?: number; outstandingBalancesTotal?: number } | null;
    applicants?: { awaitingSignatures?: number; recentlyApproved?: number } | null;
    leases?: { upcomingMoveIns?: number } | null;
  };
};

/**
 * Empty-query suggestions driven by Ops signals — "what should I do next?"
 */
export const contextSuggestionsProvider: CommandCenterProvider = {
  id: "context-suggestions",
  category: "pinned",
  sectionTitle: "Suggested next",
  priority: 5,
  enabled: (context) => !context.query.trim(),
  search: async (context) => {
    try {
      const response = await fetch("/api/dashboard", { signal: context.signal, cache: "no-store" });
      if (!response.ok) return [];
      const payload = (await response.json()) as DashboardPayload;
      const snapshot = payload.snapshot;
      if (!snapshot) return [];

      const suggestions: CommandCenterResult[] = [];

      const overdue = snapshot.maintenance?.overdueWorkOrders ?? 0;
      const highPriority = snapshot.maintenance?.highPriorityWorkOrders ?? 0;
      if ((overdue > 0 || highPriority > 0) && evaluateCapability(context.permissions, "maintenance:read")) {
        const sample =
          snapshot.maintenance?.overdueSample?.[0] ??
          snapshot.maintenance?.highPrioritySample?.[0] ??
          snapshot.maintenance?.openWorkOrderSample?.[0];
        const needsAssign = sample && (sample.status === "submitted" || sample.status === "triaged");
        suggestions.push({
          id: "suggest-resolve-maintenance",
          kind: "action",
          category: "pinned",
          label: "Resolve Maintenance",
          subtitle:
            overdue > 0
              ? `${overdue} overdue — jump to the next workflow step`
              : `${highPriority} high-priority open`,
          context: "Today's Work",
          badge: "Suggested",
          status: "Due",
          statusVariant: "danger",
          icon: "⚡",
          href: sample
            ? needsAssign
              ? `/maintenance/${sample.id}#vendor`
              : `/maintenance/${sample.id}`
            : "/maintenance?status=open",
          shortcut: null,
          score: 220,
          favoriteKey: "action:resolve-maintenance"
        });
      }

      const vacantReady = snapshot.vacantReadyUnits ?? 0;
      const vacancies = snapshot.vacanciesTotal ?? 0;
      if (
        (vacantReady > 0 || vacancies > 0) &&
        evaluateCapability(context.permissions, "tenant:create")
      ) {
        suggestions.push({
          id: "suggest-move-in-resident",
          kind: "action",
          category: "pinned",
          label: "Move In Resident",
          subtitle:
            vacantReady > 0
              ? `${vacantReady} move-in ready unit${vacantReady === 1 ? "" : "s"}`
              : `${vacancies} vacant unit${vacancies === 1 ? "" : "s"} need attention`,
          context: "Resident lifecycle",
          badge: "Suggested",
          status: "Primary",
          statusVariant: "info",
          icon: "⚡",
          href: "/residents/move-in",
          shortcut: "C T",
          score: 210,
          favoriteKey: "action:continue-move-in"
        });
      }

      const awaitingSignatures = snapshot.applicants?.awaitingSignatures ?? 0;
      if (awaitingSignatures > 0 && evaluateCapability(context.permissions, "lease:read")) {
        suggestions.push({
          id: "suggest-continue-signing",
          kind: "action",
          category: "pinned",
          label: "Continue Lease Signing",
          subtitle: `${awaitingSignatures} awaiting signature`,
          context: "Signatures",
          badge: "Suggested",
          status: "Pending",
          statusVariant: "warning",
          icon: "⚡",
          href: "/leases?status=draft",
          shortcut: null,
          score: 205,
          favoriteKey: "action:continue-signing"
        });
      }

      const lateRent = snapshot.financial?.lateRentCount ?? 0;
      const outstanding = snapshot.financial?.outstandingBalancesTotal ?? 0;
      if (
        (lateRent > 0 || outstanding > 0) &&
        evaluateCapability(context.permissions, "financial:create")
      ) {
        suggestions.push({
          id: "suggest-record-payment",
          kind: "action",
          category: "pinned",
          label: "Record Payment",
          subtitle: lateRent > 0 ? `${lateRent} late rent balance(s)` : "Outstanding balances need attention",
          context: "Financials",
          badge: "Suggested",
          status: "Due",
          statusVariant: "warning",
          icon: "⚡",
          href: "/financials/payments/new",
          shortcut: "C Y",
          score: 200,
          favoriteKey: "action:record-payment"
        });
      }

      const approvedReady = snapshot.applicants?.recentlyApproved ?? 0;
      if (approvedReady > 0 && evaluateCapability(context.permissions, "tenant:create")) {
        suggestions.push({
          id: "suggest-continue-applicant-move-in",
          kind: "action",
          category: "pinned",
          label: "Continue Applicant → Move In",
          subtitle: `${approvedReady} approved and ready`,
          context: "Applicant review",
          badge: "Suggested",
          status: "Ready",
          statusVariant: "info",
          icon: "⚡",
          href: "/applicants?status=approved",
          shortcut: null,
          score: 198,
          favoriteKey: "action:continue-move-in"
        });
      }

      return suggestions.slice(0, 4);
    } catch {
      return [];
    }
  }
};
