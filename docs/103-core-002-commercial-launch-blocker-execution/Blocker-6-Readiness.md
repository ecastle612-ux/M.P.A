# Blocker 6 Readiness — Performance (EP-019)

**Track:** [EP-019](../87-ep-019-performance-speed-certification/README.md)  
**Status:** 📝 Design ✔ · Document ✔ · **Paused** · Implement **locked** · ❌ **Not Approved** · Blocker 6 **QUEUED**  
**Updated:** 2026-07-24  
**Type:** Governance preflight (documentation only — no authorize · no implement)

**Package:** [87](../87-ep-019-performance-speed-certification/README.md)  
**Approval:** [09](../87-ep-019-performance-speed-certification/09-approval.md) — **unsigned**  
**Pass criteria:** [02](../87-ep-019-performance-speed-certification/02-pass-criteria.md)  
**Predecessor (commercial serial):** Blocker 5 ⏳ **OPEN** — PUSH-001 commercial PASS pending ([Blocker-5-Readiness](./Blocker-5-Readiness.md) · [14 FAIL](../99-push-001-pwa-push-commercial-certification/14-commercial-certification-report.md))  
**Package sequencing dependency:** [UX-009](../88-ux-009-cognitive-load-workflow-optimization/README.md) — Approved · Implement unlocked · **not package-COMPLETE** (no UX-009 certification report; remaining surfaces noted in [11](../88-ux-009-cognitive-load-workflow-optimization/11-implementation-notes.md))

---

## Purpose

Independent governance preflight for CORE-002 **Blocker 6**. Determines EP-019 readiness relative to Approve, Implement, certification, and Commercial Launch. Does **not** authorize Approve, unlock Implement, close Blocker 6, or authorize Commercial Launch.

---

## 1. Preflight verification

| Check | Result | Evidence |
|-------|--------|----------|
| Design → Document package exists | ✅ Complete | [README](../87-ep-019-performance-speed-certification/README.md) · docs 01–09 |
| Package Approve | ❌ **Not Approved** | [09](../87-ep-019-performance-speed-certification/09-approval.md) sign-off blank |
| Implement unlocked | ❌ **Locked** | README · gate sequence |
| UX-009 sequencing satisfied | ❌ **Not complete** | UX-009 still “in progress”; EP-019 README + UX-009 [09](../88-ux-009-cognitive-load-workflow-optimization/09-approval.md) pause until UX-009 certified |
| Serial predecessor (Blocker 5) | ❌ OPEN | PUSH-001 commercial FAIL / device evidence pending |
| Money-ops predecessors (Blockers 1–4) | ✅ CLOSED | CORE-002 |
| Baseline / optimize / re-measure | ❌ Not started | [04](../87-ep-019-performance-speed-certification/04-baseline-results.md) empty · [06](../87-ep-019-performance-speed-certification/06-optimization-log.md) empty · no `artifacts/` |
| Package PASS / Blocker 6 CLOSED | ❌ No | [08](../87-ep-019-performance-speed-certification/08-final-verdict.md) pending |
| Commercial Launch | ❌ Not authorized | Master plan / gate |

**Preflight judgment:** EP-019 is **not ready to Approve or Implement**. Package documentation is sufficient for a future Approve decision, but **two gates block commercial execution of Blocker 6 today:**

1. **Package gate:** UX-009 not certified complete (binding pause in EP-019 / UX-009 docs).  
2. **Commercial serial:** Blocker 5 (PUSH-001) not CLOSED.

No automatic Authorize. Do **not** skip to Blocker 6 closure as a substitute for Blocker 5.

---

## 2. Current EP-019 status

| Field | Value |
|-------|--------|
| **Package status** | Design ✔ · Document ✔ · **Paused** · ❌ Not Approved · Implement **locked** |
| **Implementation Gate (registry)** | ⚠️ **Missing row** in [implementation-gate.md](../00-governance/implementation-gate.md) — tracked in roadmap/freeze as Paused / locked |
| **Engineering** | ❌ None under EP-019 (locked). Hypotheses only ([05](../87-ep-019-performance-speed-certification/05-static-audit-hypotheses.md) · [07](../87-ep-019-performance-speed-certification/07-bottleneck-register.md)) |
| **Certification** | ❌ Not started — hard gates unchecked ([08](../87-ep-019-performance-speed-certification/08-final-verdict.md)) |
| **CORE-002 Blocker 6** | ⏳ **QUEUED** (serial after Blocker 5) |
| **Adjacent work (not EP-019 PASS)** | CORE-003 M0 Lighthouse / AMD perf framework — login/M0 path only; **does not** close Blocker 6 |

### Phase / doc roll-up

| Doc | Header status | Preflight reading |
|-----|---------------|-------------------|
| [01](../87-ep-019-performance-speed-certification/01-scope-and-methodology.md) | Draft (Awaiting Approve) | Scope + evidence rules ready |
| [02](../87-ep-019-performance-speed-certification/02-pass-criteria.md) | Draft (Awaiting Approve) | Design Partner Ready hard gates defined |
| [03](../87-ep-019-performance-speed-certification/03-measurement-plan.md) | Draft (Awaiting Approve) | Execute **after** Approve |
| [04](../87-ep-019-performance-speed-certification/04-baseline-results.md) | Locked until Approve | Empty tables |
| [05](../87-ep-019-performance-speed-certification/05-static-audit-hypotheses.md) | Pre-measure | H1–H8 unverified (static OK pre-Approve) |
| [06](../87-ep-019-performance-speed-certification/06-optimization-log.md) | Empty | No OPT entries |
| [07](../87-ep-019-performance-speed-certification/07-bottleneck-register.md) | Hypotheses only | B1–B8 unverified |
| [08](../87-ep-019-performance-speed-certification/08-final-verdict.md) | Not certifiable | PASS/FAIL pending |
| [09](../87-ep-019-performance-speed-certification/09-approval.md) | Unsigned | Chat shortcut: `APPROVE EP-019` |

### Gate sequence (package)

```
Design ✔ → Document ✔ → Approve ❌ → Measure (baseline) 🔒
        → Optimize (evidence-only) 🔒 → Re-measure 🔒 → Verdict 🔒
```

---

## 3. Dependency graph

```
UX-009 (IA / cognitive load)
  Approved · Implement unlocked · ❌ not package-COMPLETE
        │
        │  (EP-019 README: pause until UX-009 complete)
        ▼
   EP-019 package
   ❌ Not Approved · Implement locked · Paused
        │
CORE-002 serial: Blockers 1–4 ✅ → Blocker 5 ⏳ → Blocker 6
        │
        ▼
   APPROVE EP-019  (human — not issued here)
        │
        ▼
   Baseline measure → evidence-gated optimize → re-measure
        │
        ▼
   EP-019 PASS ([08]) → Blocker 6 CLOSE
        │
        ▼
   Commercial Launch Certification (≥ 9.5)
   ❌ Not authorized by Blocker 6 alone
```

### Serial commercial spine

| Blocker | Status |
|---------|--------|
| 1–4 | ✅ CLOSED |
| **5 PUSH-001** | ⏳ **ACTIVE** · cert FAIL (device evidence) |
| **6 EP-019** | ⏳ **QUEUED** · package locked |
| Commercial Launch | ❌ Not authorized |

---

## 4. Remaining work

### Governance

| Item | Status |
|------|--------|
| Package Approve | ❌ Required before measure/optimize |
| UX-009 complete / cert (or explicit sequencing waiver) | ❌ Required per package pause rule |
| Blocker 5 CLOSE | ❌ Required before Blocker 6 commercial CLOSE (serial) |
| Add EP-019 row to Implementation Gate registry | Optional hygiene (this preflight recommends) |
| Blocker 6 closeout record | ❌ After package PASS |
| Commercial Launch authorize | ❌ Separate · later |

### Implementation (remaining — locked until Approve)

| Slice | Status | Notes |
|-------|--------|-------|
| Baseline measurement (lab + authenticated routes) | 🔒 | [03](../87-ep-019-performance-speed-certification/03-measurement-plan.md) · fill [04](../87-ep-019-performance-speed-certification/04-baseline-results.md) |
| Real-device mobile feel checklist | 🔒 | Mid-range Android + iPhone Safari |
| Bundle / React / DB / network audits | 🔒 | Post-Approve only |
| Evidence-gated optimizations | 🔒 | Cite bottleneck ID · log in [06](../87-ep-019-performance-speed-certification/06-optimization-log.md) |
| Cert-only path | 🔒 Conditional | Allowed by CORE-002 **if** baselines already PASS with **no** code — still requires Approve + measure + verdict; does **not** skip Blocker 5 |

### Certification (remaining)

| Gate (Design Partner Ready) | Status |
|-----------------------------|--------|
| LCP &lt; 2.5 s | ☐ |
| INP &lt; 200 ms | ☐ |
| CLS &lt; 0.1 | ☐ |
| No navigation lag | ☐ |
| No visible UI stutter | ☐ |
| No unnecessary full-route spinners | ☐ |
| Mobile feels native | ☐ |
| No performance regressions | ☐ |
| Final verdict [08] | ☐ Pending |

---

## 5. Commercial launch impact

| Item | Impact |
|------|--------|
| **B6 / EP-019** | Blocks Commercial Launch readiness path (with B5 + launch cert ≥ 9.5) |
| Skipping B6 | ❌ Not allowed as substitute for B5; launch checklist requires performance bar |
| Approving EP-019 early | Would unlock measure/optimize **package work** but must **not** claim Blocker 6 CLOSED or displace Blocker 5 focus |
| Adjacent M0 LH scores | Informational only — **not** EP-019 commercial PASS |

---

## 6. Critical path

```
1. Finish Blocker 5 — PUSH-001 real-device PASS → Blocker 5 CLOSE
        ↓
2. Resolve UX-009 package-COMPLETE (or explicit Product waiver of EP-019 pause)
        ↓
3. Human: APPROVE EP-019
        ↓
4. Baseline measure (prod + local) → bottleneck register from evidence
        ↓
5. Optimize only where measured (or cert-only if already PASS)
        ↓
6. Re-measure → [08] PASS → Blocker 6 CLOSE
        ↓
7. Commercial Launch Certification ≥ 9.5
```

**Choke points today:** (A) Blocker 5 device cert, (B) UX-009 completion vs Approve eligibility, (C) unsigned EP-019 Approve.

---

## 7. Recommended next authorization step

**Do not issue `APPROVE EP-019` from this preflight.**  
**Do not unlock Implement.**  
**Do not close Blocker 6.**  
**Do not authorize Commercial Launch.**

| Recommendation | Detail |
|----------------|--------|
| **Primary commercial milestone (unchanged)** | Continue **Blocker 5** — `RESUME PUSH-001 REAL-DEVICE CERTIFICATION` with physical-device evidence |
| **EP-019 package (when serial + UX-009 allow)** | Human kickoff: **`APPROVE EP-019`** — unlocks baseline measure + evidence-gated optimize only |
| **If UX-009 still incomplete at Blocker 5 CLOSE** | Product must either finish UX-009 cert **or** document an explicit sequencing decision before Approve |
| **Cert-only variant** | After Approve: measure first; optimize **only** if FAIL — still not a CLOSE without [08] PASS |
| **Explicit non-actions** | No auto-Approve · no Implement · no Blocker 6 CLOSE · no Launch |

---

## 8. Explicit non-claims

| Item | Status |
|------|--------|
| EP-019 Approved | ❌ No |
| Implement unlocked | ❌ No |
| Blocker 6 CLOSED | ❌ No |
| Commercial Launch | ❌ No |
| This document as Authorize / CLOSE | ❌ Readiness only |

---

## Related

- [EP-019 README](../87-ep-019-performance-speed-certification/README.md)  
- [09 — Approval](../87-ep-019-performance-speed-certification/09-approval.md)  
- [UX-009](../88-ux-009-cognitive-load-workflow-optimization/README.md)  
- [Blocker-5-Readiness](./Blocker-5-Readiness.md)  
- [Implementation Gate](../00-governance/implementation-gate.md)  
- [Project Roadmap Status](../00-governance/project-roadmap-status.md)  
- [Commercial Launch Master Plan](../00-governance/commercial-launch-master-plan.md)  
- [Development Freeze Checkpoint](../00-governance/development-freeze-checkpoint.md)
