import type { PartnerRequestEvent, PartnerRequestStore, PartnerServiceRequest } from "./request-types";

const globalStore = globalThis as typeof globalThis & {
  __mpaPartnerRequestStore?: MemoryPartnerRequestStore;
};

export class MemoryPartnerRequestStore implements PartnerRequestStore {
  requests = new Map<string, PartnerServiceRequest>();
  events: PartnerRequestEvent[] = [];
  private ref = 0;

  async nextPublicRef(): Promise<string> {
    this.ref += 1;
    return `PSR-2026-${String(this.ref).padStart(5, "0")}`;
  }

  async insertRequest(row: PartnerServiceRequest): Promise<PartnerServiceRequest> {
    this.requests.set(row.id, row);
    return row;
  }

  async updateRequest(row: PartnerServiceRequest): Promise<PartnerServiceRequest> {
    this.requests.set(row.id, row);
    return row;
  }

  async getRequest(id: string): Promise<PartnerServiceRequest | null> {
    return this.requests.get(id) ?? null;
  }

  async getRequestByStatusHash(hash: string): Promise<PartnerServiceRequest | null> {
    return [...this.requests.values()].find((row) => row.statusTokenHash === hash) ?? null;
  }

  async listRequests(partnerId: string): Promise<PartnerServiceRequest[]> {
    return [...this.requests.values()]
      .filter((row) => row.partnerId === partnerId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async listRequestSummaries(partnerId: string) {
    return (await this.listRequests(partnerId)).map((row) => ({
      partnerId: row.partnerId,
      propertyPortalId: row.propertyPortalId,
      status: row.status,
      createdAt: row.createdAt
    }));
  }

  async insertEvent(row: PartnerRequestEvent): Promise<void> {
    this.events.push(row);
  }

  async listEvents(requestId: string): Promise<PartnerRequestEvent[]> {
    return this.events
      .filter((row) => row.requestId === requestId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async countForPartner(partnerId: string): Promise<number> {
    return [...this.requests.values()].filter((row) => row.partnerId === partnerId).length;
  }
}

export function getMemoryPartnerRequestStore(): MemoryPartnerRequestStore {
  if (!globalStore.__mpaPartnerRequestStore) {
    globalStore.__mpaPartnerRequestStore = new MemoryPartnerRequestStore();
  }
  return globalStore.__mpaPartnerRequestStore;
}

export function resetMemoryPartnerRequestStore(): MemoryPartnerRequestStore {
  globalStore.__mpaPartnerRequestStore = new MemoryPartnerRequestStore();
  return globalStore.__mpaPartnerRequestStore;
}
