# 23 — M0 Framework Limit Governance Review

**Package:** CORE-003  
**Status:** ✅ Review complete · Amendment **APPROVED** — see [24](./24-core-003-amd-m0-perf-framework-limit.md)  
**Date:** 2026-07-24  
**Scope:** Whether Lighthouse Performance ≥95 should remain a hard M0 blocker after documented Option A–C due diligence  
**Inputs:** [18](./18-m0-lighthouse-recovery.md) · [19](./19-m0-performance-remediation.md) · [20](./20-m0-shared-chunk-forensics.md) · [21](./21-m0-performance-option-b.md) · [22](./22-m0-performance-option-c.md) · artifacts `m0-perf-option-c/`  
**Code changes:** ❌ None (this document only)

> **Governance outcome:** Product Owner approved **OPTION 2** as `CORE-003-AMD-M0-PERF-FRAMEWORK-LIMIT` ([24](./24-core-003-amd-m0-perf-framework-limit.md)). Performance gate is **CONDITIONALLY SATISFIED**. This does **not** authorize UX-012. M0 remains **NO-GO** until devices, PAY-001, infra, authenticated regressions, and final readiness review pass.

---

## 1. Engineering summary

### Optimization sequence (completed)

| Effort | Result (lab `/login`) |
|--------|------------------------|
| Baseline recovery | Perf **66** |
| M0-PERF-001 | Perf **67** (LCP improved; TBT dominant) |
| M0-PERF-002 forensics | Shared chunks / providers identified |
| Option B | Perf **71** — providers route-scoped; Supabase off cold login |
| Option C | Perf **69–73** (best **73**) — LoginForm island removed; server actions |

Accessibility **100** · Best Practices **100** after Option B/C.

### Due diligence complete

Within approved architecture (Next.js App Router + Supabase auth, no framework bypass):

- Application-controlled login JS removed (no product `"use client"` on `/login`)
- Providers / AuthSessionSync / SW not on anonymous auth
- Supabase browser client not on cold `/login`
- Remaining TBT attributed to **react-dom + App Router / Flight / Turbopack runtime**

Option C’s earlier estimate (~92–98) assumed near-elimination of react-dom on login. Measurement shows App Router **still ships** that runtime with zero product client islands — the estimate was wrong; the **framework limit finding in [22](./22-m0-performance-option-c.md) stands**.

---

## 2. Framework vs application responsibility

### Method

Post–Option C `/login` HTML script graph classified against `.next/static/chunks` fingerprints (resource/decoded bytes). Cross-checked with Lighthouse `network-requests` transfer sizes (`login-final.report.json`, Perf **73**).

### Resource-byte ownership (decoded / on-disk chunks referenced by `/login`)

| Class | Bytes | Share |
|-------|------:|------:|
| Framework — react-dom | 263,581 | **38.0%** |
| Framework — App Router / Flight | 231,851 | **33.4%** |
| Framework — Next / Turbopack other runtime | 177,850 | **25.6%** |
| **Framework subtotal** | **673,282** | **~97.0%** |
| Application (M.P.A. product strings / small app chunks) | 11,416 | **~1.6%** |
| Unclassified small | 9,763 | **~1.4%** |
| **Total** | **694,461** | 100% |

Even if all “unknown” bytes are attributed to M.P.A. (worst case for the app), **application-controlled JS ≤ ~3%** of the login script graph.

### Transfer-byte ownership (Lighthouse network, compressed)

Largest transfers on the Perf **73** run:

| Transfer | Class | Chunk |
|---------:|-------|-------|
| ~74 KiB | Framework react-dom | `3o8-…` |
| ~39 KiB | Framework App Router / Flight | `3o9c-…` |
| ~14 KiB | Framework Next runtime | `0adsp-…` |
| … | Framework (remaining top scripts) | … |
| ~3 KiB + ~3 KiB | Application (small) | two minor chunks |

**Conclusion:** Remaining JavaScript cost on anonymous `/login` is **primarily framework-owned (~97% resource / dominant transfer + TBT)**. Application-controlled critical bottlenecks on that route are **exhausted** under the approved architecture.

### Control matrix

| Bottleneck | Owner | Under M.P.A. control without architecture change? |
|------------|-------|-----------------------------------------------------|
| react-dom bootstrap on App Router pages | Next / React | ❌ No |
| App Router / Flight client runtime | Next | ❌ No |
| Turbopack / Next runtime helpers | Next | ❌ No |
| Product LoginForm island | M.P.A. | ✅ Removed (Option C) |
| Root Theme/Toast/AuthSessionSync/SW on auth | M.P.A. | ✅ Removed (Option B) |
| Supabase/GoTrue on cold login | M.P.A. | ✅ Removed (PERF-001 / B / C) |
| LCP image optimizer tax | M.P.A. | ✅ Mitigated (static WebP) |
| Separate static/edge auth HTML outside App Router | New architecture package | ❌ Not approved; high risk |

---

## 3. Remaining optimization opportunities

| Opportunity | Type | Notes |
|-------------|------|-------|
| Static HTML / edge auth origin (no App Router hydration) | **Architecture change** | Only credible path toward LH ≥95; requires Design → Document → Approve; high auth risk |
| Downgrade / leave App Router for auth only | **Framework bypass** | Out of current governance |
| Further in-app shared-chunk surgery on `/login` | Application | **Diminishing returns** — product JS already ~1–3% |
| Continuous improvement on authenticated shells | Application | Valid later; not an M0 login-LH gate |
| Next.js version upgrades | Dependency | May help marginally; not a substitute for ≥95 guarantee |

**No remaining application-controlled critical bottleneck** was identified on `/login` after Option C.

---

## 4. Regression risk assessment

| Further action to chase ≥95 | Risk | Assessment |
|-----------------------------|------|------------|
| More provider/chunk micro-edits inside App Router | Medium effort / **Low Perf gain** | Unlikely to move 73 → 95; burns capacity |
| Rewrite auth entry outside App Router without new package | **High** | Violates Implementation Gate + Option C stop rules |
| Replace Supabase / change auth flows for Perf | **Critical** | Explicitly prohibited; unacceptable for M0 |
| Keep Perf ≥95 as hard M0 blocker indefinitely | Program risk | Blocks all M1+ despite exhausted app due diligence |

**Disproportionate regression risk:** Yes — additional optimization aimed at LH ≥95 under current architecture either (a) cannot succeed or (b) requires unauthorized framework/auth rewrites with high production risk.

---

## 5. Recommended policy

### **OPTION 2 — Revise M0 performance policy**

Replace hard **Performance ≥95** as an indefinite M0 implementation blocker with:

> **Best Achievable Within Approved Architecture**

**Acceptance criteria for the M0 performance gate (revised):**

1. Performance improvement path fully documented (PERF-001 → forensics → Option B → Option C).  
2. Framework limitations documented with independent bundle/LH evidence ([22](./22-m0-performance-option-c.md) + this review).  
3. Accessibility **≥95** (current lab: **100**).  
4. Best Practices **100** (current lab: **100**).  
5. No application-controlled **critical** bottlenecks remaining on the measured anonymous surface.  
6. Evidence that remaining JS cost is **primarily framework runtime** (this review: **~97%** resource bytes).

**Explicit non-effects of Option 2:**

- Does **not** authorize UX-012 Slice A.  
- Does **not** clear PMX-004 device certification.  
- Does **not** clear PAY-001 verification.  
- Does **not** forbid future performance work as continuous improvement (post-M0 / separate authorize).  
- Absolute LH ≥95 may remain a **stretch / commercial marketing** goal, but not a **hard M0 serial gate** after due diligence.

### Why not Option 1

Maintaining Perf ≥95 as mandatory after Option C forces either permanent M0 deadlock or unauthorized architecture. That confuses **application quality gates** with **framework tax**.

### Why not Option 3

No separate middle path is cleaner than Option 2: the evidence supports policy revision with sharp acceptance criteria, not a one-off waiver without amendment text.

---

## 6. Proposed CORE-003 amendment (draft — not in force until approved)

**Amendment ID:** `CORE-003-AMD-M0-PERF-FRAMEWORK-LIMIT`  
**Affects:** M0 performance interpretation in program readiness / authorization protocol  
**Does not amend:** M0.1 device cert · M0.2 PAY-001 · serial authorize rules · UX-012 unlock phrase

### Proposed binding text

```text
M0 Performance Gate (Amended)

After authorized application performance remediation has been completed through the
approved Option C boundary (or equivalent documented due diligence), the M0
Lighthouse Performance hard target of ≥95 on anonymous /login is superseded by:

  "Best Achievable Within Approved Architecture"

The M0 performance gate is SATISFIED when all of the following are true:

  (a) Remediation sequence and measurements are recorded in CORE-003 M0 performance docs;
  (b) Framework vs application responsibility is evidenced (bundle + Lighthouse);
  (c) Remaining critical JS cost on the measured anonymous surface is primarily
      framework-owned (Next.js App Router / react-dom / Flight runtime);
  (d) Accessibility ≥ 95 and Best Practices = 100 on that surface;
  (e) No application-controlled critical performance bottleneck remains that can be
      removed without framework bypass or unapproved architecture change.

Framework runtime overhead shall not indefinitely block M1+ authorization solely via
Lighthouse Performance score once (a)–(e) are met.

Absolute Performance ≥95 remains a continuous-improvement / commercial stretch goal
and may be pursued only via Design → Document → Approve for material architecture change.

This amendment does not waive PMX-004 Phase 1 Final Device Certification, PAY-001
verification, infrastructure attestation, or authenticated regression requirements.
```

### Suggested placement after Product Owner approval

- New subsection under [05-master-implementation-order.md](./05-master-implementation-order.md) § M0  
- Status row update in [09-authorization-protocol.md](./09-authorization-protocol.md) (M0 performance gate → Satisfied under AMD)  
- Pointer from [12-approval-record.md](./12-approval-record.md) as approved amendment  
- Keep [22](./22-m0-performance-option-c.md) as engineering evidence SoT  

**Amendment status:** ✅ **APPROVED** 2026-07-24 — authoritative record [24](./24-core-003-amd-m0-perf-framework-limit.md).

---

## 7. Final recommendation

| Field | Decision |
|-------|----------|
| **Recommendation** | **OPTION 2** |
| **Product Owner decision** | ✅ **APPROVED** (`CORE-003-AMD-M0-PERF-FRAMEWORK-LIMIT`) |
| **Policy (in force)** | Best Achievable Within Approved Architecture |
| **Performance gate** | **CONDITIONALLY SATISFIED** |
| **Engineering basis** | ~**97%** of `/login` script resource bytes framework-owned; app critical path exhausted |
| **A11y / BP** | **100** / **100** |
| **Implement now?** | ❌ No |
| **Authorize UX-012?** | ❌ No |
| **M0 overall** | ❌ **Still NO-GO** until devices, PAY-001, infra, authenticated regressions, final review |

---

## Appendix — Evidence pointers

| Artifact | Path |
|----------|------|
| Option C report | [22-m0-performance-option-c.md](./22-m0-performance-option-c.md) |
| LH JSON (Perf 73) | `artifacts/m0-perf-option-c/login-final.report.json` |
| Login HTML capture | `artifacts/m0-perf-option-c/login.html` |
| Prior forensics | [20-m0-shared-chunk-forensics.md](./20-m0-shared-chunk-forensics.md) |
