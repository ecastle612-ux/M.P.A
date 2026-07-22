# 10 — Friction Register (Phase 2)

**Package:** DPX-002  
**Captured:** 2026-07-21  
**Updated:** 2026-07-21 (P2 closed)  
**Rule:** Hesitation / hard stop = defect. Prioritize by severity × frequency.

---

## Friction Timer log (Amendment C)

| ID | Screen | Reason | Time lost (s) | Better alternative | Step | Sev | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| DPX2-T001 | `/properties/[id]` | Page dead — “Properties unavailable” / buildAiPageContext server call | 30–120+ (retry loops) | Import `buildAiPageContext` from store (server-safe); keep Bridge client-only | S3 | S0 | **Fixed** |
| DPX2-T002 | `/maintenance/[id]` | Same client/server crash (+ smart suggestion builders) | 30–120+ | Same AI fix + pure suggestion builders module | S8 | S0 | **Fixed** |
| DPX2-T003 | `/tenants/[id]` | “Unable to load tenant context” | 20–60 | Soft-fail related queries; server-safe AI import | S4 | S0 | **Fixed** |
| DPX2-T004 | `/maintenance` default | Empty list while dashboard shows WOs | 10–30 | Default “open” includes completed-not-archived (waiting resident) | S7–S8 | S1 | **Fixed** |
| DPX2-T005 | Resident Message | Unsure if Message goes to this resident | 15–45 | Deep-link `/communications/resident/[tenantId]` → thread | S9 | S1 | **Fixed** |
| DPX2-T006 | Owner notify | No obvious “notify owner” on path | 30–90 | Property/WO More + announcement `intent=owner-update` | S10 | S1 | **Fixed** |
| DPX2-T007 | Dashboard | Too many CTAs compete with priorities | 5–15 | Command glance + disclose portfolio/analytics | S1 | S2 | **Fixed** |
| DPX2-T008 | Property list → detail | View click soft-fail / overlay noise (dev hydration) | 5–20 | Server-seeded permissions + sidebar cookie collapsed state | S2 | S2 | **Fixed** |
| DPX2-T009 | Lists | AI label wrong (“Ask about this property” on list) | 3–8 | Pathname context for lists vs detail + operational labels | AI | S2 | **Fixed** |

---

## Full friction register

| ID | Step | Cat | Sev | Freq | Problem | Why | Impact | Recommended improvement | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DPX2-001 | S3/S8 | H/M | S0 | Always | Detail pages crash: `buildAiPageContext` / suggestion builders imported from `"use client"` into RSC | Client boundary violation | **Blocks gold-standard path** | Server pages import from store / `smart-suggestion-builders` | **Fixed** |
| DPX2-002 | S4 | H | S0 | Always (observed) | Resident detail error boundary | Load/context hard-fail | Cannot open resident | Soft-fail related queries + AI import | **Fixed** |
| DPX2-003 | S9 | N/X | S1 | Always | Message → `/communications` unscoped | Toolbelt href not contextual | Re-hunt resident in inbox | `/communications/resident/[tenantId]` + RLS fix | **Fixed** |
| DPX2-004 | S10 | N/H | S1 | Always | No owner-notify next action on path | Missing predicted action | Leaves workflow / invents steps | Property/WO “Notify owner” → announcement prefill | **Fixed** |
| DPX2-005 | S6 | N | S1 | Often | Collect Rent leaves resident context to financials | Module switch | Momentum break | Continuity chips + Collect Rent tenantId | **Fixed** |
| DPX2-006 | S5 | N | S2 | Often | Lease is separate module jump | Necessary but abrupt | Mild | Lease toolbelt + Continuity chips back to resident/property | **Fixed** |
| DPX2-007 | S2→S3 | N | S1 | Often | Property has no “Residents” primary toolbelt action | Toolbelt is Add Unit/Resident/WO/Report | Hunt for resident via list/search | **Residents** primary → `/tenants?propertyId=` | **Fixed** |
| DPX2-008 | S7 | X | S1 | Often | Default maintenance filter hides waiting-resident WOs | Filter taxonomy ≠ dashboard | False empty state | “Open” includes completed-not-archived | **Fixed** |
| DPX2-009 | S1 | S/D | S2 | Always | Dashboard still ~1.5 screenfuls + many links | Portfolio/comms below fold | Mild cognitive load | Command glance + disclose non-priority | **Fixed** |
| DPX2-010 | AI | X | S2 | Often | List routes show detail-ish AI labels | Context sync | Distrust AI | Fix list vs detail + operational wording | **Fixed** |
| DPX2-011 | Shell | M | S2 | Dev always | Hydration error sidebar | SSR/client mismatch | Overlay / distrust | Server-seed permissions + cookie collapsed | **Fixed** |

---

## Priority order (highest first)

1. ~~**P0** DPX2-001 / T001–T002 — unblock Property + WO detail~~ **Done**
2. ~~**P0** DPX2-002 / T003 — unblock Resident detail~~ **Done**
3. ~~**P1** DPX2-007 — Property → Residents next action~~ **Done**
4. ~~**P1** DPX2-003 — Contextual Message~~ **Done** (incl. RLS recursion fix on `conversation_participants`)
5. ~~**P1** DPX2-008 — Maintenance filter alignment~~ **Done**
6. ~~**P1** DPX2-004 — Owner notify from context~~ **Done**
7. ~~**P2** Payment/lease momentum, dashboard density, AI label, hydration~~ **Done**

## Implementation note (2026-07-21)

P0–P2 closed. Continuous S1→S10 re-run completed on Canopy Property Partners. Remaining residual polish (if any) belongs in DPX-001 register / later sprints — not blockers for DPX-002 PASS after production verification.
