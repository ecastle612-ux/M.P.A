# 14 — Phase 2 Implementation Plan

**Package:** OWNER-001  
**Phase:** 2 — Dashboard Data  
**Status:** ✅ **COMPLETE** — authorized and implemented  
**Depends on:** Phase 1 ✅ COMPLETE ([13](./13-phase-1-completion.md))  
**Verification:** [15 — Phase 2 Verification](./15-phase-2-verification.md)  
**Date:** 2026-07-22

---

## Objectives

Make the Owner Home dashboard commercially clear and complete for Phase 2 scope:

1. Owners immediately see **performance, recent activity, and attention** with accurate, honest labels.  
2. Home surfaces the modules specified in OWNER-001 for dashboard (within Phase 2 bounds): portfolio summary, occupancy, rent/collections signals, outstanding balance, recent vendor expenses, latest statement shortcut, recent messages/documents, notifications, and **non-executing** pending-payout placeholder.  
3. Continue **reuse-only** architecture — extend `loadOwnerPortalDashboard` and `OwnerPortalDashboard`; do not invent services.  
4. Preserve Phase 1 quality bar (typed widgets, empty/loading/error, mobile stacking, RBAC).

---

## Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| OWNER-001 Approved | Done | Gate open for implement phases |
| Phase 1 foundation | Done | Shell, nav, RBAC, widget chassis |
| Existing financial metrics / statements | Available | Phase 10 + FIN-001 outputs |
| Existing vault / messaging / notifications | Available | Already wired in Phase 1 |
| Owner–property scoping model (Q1) | Open | Prefer org-wide owner visibility unless Approve decides otherwise |
| FIN-003 | **Not required** | Placeholders only; no Connect |
| `message:create` for owners | Optional for Phase 2 | Reply is Phase 6; Home only needs read previews |

---

## Required existing services

| Service | Phase 2 use |
|---------|-------------|
| `getPropertiesForOrganization` | Portfolio summary, property chips/list on Home |
| `getFinancialDashboardMetrics` | Collections, outstanding, recent expenses (clarify labels) |
| `getOwnerStatementsForOrganization` (and/or vaulted statement docs) | Latest statement shortcut |
| `getExpensesForOrganization` / recent expenses from metrics | Recent vendor expenses module |
| `getThreadsForOrganization` | Recent messages (already present — enrich) |
| `listOrganizationVaultDocuments` | Recent documents (already present — enrich) |
| `getNotificationsForUser` | Notifications / attention (already present — enrich) |
| `ReportingService` / statement status counts | Report/statement signals without new engine |
| RBAC (`financial:read`, `property:read`, etc.) | Gate every module |

**Forbidden:** new ReportingService fork, new messaging/notification/document stacks, Stripe Connect, ACH, payout ledgers.

---

## Components to extend

| Component / module | Change type |
|--------------------|-------------|
| `lib/owner-portal/dashboard.ts` | Extend model: attention items, latest statement, vendor expenses, pending payout placeholder state, clearer metric semantics |
| `components/portal/owner-portal-dashboard.tsx` | Compose new modules; fix Revenue → Recent collections labeling; attention strip |
| `components/portal/owner-section-placeholder.tsx` | Reuse for any shared empty/foundation notes (no new system) |
| Possibly small presentational helpers colocated with dashboard | Only if needed for DRY — prefer extending existing widgets |

**Do not** create parallel dashboard frameworks or redesign `PortalShell` unless a blocking defect appears.

---

## Files expected to change

| Path | Expected touch |
|------|----------------|
| `apps/web/src/lib/owner-portal/dashboard.ts` | Primary data model expansion |
| `apps/web/src/components/portal/owner-portal-dashboard.tsx` | Primary UI composition |
| `apps/web/src/app/(portals)/portal/owner/page.tsx` | Only if props/wiring must change |
| `docs/104-owner-001-commercial-owner-portal/12-phase-1-verification.md` or new `15-phase-2-verification.md` | After implement — cert evidence |
| `docs/104-owner-001-commercial-owner-portal/README.md` | Progress table Phase 2 → COMPLETE when done |

Unlikely for Phase 2 (defer unless required): schema/migrations, new API routes, nav constant changes, mobile bottom nav structure.

---

## Estimated implementation order

1. **Label honesty** — rename/clarify Revenue → Recent collections; document metric definitions in code comments.  
2. **Portfolio summary strip** — property count, occupancy (existing), outstanding balance prominence.  
3. **Latest statement shortcut** — from `getOwnerStatementsForOrganization` or vault; empty state if none.  
4. **Recent vendor expenses module** — from existing expense/payment metrics (not a new expense system).  
5. **Pending payout placeholder** — non-operational module with Future Release / FIN-003 copy (no Stripe).  
6. **Attention composition** — unread messages/notifications + outstanding + pending-payout placeholder.  
7. **Empty/error/loading polish** — ensure new modules match Phase 1 patterns.  
8. **Verification** — typecheck, scoped lint, desktop/tablet/phone smoke, update progress docs.

---

## Potential risks

| Risk | Mitigation |
|------|------------|
| Over-scoping into Property/Financial detail (Phases 3–4) | Strict Home-only acceptance criteria |
| Misleading financial totals | Label as recent/collections/outstanding from existing metrics; no invented NOI |
| Org-wide document leakage on Home | Limit to recent titles; deep scoping in Phase 5 |
| Payout placeholder looks “live” | Explicit unavailable copy; no fake paid amounts |
| Scope creep into announcements / reply grants | Announcements + reply → Phase 6 |

---

## Acceptance criteria (Phase 2)

| ID | Criterion | PASS when |
|----|-----------|-----------|
| P2-01 | Home answers performance / recent / attention with clearer modules | Reviewer can answer without PM call |
| P2-02 | Latest statement shortcut present (or honest empty) | Link/open path when statement exists |
| P2-03 | Recent vendor expenses visible when upstream data exists | No owner data entry |
| P2-04 | Pending payout placeholder non-operational | No Stripe/ACH; clear copy |
| P2-05 | Metric labels honest | No false “full period owner income” claims |
| P2-06 | RBAC unchanged / respected | Missing caps → unavailable states |
| P2-07 | Mobile Home stacks cleanly; bottom nav unchanged | Phone viewport usable |
| P2-08 | Typecheck + Owner scoped lint PASS | Exit 0 |
| P2-09 | No new architecture / services | Reuse map intact |

---

## Out of scope (Phase 2)

| Item | Where it belongs |
|------|------------------|
| Property detail pages | Phase 3 |
| Full financials page (statements detail, receipts, history, net income layout) | Phase 4 |
| Document category library | Phase 5 |
| Message reply grants / announcements inbox | Phase 6 |
| Report PDF download experience | Phase 7 |
| Settings preference forms | Phase 8 |
| Stripe Connect / ACH / FIN-003 execution | Future Release / Blocker 4 |
| Schema redesign / `owner_property_access` migration | Only if Approve unlocks; prefer defer |
| New APIs solely for Owner Portal | Avoid — use existing libs |
| Investment analytics / AI forecasting | Future Release |

---

## Authorization record

Phase 2 authorized 2026-07-22 (`Phase 2 is now AUTHORIZED`) and implemented against this plan.
