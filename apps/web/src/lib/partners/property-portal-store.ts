import type { CanonicalPropertyRecord, PartnerPropertyPortal, PropertyCatalog, PartnerPropertyPortalStore } from "./property-portal-types";

const globalStore = globalThis as typeof globalThis & {
  __mpaPartnerPropertyPortalStore?: MemoryPartnerPropertyPortalStore;
  __mpaPartnerPropertyCatalog?: MemoryPropertyCatalog;
};

export class MemoryPartnerPropertyPortalStore implements PartnerPropertyPortalStore {
  portals = new Map<string, PartnerPropertyPortal>();

  async insertPortal(row: PartnerPropertyPortal): Promise<PartnerPropertyPortal> {
    this.portals.set(row.id, row);
    return row;
  }

  async updatePortal(row: PartnerPropertyPortal): Promise<PartnerPropertyPortal> {
    this.portals.set(row.id, row);
    return row;
  }

  async getPortal(id: string): Promise<PartnerPropertyPortal | null> {
    return this.portals.get(id) ?? null;
  }

  async getPortalByPartnerAndSlug(partnerId: string, slug: string): Promise<PartnerPropertyPortal | null> {
    const normalized = slug.trim().toLowerCase();
    return (
      [...this.portals.values()].find(
        (row) => row.partnerId === partnerId && row.publicSlug.toLowerCase() === normalized
      ) ?? null
    );
  }

  async getPortalByPartnerAndProperty(partnerId: string, propertyId: string): Promise<PartnerPropertyPortal | null> {
    return (
      [...this.portals.values()].find((row) => row.partnerId === partnerId && row.propertyId === propertyId) ?? null
    );
  }

  async listPortals(partnerId: string): Promise<PartnerPropertyPortal[]> {
    return [...this.portals.values()]
      .filter((row) => row.partnerId === partnerId)
      .sort((a, b) => a.publicSlug.localeCompare(b.publicSlug));
  }
}

export class MemoryPropertyCatalog implements PropertyCatalog {
  properties = new Map<string, CanonicalPropertyRecord>();

  seed(row: CanonicalPropertyRecord): CanonicalPropertyRecord {
    this.properties.set(row.id, row);
    return row;
  }

  async getProperty(id: string): Promise<CanonicalPropertyRecord | null> {
    return this.properties.get(id) ?? null;
  }

  async listProperties(organizationId: string): Promise<CanonicalPropertyRecord[]> {
    return [...this.properties.values()]
      .filter((row) => row.organizationId === organizationId)
      .sort((a, b) => a.name.localeCompare(b.name));
  }
}

export function getMemoryPartnerPropertyPortalStore(): MemoryPartnerPropertyPortalStore {
  if (!globalStore.__mpaPartnerPropertyPortalStore) {
    globalStore.__mpaPartnerPropertyPortalStore = new MemoryPartnerPropertyPortalStore();
  }
  return globalStore.__mpaPartnerPropertyPortalStore;
}

export function resetMemoryPartnerPropertyPortalStore(): MemoryPartnerPropertyPortalStore {
  globalStore.__mpaPartnerPropertyPortalStore = new MemoryPartnerPropertyPortalStore();
  return globalStore.__mpaPartnerPropertyPortalStore;
}

export function getMemoryPropertyCatalog(): MemoryPropertyCatalog {
  if (!globalStore.__mpaPartnerPropertyCatalog) {
    globalStore.__mpaPartnerPropertyCatalog = new MemoryPropertyCatalog();
  }
  return globalStore.__mpaPartnerPropertyCatalog;
}

export function resetMemoryPropertyCatalog(): MemoryPropertyCatalog {
  globalStore.__mpaPartnerPropertyCatalog = new MemoryPropertyCatalog();
  return globalStore.__mpaPartnerPropertyCatalog;
}
