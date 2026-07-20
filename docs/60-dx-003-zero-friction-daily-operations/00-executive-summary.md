# DX-003 — Executive Summary

**Status:** Approved — Execution Phase 1  
**Date:** 2026-07-18  
**Persona:** Property manager · 250 units · 08:00–17:00 weekday  
**Constraint:** Design + Document only — no implementation

---

## 1. Executive Summary

M.P.A. can already run the core day — Operations Center, guided move-in/out, applicants, leases, maintenance, financials, and communications exist. What burns time is **path duplication** and **Ops-as-dashboard**: almost every “today’s job” is still **attention → list → detail → edit** (3–6 clicks), with parallel CRUD and guided flows teaching two ways to do the same job.

A 250-unit manager does not want more modules. They want:

1. **One path per job** (guided wins; CRUD becomes escape hatch).
2. **Resolve-in-place** from Operations Center for the top 8 daily actions.
3. **Command Center that does work**, not only jumps to `/new` screens.
4. **Honest empty/success states** that never promise inspections or staff hubs that do not exist.

If DX-003 ships as proposed, the same morning can drop from roughly **~95 operational clicks** to **~55**, saving about **45–60 minutes/day** (~16–20 hours/month) for one full-time PM — without new product surfaces.

---

## 2. Workflow Score (0–10)

| Dimension | Score | Notes |
| --- | ---: | --- |
| Completeness of daily jobs | 7.5 | Core jobs exist; inspections absent |
| Click efficiency | 4.5 | Too many list→detail→edit chains |
| Path clarity (one way) | 4.0 | Guided + CRUD teach conflict |
| Ops Center as console | 5.0 | Attention-first helps; still deep-links out |
| Command Center usefulness | 5.5 | Search strong; lifecycle/create lag |
| Empty / success / loading trust | 6.5 | DX-001 improved; still uneven |
| Bulk & keyboard leverage | 3.5 | Bulk only residents; shortcuts incomplete |
| **Overall Zero-Friction score** | **5.2 / 10** | Capable but click-heavy |

**Target after approved DX-003 slices:** **7.4 / 10** Zero-Friction (Design Partner feel of “I can run Monday without training”).

---

## 3. Click Count — Before / After (representative day)

Assumptions: 250 units · morning triage · 3 move-related jobs · 5 work orders · 8 payments · 4 communications · 2 applicant decisions · normal CRUD exceptions.

| Job cluster | Before (clicks) | After (target) | Delta |
| --- | ---: | ---: | ---: |
| Morning Ops review + clear top 5 attentions | 18 | 10 | −8 |
| Record payments (8) | 24 | 12 | −12 |
| Maintenance triage + vendor assign (5) | 20 | 12 | −8 |
| Applicant decide → start move-in (2) | 12 | 6 | −6 |
| Move-in / move-out / transfer (3) | 15 | 12 | −3 |
| Announcements + inbox replies (4) | 10 | 7 | −3 |
| Lease / signature follow-ups (2) | 8 | 5 | −3 |
| Navigation / rediscovery / dead ends | 12 | 4 | −8 |
| **Day total (ops clicks)** | **~119** | **~68** | **≈ −43%** |

“After” assumes P0+P1 slices only — not a full redesign.

---

## 4. Estimated minutes saved / day

| Source | Minutes / day |
| --- | ---: |
| Fewer page transitions & list trips | 20–25 |
| One-shot payment + WO assign from Ops | 10–15 |
| Remove dual-path hesitation / rework | 8–10 |
| Command Center lifecycle shortcuts | 5–8 |
| **Total** | **≈ 45–60 min** |

---

## 5. Estimated hours saved / month

| Basis | Hours / month |
| --- | ---: |
| 22 working days × 50 min | **≈ 18 hours** |
| Conservative (40 min/day) | ≈ 15 hours |
| Optimistic (60 min/day) | ≈ 22 hours |

At typical PM fully-loaded cost, that is material SaaS value without adding features.

---

## 6. Design Partner Score impact

| Score | Current (approx) | After DX-003 (projected) |
| --- | ---: | ---: |
| Design Partner Readiness | 8.3–8.8 | **8.9–9.1** |

**Why it moves:** Partners stop asking “which path is correct?” and stop bouncing out of Ops for every resolve action. Training time for a new assistant drops.

**What does not move:** Provider deliverability, inspections product, and production trust gaps remain outside DX-003.

---

## 7. Production Readiness impact

| Score | Current (approx) | After DX-003 (projected) |
| --- | ---: | ---: |
| Production Readiness | 5.0–7.1* | **+0.2 to +0.4** only |

\*Depends on LC/PT track. DX-003 is UX efficiency — it does **not** clear P0 provider / push / email blockers.

---

## 8. Ranked implementation slices (preview)

Full detail in [02 — Recommendations & Slices](./02-recommendations-and-slices.md).

| Rank | Slice | Priority | Est. effort |
| --- | --- | --- | --- |
| 1 | Ops resolve-in-place for payment, WO assign, screening decide | P0 | M |
| 2 | Kill dual-path confusion (CRUD demoted; guided primary) | P0 | S–M |
| 3 | Record Payment one-shot (not charges list) | P0 | S |
| 4 | Command Center lifecycle + Inbox + Migration actions | P1 | S |
| 5 | Nav compression (resident group, Comms group) | P1 | S |
| 6 | Signature / vendor queues from Ops widgets | P1 | M |
| 7 | Keyboard + bulk for top queues | P1 | M |
| 8 | Honest dead-end copy (inspections, staff hub) | P2 | S |

---

## 9. Screens requiring redesign (not new modules)

| Screen | Why |
| --- | --- |
| `/dashboard` Operations Center | Attention row must become **actionable console**, not metric gallery |
| `/financials/charges` + payment form | One-shot “Record payment” surface |
| Maintenance detail / vendor assign | Inline assign + complete without Edit page |
| Applicant detail | Decide → Move in as single continuation |
| Shell navigation | Compress four resident links + Comms/Inbox |
| Command Center static providers | Align creates with guided workflows |

---

## 10. Quick Wins (<30 min each)

1. Relabel Ops “Record Payment” → open payment dialog/route with resident picker (or deepest useful form), not bare charges list.  
2. Vacant-ready Ops task → `/residents/move-in` (not `/tenants/new`).  
3. Fix Command Center shortcut collision (`G A`).  
4. Add CC pinned: Move in, Move out, Inbox, Migration.  
5. Tenants empty / create CTAs: primary “Move in”, secondary “Create tenant record”.  
6. Remove or rewrite “Schedule a move-in inspection” copy where no inspections module exists.  
7. Signature Ops widget → filtered leases `?signature=pending` (query only).  
8. Hide “Create tenant manually” on move-in success for users who just finished guided path (or demote).

---

## 11. High ROI improvements

1. **Ops resolve strip** — top attentions with primary action buttons that mutate or open a focused modal.  
2. **One-shot Record Payment** — resident/unit → amount → method → save (≤2 clicks from Ops).  
3. **WO Assign Vendor inline** — no Edit page for the common path.  
4. **Applicant Approve → Move in** continuation with source prefilled.  
5. **Single resident IA** — one “Residents” nav group with Move in as default landing action.

---

## 12. Long-term UX improvements (still no new modules)

1. Queue patterns reused across signatures, screening, WO, payments (same interaction grammar).  
2. Keyboard-first Ops (`J/K` through attention, `Enter` to resolve).  
3. Preference: “Default create path = guided” org setting.  
4. When inspections eventually ship (separate initiative), replace checklist fiction with real links — **not** in DX-003.

---

## Recommendation stance

| Question | Answer |
| --- | --- |
| Approve DX-003 design package? | **YES — recommend Approve** for P0+P1 slices |
| Implement before Approve? | **NO** — Implementation Gate |
| Unsupervised production for 250 units? | Still blocked on PT/LC provider track — DX-003 alone is insufficient |

---

## Gate

**Status remains Draft until explicit Approve.**  
After Approve, implement only ranked slices in [02](./02-recommendations-and-slices.md); material additions restart the gate.
