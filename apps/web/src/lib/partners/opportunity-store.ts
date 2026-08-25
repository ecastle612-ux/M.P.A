import type {
  PartnerOpportunityEvent,
  PartnerOpportunityRoute,
  PartnerOpportunityStore,
  PartnerServiceOpportunity,
  PartnerUnmetDemand
} from "./opportunity-types";

const globalStore = globalThis as typeof globalThis & {
  __mpaPartnerOpportunityStore?: MemoryPartnerOpportunityStore;
};

export class MemoryPartnerOpportunityStore implements PartnerOpportunityStore {
  opportunities = new Map<string, PartnerServiceOpportunity>();
  routes = new Map<string, PartnerOpportunityRoute>();
  events: PartnerOpportunityEvent[] = [];
  unmet: PartnerUnmetDemand[] = [];

  async insertOpportunity(row: PartnerServiceOpportunity): Promise<PartnerServiceOpportunity> {
    this.opportunities.set(row.id, row);
    return row;
  }

  async updateOpportunity(row: PartnerServiceOpportunity): Promise<PartnerServiceOpportunity> {
    this.opportunities.set(row.id, row);
    return row;
  }

  async getOpportunity(id: string): Promise<PartnerServiceOpportunity | null> {
    return this.opportunities.get(id) ?? null;
  }

  async listOpportunities(organizationId?: string): Promise<PartnerServiceOpportunity[]> {
    return [...this.opportunities.values()]
      .filter((row) => !organizationId || row.organizationId === organizationId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async listOpenForWorkOrder(organizationId: string, workOrderId: string): Promise<PartnerServiceOpportunity[]> {
    return [...this.opportunities.values()].filter(
      (row) =>
        row.organizationId === organizationId &&
        row.workOrderId === workOrderId &&
        (row.status === "open" || row.status === "routed" || row.status === "partner_interested")
    );
  }

  async insertRoute(row: PartnerOpportunityRoute): Promise<PartnerOpportunityRoute> {
    this.routes.set(row.id, row);
    return row;
  }

  async updateRoute(row: PartnerOpportunityRoute): Promise<PartnerOpportunityRoute> {
    this.routes.set(row.id, row);
    return row;
  }

  async getRoute(id: string): Promise<PartnerOpportunityRoute | null> {
    return this.routes.get(id) ?? null;
  }

  async listRoutes(opportunityId: string): Promise<PartnerOpportunityRoute[]> {
    return [...this.routes.values()]
      .filter((row) => row.opportunityId === opportunityId)
      .sort((a, b) => a.routedAt.localeCompare(b.routedAt));
  }

  async listRoutesForPartner(partnerId: string): Promise<PartnerOpportunityRoute[]> {
    return [...this.routes.values()]
      .filter((row) => row.partnerId === partnerId)
      .sort((a, b) => b.routedAt.localeCompare(a.routedAt));
  }

  async insertEvent(row: PartnerOpportunityEvent): Promise<void> {
    this.events.push(row);
  }

  async listEvents(opportunityId: string): Promise<PartnerOpportunityEvent[]> {
    return this.events
      .filter((row) => row.opportunityId === opportunityId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async insertUnmetDemand(row: PartnerUnmetDemand): Promise<void> {
    this.unmet.push(row);
  }

  async listUnmetDemand(): Promise<PartnerUnmetDemand[]> {
    return [...this.unmet].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}

export function getMemoryPartnerOpportunityStore(): MemoryPartnerOpportunityStore {
  if (!globalStore.__mpaPartnerOpportunityStore) {
    globalStore.__mpaPartnerOpportunityStore = new MemoryPartnerOpportunityStore();
  }
  return globalStore.__mpaPartnerOpportunityStore;
}

export function resetMemoryPartnerOpportunityStore(): MemoryPartnerOpportunityStore {
  globalStore.__mpaPartnerOpportunityStore = new MemoryPartnerOpportunityStore();
  return globalStore.__mpaPartnerOpportunityStore;
}
