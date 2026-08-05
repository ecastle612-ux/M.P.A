# 04 — Remediation Roadmap

**Package:** MAC-001  
**Status:** Proposed sequence (Design → Approve → Authorize per slice)  
**Date:** 2026-08-05  
**Rule:** Do not implement from this audit until reviewed. Each slice still needs Approve/Authorize.

---

## Phase 0 — Decide

| Action | Outcome |
|--------|---------|
| Review MAC-001 audit + Hybrid C recommendation | Accept / amend architecture |
| Issue `APPROVE MAC-001` (or scoped ADRs) | Unlocks authorize slices |
| Land / rebase STD-001 remount PR #12 onto release lineage | Clears Class D composition debt |

---

## Phase 1 — Security & auth plane (P0)

**Suggested authorize:** `AUTHORIZE MAC-001 SLICE S – Master Admin Auth Plane`

| Work | Issues |
|------|--------|
| Unify middleware + capability check | MAC-C02 |
| Prevent org-manager grant of `master_admin` (or platform-only breakglass) | MAC-C01 |
| DB session TTL + fail-visible audit writes | MAC-H06, MAC-H07 |
| Test Mode data isolation (no all-org owner fallback) | MAC-C03 |
| Document Hybrid C in AUTH-001 amendment | MAC-H05 |

**Gate note:** Security-sensitive — Design note + Approve before code.

---

## Phase 2 — Hub honesty & STD-001 completion (P0/P1)

**Suggested authorize:** `AUTHORIZE MAC-001 SLICE H – Hub Honesty`

| Work | Issues |
|------|--------|
| Merge Class D UDF remounts if not already on branch | MAC-H03 |
| Workspace Launcher: hide/disable Test Mode unless API-backed | MAC-H02 |
| Fix Applicant → `/applicants`; rename/remove false Audit Explorer card | MAC-H01, MAC-M02 |
| Search placement under STD-001 discipline | MAC-H04 |
| Dedupe More Quick Actions vs UDF Quick Actions | MAC-M07 |

---

## Phase 3 — Navigation chrome (P1)

**Suggested authorize:** `AUTHORIZE MAC-001 SLICE N – Single Chrome`

| Work | Issues |
|------|--------|
| Collapse HQ subnav vs sidebar synonyms | MAC-M03 |
| Replace MA-only metaphor labels with honest tool names | MAC-M04 |
| Add Documents / Support / Reports entries on hub tool rail | MAC-M05, MAC-M06 |

---

## Phase 4 — Platform HQ depth (P2)

**Suggested authorize:** `AUTHORIZE MAC-001 SLICE A – Audit & Observability`

| Work | Issues |
|------|--------|
| Real Audit Explorer (read model + filters) | MAC-H01 |
| Health beyond table counts (ops signals) | MAC-M08 |
| Sandbox/demo org policy | MAC-M10 |

---

## Phase 5 — Role canvases (P3 · product-dependent)

Only when true surfaces exist: Regional, Executive, Technician homes, etc. Until then keep aliases **labeled** as closest surface (ARCH-001: don’t invent fake dashboards).

---

## Recertification

Re-run MAC-001 scorecard after Phases 1–3. Target: **≥ 85 / 100** with **0 Critical** before claiming production HQ certification.
