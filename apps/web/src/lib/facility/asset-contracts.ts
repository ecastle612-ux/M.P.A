export const FACILITY_ASSET_TYPES = [
  "hvac",
  "water_heater",
  "roof",
  "boiler",
  "appliance",
  "smoke_detector",
  "fire_equipment",
  "lighting",
  "door",
  "window",
  "parking",
  "pool",
  "elevator",
  "custom"
] as const;

export type FacilityAssetType = (typeof FACILITY_ASSET_TYPES)[number] | (string & {});

export const FACILITY_ASSET_STATUSES = ["active", "replaced", "retired"] as const;
export type FacilityAssetStatus = (typeof FACILITY_ASSET_STATUSES)[number];

export const FACILITY_ASSET_LOCATION_SCOPES = ["property", "building", "unit", "common_area"] as const;
export type FacilityAssetLocationScope = (typeof FACILITY_ASSET_LOCATION_SCOPES)[number];

export type FacilityAsset = {
  id: string;
  organizationId: string;
  propertyId: string;
  buildingId: string | null;
  unitId: string | null;
  locationScope: FacilityAssetLocationScope;
  assetCode: string;
  name: string;
  assetType: string;
  customTypeLabel: string | null;
  installDate: string | null;
  manufacturer: string | null;
  model: string | null;
  serialNumber: string | null;
  expectedLifeYears: number | null;
  warrantyPlaceholder: string | null;
  status: FacilityAssetStatus;
  locationNote: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  createdBy: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type FacilityAssetListItem = FacilityAsset & {
  propertyName: string | null;
  unitNumber: string | null;
  repairCount: number;
  lastRepairAt: string | null;
  lastRepairIssue: string | null;
  lastRepairId: string | null;
};

export type CreateFacilityAssetInput = {
  propertyId: string;
  buildingId?: string | null | undefined;
  unitId?: string | null | undefined;
  locationScope: FacilityAssetLocationScope;
  assetCode?: string | undefined;
  name: string;
  assetType: string;
  customTypeLabel?: string | null | undefined;
  installDate?: string | null | undefined;
  manufacturer?: string | null | undefined;
  model?: string | null | undefined;
  serialNumber?: string | null | undefined;
  expectedLifeYears?: number | null | undefined;
  warrantyPlaceholder?: string | null | undefined;
  status?: FacilityAssetStatus | undefined;
  locationNote?: string | null | undefined;
  notes?: string | null | undefined;
};

export type ListFacilityAssetsOptions = {
  propertyId?: string | undefined;
  unitId?: string | undefined;
  search?: string | undefined;
  status?: FacilityAssetStatus | undefined;
  limit?: number | undefined;
};

export const ASSET_TYPE_LABELS: Record<string, string> = {
  hvac: "HVAC",
  water_heater: "Water Heater",
  roof: "Roof",
  boiler: "Boiler",
  appliance: "Appliance",
  smoke_detector: "Smoke Detector",
  fire_equipment: "Fire Equipment",
  lighting: "Lighting",
  door: "Door",
  window: "Window",
  parking: "Parking",
  pool: "Pool",
  elevator: "Elevator",
  custom: "Custom"
};

export const ASSET_TYPE_CODE_PREFIX: Record<string, string> = {
  hvac: "HVAC",
  water_heater: "WH",
  roof: "RF",
  boiler: "BLR",
  appliance: "APL",
  smoke_detector: "SD",
  fire_equipment: "FE",
  lighting: "LT",
  door: "DR",
  window: "WN",
  parking: "PK",
  pool: "PL",
  elevator: "EL",
  custom: "AST"
};

export function isFacilityAssetStatus(value: unknown): value is FacilityAssetStatus {
  return typeof value === "string" && (FACILITY_ASSET_STATUSES as readonly string[]).includes(value);
}

export function isFacilityAssetLocationScope(value: unknown): value is FacilityAssetLocationScope {
  return typeof value === "string" && (FACILITY_ASSET_LOCATION_SCOPES as readonly string[]).includes(value);
}

export function formatAssetTypeLabel(assetType: string, customTypeLabel?: string | null): string {
  if (assetType === "custom" && customTypeLabel?.trim()) return customTypeLabel.trim();
  return ASSET_TYPE_LABELS[assetType] ?? assetType.replaceAll("_", " ");
}

export function formatAssetStatusLabel(status: string): string {
  return status.replaceAll("_", " ");
}

export function formatLocationScopeLabel(scope: string): string {
  if (scope === "common_area") return "Common area";
  return scope.charAt(0).toUpperCase() + scope.slice(1);
}

function readString(value: unknown, min: number, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length < min || trimmed.length > max) return null;
  return trimmed;
}

function readOptionalString(value: unknown, max: number): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  if (trimmed.length > max) return null;
  return trimmed;
}

function readOptionalDate(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  if (typeof value !== "string") return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  return value;
}

function readOptionalNumber(value: unknown): number | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num) || num < 0 || num > 200) return null;
  return num;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function parseCreateFacilityAssetInput(payload: unknown): CreateFacilityAssetInput | null {
  if (!payload || typeof payload !== "object") return null;
  const value = payload as Record<string, unknown>;
  const propertyId = typeof value["propertyId"] === "string" && isUuid(value["propertyId"]) ? value["propertyId"] : null;
  const name = readString(value["name"], 1, 160);
  const assetTypeRaw = readString(value["assetType"], 1, 80);
  const locationScope = value["locationScope"];
  if (!propertyId || !name || !assetTypeRaw || !isFacilityAssetLocationScope(locationScope)) return null;

  const unitIdRaw = value["unitId"];
  const unitId =
    unitIdRaw === undefined || unitIdRaw === null || unitIdRaw === ""
      ? null
      : typeof unitIdRaw === "string" && isUuid(unitIdRaw)
        ? unitIdRaw
        : null;
  if (unitIdRaw !== undefined && unitIdRaw !== null && unitIdRaw !== "" && !unitId) return null;

  if (locationScope === "unit" && !unitId) return null;
  if (locationScope !== "unit" && unitId) return null;

  const buildingIdRaw = value["buildingId"];
  const buildingId =
    buildingIdRaw === undefined || buildingIdRaw === null || buildingIdRaw === ""
      ? null
      : typeof buildingIdRaw === "string" && isUuid(buildingIdRaw)
        ? buildingIdRaw
        : null;

  const statusRaw = value["status"];
  const status = statusRaw === undefined ? "active" : isFacilityAssetStatus(statusRaw) ? statusRaw : null;
  if (!status) return null;

  const assetType = assetTypeRaw.toLowerCase().replaceAll(" ", "_");
  const customTypeLabel = readOptionalString(value["customTypeLabel"], 120) ?? null;
  if (assetType === "custom" && !customTypeLabel) return null;

  return {
    propertyId,
    buildingId,
    unitId,
    locationScope,
    assetCode: readOptionalString(value["assetCode"], 40) ?? undefined,
    name,
    assetType,
    customTypeLabel,
    installDate: readOptionalDate(value["installDate"]) ?? null,
    manufacturer: readOptionalString(value["manufacturer"], 120) ?? null,
    model: readOptionalString(value["model"], 120) ?? null,
    serialNumber: readOptionalString(value["serialNumber"], 120) ?? null,
    expectedLifeYears: readOptionalNumber(value["expectedLifeYears"]) ?? null,
    warrantyPlaceholder: readOptionalString(value["warrantyPlaceholder"], 500) ?? null,
    status,
    locationNote: readOptionalString(value["locationNote"], 240) ?? null,
    notes: readOptionalString(value["notes"], 4000) ?? null
  };
}

export function parseLinkFacilityRecordAssetInput(payload: unknown): { assetId: string | null } | null {
  if (!payload || typeof payload !== "object") return null;
  const value = payload as Record<string, unknown>;
  if (value["action"] !== "link_asset") return null;
  const assetIdRaw = value["assetId"];
  if (assetIdRaw === null) return { assetId: null };
  if (typeof assetIdRaw === "string" && isUuid(assetIdRaw)) return { assetId: assetIdRaw };
  return null;
}
