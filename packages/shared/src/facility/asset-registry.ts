import type { FacilityAssetStatus, FacilityAssetType } from "./schemas";
import type { FacilityRequestLockedContext } from "./request-forms";

export const GENERATED_ASSET_CODE_PREFIX = "AST-";

export type FacilityAssetSearchable = {
  name: string;
  asset_code: string;
  serial_number?: string | null;
  asset_type?: FacilityAssetType | string | null;
  status?: FacilityAssetStatus | string | null;
  building_label?: string | null;
  floor_label?: string | null;
  department_label?: string | null;
  room_label?: string | null;
  location_note?: string | null;
  property_properties?: { name?: string | null } | null;
};

export function formatGeneratedAssetCode(sequence: number): string {
  const safe = Number.isFinite(sequence) ? Math.max(1, Math.floor(sequence)) : 1;
  return `${GENERATED_ASSET_CODE_PREFIX}${String(safe).padStart(6, "0")}`;
}

export function parseGeneratedAssetSequence(assetCode: string): number | null {
  const match = /^AST-(\d{1,6})$/.exec(assetCode.trim());
  if (!match) return null;
  return Number(match[1]);
}

export function nextGeneratedAssetCode(existingCodes: readonly string[]): string {
  let max = 0;
  for (const code of existingCodes) {
    const sequence = parseGeneratedAssetSequence(code);
    if (sequence != null && sequence > max) {
      max = sequence;
    }
  }
  return formatGeneratedAssetCode(max + 1);
}

export function formatFacilityAssetLocation(input: {
  siteName?: string | null;
  buildingLabel?: string | null;
  floorLabel?: string | null;
  departmentLabel?: string | null;
  roomLabel?: string | null;
}): string {
  const parts = [
    input.siteName?.trim() || input.buildingLabel?.trim() || "",
    input.buildingLabel && input.siteName && input.buildingLabel.trim() !== input.siteName.trim()
      ? input.buildingLabel.trim()
      : "",
    input.floorLabel?.trim() ? (input.floorLabel.trim().startsWith("Floor") ? input.floorLabel.trim() : `Floor ${input.floorLabel.trim()}`) : "",
    input.departmentLabel?.trim() || "",
    input.roomLabel?.trim()
      ? input.roomLabel.trim().toLowerCase().startsWith("room")
        ? input.roomLabel.trim()
        : `Room ${input.roomLabel.trim()}`
      : ""
  ].filter(Boolean);
  const unique: string[] = [];
  for (const part of parts) {
    if (!unique.includes(part)) unique.push(part);
  }
  return unique.join(" · ");
}

export function formatFacilityAssetIdentity(name: string, assetCode?: string | null): string {
  const code = assetCode?.trim();
  return code ? `${name.trim()} · ${code}` : name.trim();
}

export function facilityAssetMatchesQuery(asset: FacilityAssetSearchable, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  const haystack = [
    asset.name,
    asset.asset_code,
    asset.serial_number,
    asset.asset_type,
    asset.status,
    asset.building_label,
    asset.floor_label,
    asset.department_label,
    asset.room_label,
    asset.location_note,
    asset.property_properties?.name
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(needle);
}

export function filterFacilityAssets<T extends FacilityAssetSearchable>(
  assets: readonly T[],
  input?: { query?: string; status?: string; assetType?: string; siteId?: string; siteName?: string }
): T[] {
  return assets.filter((asset) => {
    if (input?.status && asset.status !== input.status) return false;
    if (input?.assetType && asset.asset_type !== input.assetType) return false;
    if (input?.siteName && asset.property_properties?.name !== input.siteName) return false;
    if (input?.query && !facilityAssetMatchesQuery(asset, input.query)) return false;
    return true;
  });
}

export function isRetiredFacilityAssetStatus(status: FacilityAssetStatus | string | null | undefined): boolean {
  return status === "retired" || status === "replaced";
}

export function lockedContextFromFacilityAsset(asset: {
  id: string;
  name: string;
  property_property_id?: string | null;
  property_properties?: { id?: string; name?: string | null } | null;
  building_label?: string | null;
  floor_label?: string | null;
  department_label?: string | null;
  room_label?: string | null;
}): FacilityRequestLockedContext {
  const propertyId = asset.property_property_id ?? asset.property_properties?.id ?? undefined;
  const propertyLabel =
    asset.property_properties?.name?.trim() || asset.building_label?.trim() || undefined;
  return {
    ...(propertyId ? { propertyId } : {}),
    ...(propertyLabel ? { propertyLabel } : {}),
    facilityAssetId: asset.id,
    facilityAssetLabel: asset.name,
    ...(asset.floor_label?.trim() ? { floorLabel: asset.floor_label.trim() } : {}),
    ...(asset.department_label?.trim() ? { departmentLabel: asset.department_label.trim() } : {}),
    ...(asset.room_label?.trim() ? { roomLabel: asset.room_label.trim() } : {})
  };
}

export function publicAssetQrUrlContainsSecrets(url: string): boolean {
  return /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(url)
    || /organization_id|facility_asset|building_id|property_id/i.test(url);
}

/** Public portal may show labels only — never org/asset/building UUIDs. */
export function publicPortalLockedContext(locked: FacilityRequestLockedContext): {
  propertyLabel?: string;
  facilityAssetLabel?: string;
  floorLabel?: string;
  departmentLabel?: string;
  roomLabel?: string;
} {
  return {
    ...(locked.propertyLabel ? { propertyLabel: locked.propertyLabel } : {}),
    ...(locked.facilityAssetLabel ? { facilityAssetLabel: locked.facilityAssetLabel } : {}),
    ...(locked.floorLabel ? { floorLabel: locked.floorLabel } : {}),
    ...(locked.departmentLabel ? { departmentLabel: locked.departmentLabel } : {}),
    ...(locked.roomLabel ? { roomLabel: locked.roomLabel } : {})
  };
}
