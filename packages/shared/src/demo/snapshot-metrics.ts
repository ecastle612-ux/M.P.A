import type { DemoAttentionItem, DemoFoSnapshot, DemoPmSnapshot } from "./snapshots/types";

export type DemoKpi = {
  id: string;
  label: string;
  value: string;
  hint?: string;
  tone?: "neutral" | "good" | "watch" | "critical";
};

export type DemoQueueItem = DemoAttentionItem & {
  badge: "immediate" | "waiting" | "info";
};

export type PmDemoShowcase = {
  organizationName: string;
  kpis: DemoKpi[];
  occupancyBars: Array<{ id: string; label: string; pct: number; units: number; openWorkOrders: number }>;
  financial: {
    monthlyRentRoll: number;
    outstandingBalance: number;
    pendingApprovals: number;
    pendingApprovalAmount: number;
  };
  maintenance: {
    open: number;
    urgent: number;
    inProgress: number;
  };
  queue: DemoQueueItem[];
  recentActivity: Array<{ id: string; title: string; meta: string; detail: string }>;
  assistantBrief: string;
};

export type FoDemoShowcase = {
  organizationName: string;
  kpis: DemoKpi[];
  assetHealth: Array<{ id: string; label: string; status: string; system: string }>;
  statusMix: Array<{ id: string; label: string; count: number; pct: number }>;
  compliance: Array<{ id: string; title: string; due: string }>;
  corrective: Array<{ id: string; title: string; priority: string; status: string; assignee: string }>;
  preventiveDue: Array<{ id: string; title: string; due: string }>;
  queue: DemoQueueItem[];
  assistantBrief: string;
};

export type CompleteDemoShowcase = {
  organizationName: string;
  executiveKpis: DemoKpi[];
  pm: PmDemoShowcase;
  fo: FoDemoShowcase;
};

function money(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(amount);
}

function mapQueue(items: DemoAttentionItem[]): DemoQueueItem[] {
  return items.map((item) => ({
    ...item,
    badge: item.severity
  }));
}

export function buildPmDemoShowcase(pm: DemoPmSnapshot): PmDemoShowcase {
  const totalUnits = pm.properties.reduce((sum, property) => sum + property.units, 0);
  const weightedOcc =
    totalUnits === 0
      ? 0
      : Math.round(
          pm.properties.reduce((sum, property) => sum + property.occupancyPct * property.units, 0) /
            totalUnits
        );
  const openWorkOrdersListed = pm.workOrders.length;
  const propertyReportedOpen = pm.properties.reduce(
    (sum, property) => sum + property.openWorkOrders,
    0
  );
  const delinquent = pm.residents.filter((resident) => resident.balance > 0);
  const outstandingBalance = delinquent.reduce((sum, resident) => sum + resident.balance, 0);
  const monthlyRentRoll = pm.leases.reduce((sum, lease) => sum + lease.rent, 0);
  const pendingInvoices = pm.invoices.filter((invoice) => invoice.status === "pending_approval");
  const pendingApprovalAmount = pendingInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const urgent = pm.workOrders.filter((wo) => wo.priority === "urgent").length;
  const inProgress = pm.workOrders.filter((wo) => wo.status === "in_progress").length;
  const immediate = pm.attention.filter((item) => item.severity === "immediate").length;
  const waiting = pm.attention.filter((item) => item.severity === "waiting").length;

  return {
    organizationName: pm.organizationName,
    kpis: [
      {
        id: "properties",
        label: "Properties",
        value: String(pm.properties.length),
        hint: `${totalUnits} units`,
        tone: "neutral"
      },
      {
        id: "occupancy",
        label: "Portfolio occupancy",
        value: `${weightedOcc}%`,
        hint: "Weighted by units",
        tone: weightedOcc >= 95 ? "good" : weightedOcc >= 90 ? "watch" : "critical"
      },
      {
        id: "open-wo",
        label: "Work orders",
        value: String(openWorkOrdersListed),
        hint: `${urgent} urgent · ${propertyReportedOpen} portfolio-reported`,
        tone: urgent > 0 ? "critical" : openWorkOrdersListed > 0 ? "watch" : "good"
      },
      {
        id: "delinquency",
        label: "Outstanding balances",
        value: money(outstandingBalance),
        hint: `${delinquent.length} residents`,
        tone: outstandingBalance > 0 ? "watch" : "good"
      },
      {
        id: "attention",
        label: "Needs attention",
        value: String(immediate + waiting),
        hint: `${immediate} immediate · ${waiting} waiting`,
        tone: immediate > 0 ? "critical" : waiting > 0 ? "watch" : "good"
      }
    ],
    occupancyBars: pm.properties.map((property) => ({
      id: property.id,
      label: property.name,
      pct: property.occupancyPct,
      units: property.units,
      openWorkOrders: property.openWorkOrders
    })),
    financial: {
      monthlyRentRoll,
      outstandingBalance,
      pendingApprovals: pendingInvoices.length,
      pendingApprovalAmount
    },
    maintenance: {
      open: pm.workOrders.filter((wo) => wo.status === "open").length,
      urgent,
      inProgress
    },
    queue: mapQueue(pm.attention),
    recentActivity: [
      ...pm.messages.map((msg) => ({
        id: `msg-${msg.id}`,
        title: msg.subject,
        meta: msg.at.slice(0, 10),
        detail: msg.from
      })),
      ...pm.workOrders.map((wo) => ({
        id: `wo-${wo.id}`,
        title: wo.title,
        meta: wo.status.replaceAll("_", " "),
        detail: `${wo.priority} · ${wo.assignee}`
      }))
    ].slice(0, 6),
    assistantBrief: pm.assistantBrief
  };
}

export function buildFoDemoShowcase(fo: DemoFoSnapshot): FoDemoShowcase {
  const locations = fo.sites.reduce((sum, site) => sum + site.locations, 0);
  const assetsReported = fo.sites.reduce((sum, site) => sum + site.assets, 0);
  const attentionAssets = fo.assets.filter((asset) => asset.status === "attention").length;
  const operationalAssets = fo.assets.filter((asset) => asset.status === "operational").length;
  const downAssets = fo.assets.filter((asset) => asset.status === "down").length;
  const listed = fo.assets.length || 1;
  const urgentCorrective = fo.correctiveWork.filter((wo) => wo.priority === "urgent").length;
  const immediate = fo.attention.filter((item) => item.severity === "immediate").length;

  return {
    organizationName: fo.organizationName,
    kpis: [
      {
        id: "sites",
        label: "Sites",
        value: String(fo.sites.length),
        hint: `${locations} locations`,
        tone: "neutral"
      },
      {
        id: "assets",
        label: "Assets tracked",
        value: String(assetsReported),
        hint: `${attentionAssets} need attention`,
        tone: attentionAssets > 0 ? "watch" : "good"
      },
      {
        id: "corrective",
        label: "Corrective open",
        value: String(fo.correctiveWork.length),
        hint: `${urgentCorrective} urgent`,
        tone: urgentCorrective > 0 ? "critical" : "watch"
      },
      {
        id: "compliance",
        label: "Compliance items",
        value: String(fo.complianceItems.length),
        hint: "Upcoming dues",
        tone: "watch"
      },
      {
        id: "attention",
        label: "Needs attention",
        value: String(fo.attention.length),
        hint: `${immediate} immediate`,
        tone: immediate > 0 ? "critical" : "watch"
      }
    ],
    assetHealth: fo.assets.map((asset) => ({
      id: asset.id,
      label: asset.name,
      status: asset.status,
      system: asset.system
    })),
    statusMix: [
      {
        id: "operational",
        label: "Operational",
        count: operationalAssets,
        pct: Math.round((operationalAssets / listed) * 100)
      },
      {
        id: "attention",
        label: "Attention",
        count: attentionAssets,
        pct: Math.round((attentionAssets / listed) * 100)
      },
      {
        id: "down",
        label: "Down",
        count: downAssets,
        pct: Math.round((downAssets / listed) * 100)
      }
    ],
    compliance: fo.complianceItems.map((item) => ({
      id: item.id,
      title: item.title,
      due: item.due
    })),
    corrective: fo.correctiveWork.map((wo) => ({
      id: wo.id,
      title: wo.title,
      priority: wo.priority,
      status: wo.status,
      assignee: wo.assignee
    })),
    preventiveDue: fo.preventiveTasks.map((task) => ({
      id: task.id,
      title: task.title,
      due: task.due
    })),
    queue: mapQueue(fo.attention),
    assistantBrief: fo.assistantBrief
  };
}

export function buildCompleteDemoShowcase(
  organizationName: string,
  pm: DemoPmSnapshot,
  fo: DemoFoSnapshot
): CompleteDemoShowcase {
  const pmShow = buildPmDemoShowcase(pm);
  const foShow = buildFoDemoShowcase(fo);
  return {
    organizationName,
    executiveKpis: [
      {
        id: "portfolios",
        label: "Operating homes",
        value: "2",
        hint: "Property Manager + Facility Operations",
        tone: "neutral"
      },
      pmShow.kpis.find((kpi) => kpi.id === "occupancy")!,
      foShow.kpis.find((kpi) => kpi.id === "assets")!,
      {
        id: "combined-attention",
        label: "Combined attention",
        value: String(pmShow.queue.length + foShow.queue.length),
        hint: "Across both product homes",
        tone: "critical"
      },
      {
        id: "rent-roll",
        label: "Monthly rent roll",
        value: money(pmShow.financial.monthlyRentRoll),
        hint: "From active demo leases",
        tone: "good"
      }
    ],
    pm: pmShow,
    fo: foShow
  };
}

/** Inventory low-stock count from FO snapshot (existing qty signal). */
export function foLowStockCount(fo: DemoFoSnapshot): number {
  return fo.inventory.filter((row) => row.qty < 10).length;
}
