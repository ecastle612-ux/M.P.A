# 19 — FAC-002 Package Certification

**Package:** FAC-002 — Facility Operations V1.0  
**Status:** ✅ **COMPLETE** · ✅ **CERTIFIED PASS** (with recorded known limitation)  
**Date:** 2026-07-26  
**Criteria:** [15 — Acceptance Criteria](./15-acceptance-criteria.md)  
**Production deploy:** Slice D ship `83449be` + build fix `2e25470` · `dpl_EPYuTPiVFcpWQyftFdGje4pan152`  
**Role smoke evidence:** [evidence/fac002-role-smoke-latest.json](./evidence/fac002-role-smoke-latest.json)  
**Smoke runner:** `qa/e2e/tests/smoke/fac002-role-smoke.spec.ts` (`@fac002-smoke`)

---

## Recommendation

| Decision | Result |
|----------|--------|
| **FAC-002** | ✅ **COMPLETE** · ✅ **CERTIFIED PASS** |
| **V1.0 Facility** | ✅ Shipped A–D + Production + role smoke |
| **Next** | PMX-004 Phase 3 (already authorized/implemented locally) → `VALIDATE PMX-004 PHASE 3` when ready |

---

## 1. Slice completion

| Slice | Status | Ship SHA |
|-------|--------|----------|
| A — Hub + inventory | ✅ | `d1f4dfe` |
| B — PM + calendar | ✅ | `290fdab` |
| C — Assets + inspections | ✅ | `e5f26d6` |
| D — Materials / reports / vendor accept | ✅ | `83449be` (+ `2e25470` build fix) |

---

## 2. Role smoke matrix (Production)

**Environment:** https://www.my-property-assistant.com  
**Actor:** QA Property Manager (`QA_E2E_PM_*`) · org **MPA QA Certification**  
**Executed:** 2026-07-26 · Playwright `@fac002-smoke` · **9 PASS · 0 FAIL · 1 SKIP**

| ID | Path | Result |
|----|------|--------|
| R1 | Technician hub `/facility` | ✅ PASS |
| R2 | WO detail complete path `/maintenance/[id]` | ✅ PASS |
| R3 | Manager PM `/facility/pm` | ✅ PASS |
| R4 | Calendar `/facility/calendar` | ✅ PASS |
| R5 | Inventory add Photo → Name → Save `/facility/inventory/new` | ✅ PASS |
| R6 | Inspections list | ✅ PASS |
| R7 | Inspection start `/facility/inspections/new` | ✅ PASS |
| R8 | Reports `/facility/reports` | ✅ PASS |
| R9 | Facility surfaces free of tenant/lease/rent CTAs | ✅ PASS |
| R10 | Dedicated Facility-only org (Property module off) | ⏭ SKIP — see §4 |

---

## 3. Acceptance criteria roll-up

| # | Criterion | Result |
|---|-----------|--------|
| 1–6, 8–10, 12 | Design match · ship baseline · permissions · mobile/desktop · no FutureRelease · reuse FAC-001 · inventory 3-step · module nav gate | ✅ |
| 7 | E2E happy path (Playwright certified script) | ✅ |
| 5 / Slice D | Reporting wired | ✅ |
| 11 | Facility-only org (Property unlicensed) | ⚠ Design + R9 surface isolation; dedicated org not in QA credentials (§4) |

---

## 4. Known limitation

**R10 — Facility-only org end-to-end** is **SKIP** in this certification run: no Property-unlicensed facility-only organization is provisioned in `QA_E2E_*` credentials. Independence remains binding per [18 — Facility independence](./18-facility-independence.md); R9 confirms Facility surfaces do not surface tenant/lease/rent CTAs. Optional operator follow-up: provision a Facility-only org and re-run R1–R9 under that membership.

This does **not** reopen Slices A–D.

---

## 5. Non-goals preserved

- No parallel WO/inventory/asset systems  
- Vendors remain account-optional (token Accept/Decline on Slice D)  
- Collision boundary with AUTH / ShellProviders / OPS / COM WIP respected for this cert session  

---

## Sign-off

| Role | Decision | Date |
|------|----------|------|
| Certification (automated Production smoke + package review) | ✅ **PASS** | 2026-07-26 |
| Product Owner | Recorded via session direction: FAC role smoke → PMX-004 Phase 3 | 2026-07-26 |
