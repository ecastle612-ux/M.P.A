import type { ComplimentaryGrant, ComplimentaryGrantEvent } from "@mpa/shared";

export type ComplimentaryGrantStore = {
  list(): ComplimentaryGrant[];
  get(id: string): ComplimentaryGrant | null;
  getByTokenHash(hash: string): ComplimentaryGrant | null;
  findOpenByEmail(email: string): ComplimentaryGrant | null;
  findByOrganizationId(organizationId: string): ComplimentaryGrant | null;
  findByEmail(email: string): ComplimentaryGrant[];
  save(grant: ComplimentaryGrant): ComplimentaryGrant;
  appendEvent(event: ComplimentaryGrantEvent): void;
  listEvents(grantId: string): ComplimentaryGrantEvent[];
};

export function createMemoryComplimentaryGrantStore(): ComplimentaryGrantStore {
  const grants = new Map<string, ComplimentaryGrant>();
  const events: ComplimentaryGrantEvent[] = [];
  return {
    list() {
      return [...grants.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    get(id) {
      return grants.get(id) ?? null;
    },
    getByTokenHash(hash) {
      return [...grants.values()].find((grant) => grant.claimTokenHash === hash) ?? null;
    },
    findOpenByEmail(email) {
      const needle = email.trim().toLowerCase();
      return (
        [...grants.values()].find(
          (grant) =>
            grant.recipientEmail === needle && (grant.status === "invited" || grant.status === "active")
        ) ?? null
      );
    },
    findByOrganizationId(organizationId) {
      return [...grants.values()].find((grant) => grant.organizationId === organizationId) ?? null;
    },
    findByEmail(email) {
      const needle = email.trim().toLowerCase();
      return [...grants.values()].filter((grant) => grant.recipientEmail === needle);
    },
    save(grant) {
      grants.set(grant.id, grant);
      return grant;
    },
    appendEvent(event) {
      events.push(event);
    },
    listEvents(grantId) {
      return events.filter((event) => event.grantId === grantId);
    }
  };
}

let activeStore: ComplimentaryGrantStore = createMemoryComplimentaryGrantStore();

export function resetComplimentaryGrantStore(): void {
  activeStore = createMemoryComplimentaryGrantStore();
}

export function getComplimentaryGrantStore(): ComplimentaryGrantStore {
  return activeStore;
}

export function setComplimentaryGrantStore(store: ComplimentaryGrantStore): void {
  activeStore = store;
}

export function useMemoryComplimentaryGrantStore(): ComplimentaryGrantStore {
  resetComplimentaryGrantStore();
  return activeStore;
}
