# Facility Operations — Regression Verification (P1)

**Date:** 2026-08-07  
**Purpose:** Confirm P1 remediation does not regress E.1–E.6 or Property Manager  

---

## Automated gates

| Gate | Command | Result |
|------|---------|--------|
| Tests | `pnpm test` | **Pass** — 115 tests (incl. relocate schema) |
| Typecheck | `pnpm typecheck` | **Pass** |
| Lint | `pnpm lint` | **Pass** |
| Build | `pnpm build` | **Pass** |
| Boundaries | `pnpm check:boundaries` | **Pass** — 525 modules, 0 violations |

---

## Facility Operations module smoke (code-path)

| Module | Path | Regression check | Status |
|--------|------|------------------|--------|
| Sites | `/facility/sites` | Unchanged | Pass |
| Assets | `/facility/assets/[id]` | Relocate additive; lifecycle preserved | Pass |
| Building Systems | `/facility/building-systems` | Unchanged | Pass |
| Corrective ops | `/facility/operations` | Shared WO unchanged | Pass |
| PM | `/facility/preventive-maintenance` | Unchanged | Pass |
| Inventory / Parts | `/facility/inventory`, parts | Unchanged | Pass |
| Inspections | `/facility/inspections` | Docs attach additive | Pass |
| Safety | `/facility/safety` | Unchanged | Pass |
| Compliance | `/facility/compliance` | Unchanged | Pass |
| Mission Control | `/facility/mission-control` | Unchanged | Pass |
| Capital | `/facility/capital` | Still planned stub — NO-GO | Pass (unchanged) |

---

## Property Manager regression

| Check | Result |
|-------|--------|
| PM Mission Control / nav unchanged | Pass |
| Maintenance Command Center PM filter still shows Resident · Property | Pass |
| Facility filter shows site/asset/system (additive) | Pass |
| Vendor portal PM assignments still show property/unit | Pass |
| Documents Vault existing entity types unchanged | Pass |
| No Capital / FO entitlement bleed into PM-only orgs | Pass (code) |

---

## Data integrity

| Check | Result |
|-------|--------|
| Relocate writes history before/with location change | Pass |
| Silent PATCH `locationId` rejected (forces history path) | Pass |
| Inspection docs use shared `document_documents` only | Pass |
| Shared WO fields not duplicated into FO-only tables | Pass |
