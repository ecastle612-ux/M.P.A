# Demo Architecture Verification

**Slice:** COM-002 B  
**Date:** 2026-08-07  

---

## Binding architecture (A3)

| Layer | Expected | Verified |
|-------|----------|----------|
| Immutable shared snapshot | Versioned per product | `getDemoSnapshot` + `DEMO_SNAPSHOT_VERSION` |
| Session write overlay | Mutations tagged by session | `DemoOverlayStore` in process Map |
| Isolation plane | Not production DB | `DEMO_ISOLATION.productionDbAccess=false` |
| Reset | Clear overlay | `resetDemoSessionRecord` |
| Forbidden | Full DB clone | Not implemented |

---

## Session model

| Field | Present |
|-------|---------|
| id, product, persona, snapshotVersion | Yes |
| createdAt, expiresAt, lastActiveAt | Yes |
| writeOverlayRef | Yes |
| TTL 2h / idle 30m | Yes |
| Reset cooldown 30s | Yes |
| Sweeper ~5 min | Yes (`DEMO_SWEEPER_INTERVAL_MS`) |

---

## Role switching

Instant `View as` select → `/api/demo/persona` → navigate to persona home. No logout / account creation.

---

## Restrictions

Export, email, SMS, payments, provisioning, production notifications, uploads — denied via `DEMO_RESTRICTIONS` / `assertDemoBoundary`.

---

## Conversion

| Product | Start Subscription |
|---------|-------------------|
| Property Manager | `/checkout?intent=mpa_property_manager…` |
| Facility / Complete | `/enterprise?intent=…` (FO_READY false) |
