# 10 — Friction Register (Phase 2)

**Package:** DPX-002  
**Captured:** 2026-07-21  
**Rule:** Hesitation / hard stop = defect. Prioritize by severity × frequency.

---

## Friction Timer log (Amendment C)

| ID | Screen | Reason | Time lost (s) | Better alternative | Step | Sev | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| DPX2-T001 | `/properties/[id]` | Page dead — “Properties unavailable” / buildAiPageContext server call | 30–120+ (retry loops) | Import `buildAiPageContext` from store (server-safe); keep Bridge client-only | S3 | S0 | Open → **P0 implement** |
| DPX2-T002 | `/maintenance/[id]` | Same client/server crash | 30–120+ | Same fix | S8 | S0 | Open → **P0** |
| DPX2-T003 | `/tenants/[id]` | “Unable to load tenant context” | 20–60 | Diagnose load failure; verify AI import path | S4 | S0 | Open → **P0** |
| DPX2-T004 | `/maintenance` default | Empty list while dashboard shows WOs | 10–30 | Default filter include waiting_resident / align with dashboard | S7–S8 | S1 | Open |
| DPX2-T005 | Resident Message | Unsure if Message goes to this resident | 15–45 | Deep-link thread/compose with tenantId | S9 | S1 | Open |
| DPX2-T006 | Owner notify | No obvious “notify owner” on path | 30–90 | Contextual announcement/message from property/WO | S10 | S1 | Open |
| DPX2-T007 | Dashboard | Too many CTAs compete with priorities | 5–15 | Keep priorities dominant; disclose rest (already partial) | S1 | S2 | Open |
| DPX2-T008 | Property list → detail | View click soft-fail / overlay noise (dev hydration) | 5–20 | Fix sidebar hydration; make row open reliable | S2 | S2 | Open |
| DPX2-T009 | Lists | AI label wrong (“Ask about this property” on list) | 3–8 | Pathname context for lists vs detail | AI | S2 | Open |

---

## Full friction register

| ID | Step | Cat | Sev | Freq | Problem | Why | Impact | Recommended improvement | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DPX2-001 | S3/S8 | H/M | S0 | Always | Detail pages crash: `buildAiPageContext` imported from `"use client"` module into RSC | Client boundary violation | **Blocks gold-standard path** | Server pages import from `ai-page-context-store`; Bridge stays client | Open P0 |
| DPX2-002 | S4 | H | S0 | Always (observed) | Resident detail error boundary | Load/context failure | Cannot open resident | Fix data load + same AI import | Open P0 |
| DPX2-003 | S9 | N/X | S1 | Always | Message → `/communications` unscoped | Toolbelt href not contextual | Re-hunt resident in inbox | `?tenantId=` / thread deep link | Open P1 |
| DPX2-004 | S10 | N/H | S1 | Always | No owner-notify next action on path | Missing predicted action | Leaves workflow / invents steps | Property/WO “Notify owner” → existing announcement with prefill | Open P1 |
| DPX2-005 | S6 | N | S1 | Often | Collect Rent leaves resident context to financials | Module switch | Momentum break | Keep return path / strip context chip | Open P2 |
| DPX2-006 | S5 | N | S2 | Often | Lease is separate module jump | Necessary but abrupt | Mild | Ensure Lease toolbelt + back to resident | Open P2 |
| DPX2-007 | S2→S3 | N | S1 | Often | Property has no “Residents” primary toolbelt action | Toolbelt is Add Unit/Resident/WO/Report | Hunt for resident via list/search | Add **Residents** / unit roster next action (Amendment A) | Open P1 |
| DPX2-008 | S7 | X | S1 | Often | Default maintenance filter hides waiting-resident WOs | Filter taxonomy ≠ dashboard | False empty state | Align default “open” with ops reality | Open P1 |
| DPX2-009 | S1 | S/D | S2 | Always | Dashboard still ~1.5 screenfuls + many links | Portfolio/comms below fold | Mild cognitive load | Further disclose non-priority blocks | Open P2 |
| DPX2-010 | AI | X | S2 | Often | List routes show detail-ish AI labels | Context sync | Distrust AI | Fix list vs detail context | Open P2 |
| DPX2-011 | Shell | M | S2 | Dev always | Hydration error sidebar | SSR/client mismatch | Overlay / distrust | Fix sidebar snapshot | Open P2 |

---

## Priority order (highest first)

1. **P0** DPX2-001 / T001–T002 — unblock Property + WO detail  
2. **P0** DPX2-002 / T003 — unblock Resident detail  
3. **P1** DPX2-007 — Property → Residents next action  
4. **P1** DPX2-003 — Contextual Message  
5. **P1** DPX2-008 — Maintenance filter alignment  
6. **P1** DPX2-004 — Owner notify from context  
7. **P2** Payment/lease momentum, dashboard density, AI label, hydration
