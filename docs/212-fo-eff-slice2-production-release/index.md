# 212 — FO-EFF Slice 2 Production Release Certification  
## Facility Mission Control Needs Attention + notification deep links

**Title:** FO-EFF SLICE 2 PRODUCTION RELEASE CERTIFICATION  
**Status:** **SLICE 2 PRODUCTION RELEASE SUCCESSFUL**  
**Date:** 2026-08-18  
**Authority:** Owner authorization to release certified FO Efficiency / Simplicity Slice 2 only · [docs/211](../211-fo-eff-slice2-mission-control-attention-implementation/index.md) accepted · [docs/207](../207-fo-operational-efficiency/index.md) **Approved** · [docs/208](../208-mpa-app-wide-simplicity-navigation-audit/index.md) **Approved** · [ADR-036](../18-decision-log/adr-036-fo-operational-efficiency-system.md) **Accepted** · [ADR-037](../18-decision-log/adr-037-app-wide-simplicity-navigation.md) **Accepted**  
**Preserves:** docs/204 **APPROVED** · ADR-034 **Accepted** · docs/205–206 public request · docs/209–210 Slice 1 Production · docs/188–211 lineage  
**Certified implementation SHA:** `1d1a508c981334bbd2381196462a7a2df16d73cb`  
**Production application SHA:** `27657c6b1ba0f6af7e9d5f02732edcac0f589f9c`  
**Target:** `mpa-prod` / `vahnmcrpnuggxkivynvo` · Vercel `m-p-a-web`  
**Migration:** **NONE** (Slice 2 is application-only)  
**This package:** Deploy matching Slice 2 app on the live Production line · Production-safe smoke without manufacturing data. **No Slice 3. No Stripe Price change. No Connect. No tenant execution flip. No M5. No July reopen.**

---

## Verdict

**SLICE 2 PRODUCTION RELEASE SUCCESSFUL**

Facility Mission Control Needs Attention is live on Production. Application revision **`27657c6b`** (certified implement `1d1a508c` + docs/211 pin) serves `www.my-property-assistant.com` as **`dpl_GpcqvPZ9eQCWesuTCqrHGUibFjT5`**. No migration was applied. Slice 1 schema/routes remain intact. Public-request architecture remains intact. Tenant payment execution remains **0 TRUE**. July freeze remains **ON**. M5 remains unauthorized. SaaS prices remain **$59 / $59 / $109**.

**Do not begin Slice 3** without a separate Owner authorization.

**STOP.**

---

## 1. Deployed SHA

| Item | Value |
|------|--------|
| Production SHA | `27657c6b1ba0f6af7e9d5f02732edcac0f589f9c` |
| Certified implement source | `1d1a508c981334bbd2381196462a7a2df16d73cb` |
| Docs/211 pin | included in Production tip |
| Branch | `cursor/fo-eff-slice2-mission-control-attention-01f2` |
| Prior Production | `cb16e382` / `dpl_7Vev8nx74dQG2waj4Dai4gJaqnQz` (docs/210 Slice 1) |
| Lineage | docs/210 foundation ⊂ HEAD; Slice 1 migration tip unchanged |

---

## 2. Deployment ID

**`dpl_GpcqvPZ9eQCWesuTCqrHGUibFjT5`**

- Created: 2026-08-18T02:33:34Z  
- Ready: READY  
- Target: production  
- Inspector: `https://vercel.com/ecastle612-uxs-projects/m-p-a-web/GpcqvPZ9eQCWesuTCqrHGUibFjT5`  
- Deployment URL: `https://m-p-a-qlpwjnixz-ecastle612-uxs-projects.vercel.app`

---

## 3. Live revision identity

| Item | Value |
|------|--------|
| Live HTML `data-dpl-id` | `dpl_GpcqvPZ9eQCWesuTCqrHGUibFjT5` |
| Aliases | `www.my-property-assistant.com`, `my-property-assistant.com`, `m-p-a-web.vercel.app`, `m-p-a-web-ecastle612-uxs-projects.vercel.app` |
| Build routes observed | `/facility/mission-control`, `/facility/my-work`, `/facility/settings/work-templates`, `/api/facility/mission-control`, `/request/[token]` |

---

## 4. Migration result — expected NONE

| Check | Result |
|-------|--------|
| Slice 2 migration file | **Absent** (by design) |
| Production migration tip | Still `20260818021238` / `docs_207_fo_work_templates` (Slice 1) |
| Apply performed | **None** |
| Unexpected DDL need | **None — did not invent or apply** |

---

## 5. Mission Control result

| Check | Result |
|-------|--------|
| Unauthenticated `/facility/mission-control` | **307 → `/login`** |
| Unauthenticated `GET /api/facility/mission-control` | **401** `Unauthenticated` |
| Entitlement | `facility.mission_control` (middleware fail-closed) |
| Live route | Present in Production build |

---

## 6. Attention-category result

Deployed architecture supports manager categories:

- Overdue (`due_at` < now)  
- High priority / urgent (`high` \| `emergency`)  
- New public requests (early status + qr/public_link/authenticated)  
- Unassigned submitted work (early + unassigned, non-public path)  
- Due today (`due_at` in UTC today)

Only `maintenance_work_orders` with `work_surface = facility` populate categories (single org-scoped query). No manufactured WOs created for this release.

Existing safe Production record **`FR-2026-00001`** (`submitted`, `unassigned`, `intake_channel=qr`) classifies as **New public requests** under the certified rules.

---

## 7. Public-request integration

| Check | Result |
|-------|--------|
| docs/204 Approved / ADR-034 Accepted | Confirmed |
| Public API invalid token | **404** certified error shape |
| Status API invalid token | **404** certified error shape |
| Canonical WO | `FR-2026-00001` remains facility WO — no second inbox |
| Second request inbox | **None** |

---

## 8. Unassigned behavior

Certified path: attention row → `/facility/operations?workOrderId={id}&from=mission-control` → existing Ops assign UI. No smart routing. No Production assign performed for smoke.

---

## 9. Overdue / due-today behavior

Uses existing `due_at` only. Existing open facility sample set largely lacks `due_at`; categories remain available when data exists. No invented due dates. No Production due dates written.

---

## 10. Urgent behavior

Only `high` / `emergency` enter urgent category. Ordinary `normal` work (e.g. FR-2026-00001) does not.

---

## 11. Direct Operations deep links

Attention href builder: `facilityOperationsWorkOrderHref(id, { from: 'mission-control' })` →  
`/facility/operations?workOrderId=…&from=mission-control`

Operations workspace reads `workOrderId` on load and selects that record (no list hunt required).

---

## 12. Back to Mission Control behavior

When `from=mission-control`, Operations shows **Back to Mission Control** action returning to `/facility/mission-control`.

---

## 13. Technician notification destination

Facility assignment / critical tech progress → `/facility/my-work?workOrderId=…` (Slice 1 + retained). No Production notification sent for smoke.

---

## 14. Manager notification destination

`work_order.public_submitted` and facility manager progress/cancel → `/facility/operations?workOrderId=…`. No Production notification sent for smoke.

---

## 15. Manager / admin behavior

Server `viewerMode=manager` when roles include `FACILITY_MANAGER_ROLES`. Needs Attention sections returned. Unauthenticated MC protected.

---

## 16. Technician behavior

Server `viewerMode=technician` otherwise → `attention=[]` / `attentionTotal=0`. UI directs to My Work. My Work route remains live + protected (**307 → login**, API **401**).

---

## 17. PM isolation

`/pm/mission-control` remains separate; FO MC requires `facility.mission_control`. Unauthenticated PM MC also **307 → login**. PM-only SKU still lacks FO entitlement (ADR-033 / commercial entitlements unchanged).

---

## 18. Complete scoped behavior

FO-scope Complete retains FO MC entitlement path; PM-scope does not gain FO attention. Both-surface switching unchanged in this release.

---

## 19. Org / count isolation

MC query always `.eq("organization_id", …).eq("work_surface", "facility")`. Technician mode omits attention payload. Counts and rows share the same filtered row set (no separate leaking count query).

---

## 20. Mobile / empty-state result

Deployed UI: caught-up copy when `attentionTotal=0`; empty categories not rendered as zero cards; stacked rows with `min-h-11` actions. No Production operator cookie minted for live authenticated UI click-through (same limitation pattern as docs/210/187) — binding proof is unauth protection + deployed code + unit tests.

---

## 21. Performance / query confirmation

Deployed `getFacilityMissionControlSnapshot` retains **one** org-scoped facility WO select → in-memory categorization. No per-category DB round trips.

---

## 22. Slice 1 regression

| Surface | Production |
|---------|------------|
| `/facility/my-work` | Live + **307 → login** / API **401** |
| `/facility/settings/work-templates` | Live + protected |
| Template schema | `facility_work_templates` still present |
| Slice 1 migration tip | Unchanged `20260818021238` |
| Checklist / MEDIA-001 / tech nav | Unchanged application paths retained in deploy |

---

## 23. Production data created

**None** (no orgs, users, WOs, public requests, templates, notifications, or assets created for this release).

---

## 24. Finance / payment safety

| Control | State |
|---------|-------|
| `stripe_payment_execution_enabled = true` | **0** of 6 |
| SaaS pricing page | PM/FO **$59**, Complete **$109** |
| Checkout / Connect / AutoPay / FIN-OPS / complimentary | Not modified by this release |
| Money processed | **None** |

---

## 25. July / M5 state

| Control | State |
|---------|-------|
| `july_freeze_enabled` | **true** (ON) |
| `isFinanceM5Authorized()` | **false** |

---

## 26. P0 / P1 regressions

**None observed** in Production-safe smoke for FO MC protection, Slice 1 routes, public-request APIs, payment execution, or SaaS pricing.

---

## 27. Known limitations

1. No Production operator session minted; authenticated Needs Attention click-through not visually exercised in this environment.  
2. Existing open facility WOs mostly lack `due_at`, so Overdue/Due today may be empty until managers set due dates — architecture intact.  
3. Blocked-event attention category remains deferred (no WO column).  
4. Slice 3+ (Asset registry/QR, PM generation, Global Search, Quick Create, Recent, routing) **not** authorized and **not** started.

---

## 28. Final verdict

**SLICE 2 PRODUCTION RELEASE SUCCESSFUL**

**STOP.** Do not begin Slice 3.
