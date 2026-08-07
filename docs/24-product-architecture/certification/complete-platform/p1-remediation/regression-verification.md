# Regression Verification — Complete Platform P1

**Date:** 2026-08-07  

---

## Automated gates

| Gate | Command | Result |
|------|---------|--------|
| Tests | `pnpm test` | Recorded at CI run in this remediation |
| Typecheck | `pnpm typecheck` | Recorded at CI run in this remediation |
| Lint | `pnpm lint` | Recorded at CI run in this remediation |
| Build | `pnpm build` | Recorded at CI run in this remediation |
| Boundaries | `pnpm check:boundaries` | Recorded at CI run in this remediation |

---

## Product regression

| Product | Check | Result |
|---------|-------|--------|
| Property Manager | Mission Control, Properties, Residents, Leasing, Maintenance, Financial Operations S0–S3 | **Pass** — no feature redesign |
| Facility Operations | E.1–E.6 desks + P1 relocate/context/docs | **Pass** — history merge, not recreation |
| Complete Platform | Launcher, dual MC, shared Docs/Comms/Search | **Pass** |
| Capital | Still planned / entitlement off | **Pass** |

---

## Integration regression

| Check | Result |
|-------|--------|
| Shared WO domain preserved | **Pass** |
| Document Vault singular | **Pass** |
| Notifications merge facility + PM/finance | **Pass** |
| Entitlement fail-closed across SKUs | **Pass** |
| Search Financial Operations labels unambiguous | **Pass** |
