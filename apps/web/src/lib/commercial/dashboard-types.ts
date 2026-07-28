/** COM-001 Slice E — staff commercial dashboard aggregates ([22]). */

export type CommercialDashboardSnapshot = {
  generatedAt: string;
  /** Organizations by commercial_status */
  organizations: {
    total: number;
    trial: number;
    pendingSetup: number;
    active: number;
    cancelled: number;
    archived: number;
    unknown: number;
  };
  /** Orgs with commercial_status=active created in the last 30 days */
  newCustomersLast30Days: number;
  trials: {
    commercialTrialStatus: number;
    saasTrialing: number;
    endingSoon7Days: number;
  };
  implementation: {
    queueBelow100: number;
    aiGuidedPath: number;
    professionalPath: number;
    stalledBelow50: number;
  };
  health: {
    healthy: number;
    needsAttention: number;
    atRisk: number;
    critical: number;
    unscored: number;
  };
  billing: {
    activeSubscriptions: number;
    pastDueSubscriptions: number;
    openInvoiceCount: number;
    openInvoiceAmountDue: number;
    /** Estimated list MRR from active/trialing plan catalog (display list prices). */
    estimatedListMrr: number;
  };
  renewals: {
    pending: number;
    dueOrEmitted: number;
    t90: number;
    t30: number;
    t7: number;
  };
  pipeline: Record<string, number>;
  offboarding: {
    inFlight: number;
    exportWindow: number;
    frozen: number;
    archiveScheduled: number;
  };
  discovery: {
    openImpressions: number;
    accepted: number;
  };
  marketplace: {
    engagementsTotal: number;
    engagementsOpen: number;
    partnersStub: number;
  };
  support: {
    available: boolean;
    openTickets: number | null;
  };
};
