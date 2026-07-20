# 13 — Slice C Delivery (Asset Foundation)

**Package:** FAC-001 · EP-005 Slice C  
**Status:** Implemented · Verified 2026-07-19  
**Authorization:** EP-005 Slice C — 2026-07-19

---

## 1. Architecture

```
FacilityAsset (permanent identity)
  ├── belongs to Property (required)
  ├── optional Building / Unit / Common Area (location_scope)
  ├── optional Facility Records (asset_id FK — history never duplicated)
  ├── Timeline events (asset_id + facility.asset_* types)
  └── Document Vault (entity_type = asset)
```

- Extensible `asset_type` text taxonomy (known constants + `custom` + future strings)
- Capabilities reuse `maintenance:read` / `maintenance:update`
- No PM / warranty engine / health / AI / compliance / depreciation

## 2. Asset lifecycle

1. **Register** — create asset with permanent `asset_code` (e.g. WH-203); timeline `facility.asset_installed`
2. **Operate** — optional link from completed Facility Record → Asset
3. **Accumulate** — repairs appear on Asset profile from the same Facility Records (no copy)
4. **Status** — `active` | `replaced` | `retired` (soft-delete via `deleted_at`)

## 3. Files created

| Path | Role |
| --- | --- |
| `supabase/migrations/20260719010000_fac001_asset_foundation_slice_c.sql` | `facility_assets` + FKs + vault `asset` |
| `apps/web/src/lib/facility/asset-contracts.ts` | Types, labels, parsers |
| `apps/web/src/lib/facility/asset-server.ts` | List/get/create/link/search |
| `apps/web/src/app/api/facility/assets/route.ts` | GET/POST assets |
| `apps/web/src/app/api/facility/assets/[assetId]/route.ts` | GET asset detail |
| `apps/web/src/components/facility/assets-panel.tsx` | Property/Unit Assets UI |
| `apps/web/src/components/facility/asset-link-panel.tsx` | Facility Record ↔ Asset link |
| `apps/web/src/app/(app)/facility/assets/[assetId]/page.tsx` | Read-only Asset profile |

## 4. Files modified

| Path | Change |
| --- | --- |
| `apps/web/src/lib/facility/contracts.ts` | Search kind `facility_asset`; timeline filter `assets`; `assetId` on records |
| `apps/web/src/lib/facility/server.ts` | Preserve/link `asset_id` on records |
| `apps/web/src/lib/facility/timeline.ts` | Asset-scoped timeline events |
| `apps/web/src/lib/facility/search.ts` | Assets in Facility Search |
| `apps/web/src/lib/command-center/providers/api-providers.ts` | Asset results + repair/timeline actions |
| `apps/web/src/lib/command-center/types.ts` | `facility-asset` kind |
| `apps/web/src/lib/vault/contracts.ts` / `browser-categories.ts` | Vault entity `asset` |
| `apps/web/src/app/(app)/properties/[propertyId]/page.tsx` | Assets section |
| `apps/web/src/app/(app)/units/[unitId]/page.tsx` | Unit-scoped Assets |
| `apps/web/src/app/(app)/facility/records/[recordId]/page.tsx` | AssetLinkPanel |
| `packages/supabase/src/types.ts` | `facility_assets` + `asset_id` columns |
| FAC-001 docs (`README.md`, `06-asset-foundation.md`) | Slice C approved / unlocked |

## 5. Asset search

Command Center / Facility Search returns Assets for:

- `HVAC` → HVAC-001  
- `Water Heater` / water heater codes  
- `WH-203` → direct Asset + View repair history + View timeline  
- `Roof` → ROOF-001  

## 6. Property integration

- Property → **Assets** table: code/name, status, last repair, repair count, install, Quick view  
- Unit → **Unit assets** only (property-wide assets stay on property)  
- Facility Record → optional link/unlink  
- Timeline filter **Assets** + registration / link events  

## 7. Browser verification

| Surface | Result |
| --- | --- |
| Property Assets (desktop 1280) | HVAC-001, ROOF-001, WH-101, WH-203 listed |
| Register WH-203 | Created; timeline “Asset registered · WH-203” |
| Asset profile `/facility/assets/[id]` | Overview, repairs, timeline, docs, photos, warranty + future-maintenance placeholders |
| Facility Record link → WH-101 | Linked; repair count accumulates under asset |
| Command Center `WH-203` / `HVAC` | Asset + history + timeline actions |
| Unit 101 | Shows WH-101 only |
| Tablet (768) / Mobile (narrow) | Assets panel + forms usable |

TypeScript: 0 errors · ESLint (touched asset files): clean

## 8. Migration impact

`20260719010000_fac001_asset_foundation_slice_c.sql`:

- New table `facility_assets` (RLS via `maintenance:read` / `maintenance:update`)
- `facility_records.asset_id` optional FK  
- `facility_timeline_events.asset_id` optional FK  
- Vault `entity_type` check adds `asset`  

Applied to linked project `vahnmcrpnuggxkivynvo` (local Docker unavailable during verification).

## 9. Design Partner score

**9.0 / 10**

Managers can think in permanent identities (WH-203), find assets from Command Center, see property/unit registries, and accumulate repairs under an asset without duplicating history.

## 10. Production score

**5.8 / 10**

Solid foundation (schema, RLS, search, read-only profile, vault hook). Still foundation-only: no PM, warranty engine, replacement planning, health, compliance, depreciation, rich media capture, or building hierarchy UI.
