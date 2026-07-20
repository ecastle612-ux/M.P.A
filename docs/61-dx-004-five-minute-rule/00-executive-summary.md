# DX-004 — Executive Summary

**Status:** Approved — Execution Phase 1  
**Date:** 2026-07-18  
**Persona:** Property manager · **500 units** · interrupted every ~3 minutes · laptop + phone  
**Constraint:** Design + Document only

---

## 1. Executive Summary

M.P.A. already contains the jobs a 500-unit manager needs. It does not yet behave like the **OS they run all day**.

Today’s pattern is still **page collection UX**:

```
Find module → open list → open record → edit → save → find next module
```

Under constant interruption, that pattern fails the **5-Minute Rule**. Managers lose context, re-navigate, and re-learn which path is “the real one.”

DX-004 defines the **Operating System UX** that DX-003’s click reductions enable:

| OS surface | Job |
| --- | --- |
| **Today’s Work** | Everything due today, in one place |
| **Next Best Action** | AI-ranked “do this next” (assistive) |
| **Global Quick Add** | Always-available create for common objects |
| **Universal Command Palette** | ⌘K search + navigate + run actions |
| **Right-side Quick Inspector** | Preview/edit without leaving the list |
| **Bulk Operations** | Select → act on every major list |
| **Context Actions** | Every card answers “what’s next?” |

**Relationship to DX-003:** DX-003 removes dual paths and mis-wired Quick Actions. DX-004 specifies the durable interaction system those fixes plug into. Approve both; implement DX-003 P0 slices first, then DX-004 OS surfaces.

---

## Scores (projected)

| Score | Pre-DX-004 (approx) | After DX-003 only | After DX-003 + DX-004 OS |
| --- | ---: | ---: | ---: |
| Zero-Friction (DX-003) | 5.2 | 7.4 | **8.2** |
| 5-Minute Rule pass rate* | ~45% | ~65% | **≥ 85%** |
| Design Partner Readiness | 8.3–8.8 | 8.9–9.1 | **9.2–9.4** |
| Production Readiness | 5.0–7.1† | +0.2–0.4 | **+0.3–0.5** (UX only) |

\*Share of common daily jobs completable ≤5 minutes without training.  
†Still gated by PT/LC providers; DX-004 does not clear push/email/payment certification.

---

## 16. ROI analysis (500-unit PM)

| Metric | Current | Target (DX-003+004) |
| --- | ---: | ---: |
| Ops clicks / day | ~140 | ~70 |
| Interrupt-recovery tax | High (re-find page) | Low (Today’s Work + Inspector) |
| Minutes saved / day | — | **70–90** |
| Hours saved / month (22 days) | — | **≈ 26–33** |
| New-hire shadowing to first independent morning | ~2–3 days | **≤ 0.5 day** |

Conservative dollar value (one PM): **~0.5 FTE-month / year** in recovered attention — before counting fewer mistakes (wrong unit, missed payment, stalled WO).

---

## 17. Design Partner score impact

| Effect | Why |
| --- | --- |
| **+0.3 to +0.6** on Design Partner Readiness | Partners feel “I can run Monday on phone between calls” |
| Training collapse | Quick Add + Today’s Work replace wiki-style onboarding |
| Differentiation | OS model is visible in first five minutes ([First Five Minutes](../21-experience-architecture/first-five-minutes.md)) |

---

## 18. Production readiness impact

| Effect | Why |
| --- | --- |
| Small (+0.3–0.5) | Faster UX ≠ provider certification |
| Indirect | Fewer wrong-record mutations when Inspector + confirmations are consistent |
| Non-goals | Does not replace PT-001 / LC-001 P0s |

---

## Recommendation stance

| Question | Answer |
| --- | --- |
| Approve DX-004 design? | **YES — recommend Approve** after/with DX-003 |
| Implement now? | **NO** — Approved |
| Ship OS surfaces before DX-003 P0? | **NO** — fix dual-path + payment wiring first |
| Unsupervised 500-unit production? | Still **NO** until provider/trust track clears |

---

## Gate

```
Design ✔ → Document ✔ → Approved → Implement in progress
```
