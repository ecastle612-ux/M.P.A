# 38 — PMX-004 Phase 7 Authorization

**Package:** PMX-004 — Native PWA Parity  
**Phase:** **7 — Offline Reliability**  
**Status:** ✅ **AUTHORIZED** · ✅ **IMPLEMENTED** ([39](./39-phase-7-implementation.md)) · ✅ **VALIDATED PASS** ([40](./40-phase-7-validation.md))  
**Authorization date:** 2026-07-26  
**Binding phrase (issued):**

```
AUTHORIZE PMX-004 PHASE 7
```

**Validation phrase (to be issued after implementation):**

```
VALIDATE PMX-004 PHASE 7
```

**Program record:** [CORE-003 §78](../113-core-003-implementation-master-plan/78-pmx-004-phase-7-authorization.md)  
**Prior gate:** [37 — Phase 6 Validation Re-Run #3](./37-phase-6-validation-rerun-3.md) · ✅ **PASS** · [CORE-003 §77](../113-core-003-implementation-master-plan/77-pmx-004-phase-6-validation-rerun-3.md)  
**Phase catalog:** [05 — Implementation order](./05-implementation-order.md) · Phase 7  
**Offline SoT:** [11 — Offline Queue Design](./11-offline-queue-design.md)  
**Package approval:** [12 — Approval checklist](./12-approval-checklist.md) · ✅ APPROVED WITH AMENDMENTS  
**Design SoT:** [05](./05-implementation-order.md) Phase 7 · [11](./11-offline-queue-design.md) · [06 — Acceptance criteria](./06-acceptance-criteria.md) (phase minimum = **A10** + double-submit tests) · [07 — Rollback](./07-rollback-strategy.md) · [08 — Testing strategy](./08-testing-strategy.md) · [00 — Purpose & scope](./00-purpose-and-scope.md) · [09 — Unified SW](./09-unified-service-worker-design.md) (Background Sync wake only)  
**UX substrate:** UX-012 Slice A ✅ **PASS** · Slice B ✅ **PASS** — sync-status chrome uses `--mpa-*` / Canopy; **no navigation IA redesign**  
**Program order:** Next **PMX** authorize unit after Phase 6 Validated ([CORE-003 §01](../113-core-003-implementation-master-plan/01-package-inventory.md) · [05](../113-core-003-implementation-master-plan/05-master-implementation-order.md))

> Phrase **`AUTHORIZE PMX-004 PHASE 7` issued**. Implementation may begin **only** within the scope below.  
> PMX-004 Phases 8–11 · UX-012 C–E · OPS-001 C–E · FIN-003 C–E · certified partner marketplace UI remain **locked**.  
> Do **not** begin implementation of excluded packages under this phrase.  
> This session is **governance only** — no application code under this authorize document.

---

## 1. Prerequisite verification

| Prerequisite | Evidence | Status |
|--------------|----------|--------|
| PMX-004 Approved with Amendments | [12](./12-approval-checklist.md) · Amendments 01–03 | ✅ |
| Phase 1 Final PASS / Certified | [17](./17-phase-1-production-validation.md) · [CORE-003 §35](../113-core-003-implementation-master-plan/35-pmx-004-real-device-certification.md) | ✅ |
| Phase 2 Validated PASS | [21](./21-phase-2-validation.md) · [CORE-003 §62](../113-core-003-implementation-master-plan/62-pmx-004-phase-2-validation.md) | ✅ |
| Phase 3 Validated PASS | [24](./24-phase-3-validation.md) · [CORE-003 §65](../113-core-003-implementation-master-plan/65-pmx-004-phase-3-validation.md) | ✅ |
| Phase 4 Validated PASS | [28](./28-phase-4-validation.md) · [CORE-003 §68](../113-core-003-implementation-master-plan/68-pmx-004-phase-4-validation.md) | ✅ |
| Phase 5 Validated PASS | [31](./31-phase-5-validation.md) · [CORE-003 §71](../113-core-003-implementation-master-plan/71-pmx-004-phase-5-validation.md) | ✅ |
| Phase 6 Validated PASS | [37](./37-phase-6-validation-rerun-3.md) · [CORE-003 §77](../113-core-003-implementation-master-plan/77-pmx-004-phase-6-validation-rerun-3.md) | ✅ |
| M0 = GO | [CORE-003 §36](../113-core-003-implementation-master-plan/36-final-m0-governance-review.md) · **GO** | ✅ |
| UX-012 Slice A Validated | [UX-012 §32](../112-ux-012-platform-experience-design-system/32-slice-a-validation.md) · **PASS** | ✅ |
| UX-012 Slice B Validated | [UX-012 §35](../112-ux-012-platform-experience-design-system/35-slice-b-validation.md) · **PASS** | ✅ |
| OPS-001 Slice A Validated | [OPS-001 §34](../111-ops-001-platform-operations-architecture/34-slice-a-validation-rerun.md) · **PASS** | ✅ |
| AUTH-001 Slices A–E COMPLETE | [AUTH-001 §49](../109-auth-001-organization-provisioning-authentication/49-slice-e-validation.md) · **PASS** | ✅ |
| COM-001 Slices A–E COMPLETE | [COM-001 §42](../110-com-001-customer-lifecycle-commercial-operations/42-slice-e-validation.md) · **PASS** | ✅ |
| Offline queue design present | [11](./11-offline-queue-design.md) | ✅ |
| Next PMX authorize unit = Phase 7 | [01](../113-core-003-implementation-master-plan/01-package-inventory.md) · Phase 6 Validated + authorize phrase | ✅ |
| No unfinished Authorized PMX slice blocking this phrase | Phase 6 Validated · no open authorize ahead of Phase 7 | ✅ |
| PMX-004 Phase 8–11 | Not authorized | ✅ (correct — excluded) |
| UX-012 Slice C–E | Not authorized | ✅ (correct — excluded) |
| OPS-001 Slice C–E | Not authorized | ✅ (correct — excluded) |
| FIN-003 Phases C–E | Locked | ✅ (excluded) |
| Certified partner marketplace UI | Locked | ✅ (excluded) |
| Explicit authorize phrase recorded | **This document** | ✅ |

**Governance blockers remaining for Phase 7?** ❌ **None.**

**Order note:** Package [05](./05-implementation-order.md) depends Phase 7 on **Phase 1** (unified SW). Program sequence authorizes Phase 7 after Phase 6 Validated. This phrase authorizes **PMX-004 Phase 7 (Offline Reliability)** only. Peers remain separately gated.

**Collision guard:** No Phase 8–11 authorize/implement docs present at issue time. Doc slots: package §38 = this authorize · CORE-003 §78 = program record (does not collide with Phase 6 §32–§37 / §72–§77).

---

## 2. Authorization scope

### In scope (Phase 7 — Offline Reliability)

Binding work list from [05](./05-implementation-order.md) Phase 7 and [11](./11-offline-queue-design.md) — **client IndexedDB outbox · allowlisted sync · sync status UI · no schema**:

| Deliverable | Binding source |
|-------------|----------------|
| **IndexedDB outbox + sync manager** — `mpa-outbox` stores (`items` · `blobs`) per [11](./11-offline-queue-design.md) | [05](./05-implementation-order.md) · [11](./11-offline-queue-design.md) |
| **Allowlist workflows** — maintenance notes/comments; maintenance/vendor photo attach; inspection checklist item responses (if APIs present; else defer item); message draft send; explicitly tagged simple form drafts | [11](./11-offline-queue-design.md) §3 · [05](./05-implementation-order.md) |
| **Background Sync registration** when available + always `online` / visibility fallback | [11](./11-offline-queue-design.md) §5 · §7 |
| **Sync status UI** — shell-level chip + detail sheet (Retry / Discard confirm); non-blocking | [11](./11-offline-queue-design.md) §6 |
| **Conflict / failure UX** — never silent drop; failed items retain user message | [11](./11-offline-queue-design.md) §1 · §5 |
| **Idempotency** — UUID per outbox item; double-submit / double-delivery tests PASS | [11](./11-offline-queue-design.md) §8 · [06](./06-acceptance-criteria.md) A10 |
| **Non-allowlisted block** — clear “requires connection” for payments, e-sign, auth/org switch, Master Admin mutations, bulk import, destructive deletes (unless later added) | [11](./11-offline-queue-design.md) §3 |
| **Logout hygiene** — warn if pending &gt; 0; clear outbox on logout (with confirm) | [11](./11-offline-queue-design.md) §9–§10 |
| **Preserve Phases 1–6** — unified SW · install · shell · standalone · UX polish · push cert remain intact | Phases 1–6 Validated |
| **Provider / schema constraint** — OneSignal primary retained; **no database schema migrations** under this authorize | Package non-negotiables · [11](./11-offline-queue-design.md) |

### Implementation boundaries

1. Work is limited to **Offline Reliability** (Phase 7) — not Phase 8 Lighthouse gates, Phase 9 premium APIs, Phase 10 regression, or Phase 11 pilot.  
2. **Client-side outbox only** — IndexedDB + existing same-origin APIs; page-driven sync preferred (SW wakes clients; does not hold session tokens).  
3. **DO NOT** redesign the application, change IA, remove features, or claim full product offline CRUD.  
4. **DO NOT** break Auth / Supabase / OneSignal / Stripe / unified service worker / Phases 2–6 surfaces.  
5. **DO NOT** introduce schema migrations under this authorize.  
6. Unknown endpoints default to **block offline**.  
7. Material scope beyond Phase 7 requires a new authorize phrase (`AUTHORIZE PMX-004 PHASE …` / other packages).

### Includes (explicit)

- IndexedDB outbox + sync engine (FIFO · one active sync · multi-tab coordination)  
- Allowlist enqueue paths for v1 workflows in [11](./11-offline-queue-design.md)  
- Background Sync tag `mpa-outbox-sync` where supported; iOS/foreground online fallback  
- SyncStatus chrome + pending detail sheet  
- Airplane-mode → reconnect evidence for allowlisted note/photo paths  
- Double-submit / idempotency tests  
- Implementation summary + validation evidence under **P7-01…P7-10**  

---

## 3. Excluded functionality (explicit)

| Excluded | Remains |
|----------|---------|
| PMX-004 Phase 8 — Performance Optimization | Separate authorize |
| PMX-004 Phase 9 — Premium Native Features | Separate authorize |
| PMX-004 Phase 10 — Production Validation | Separate authorize |
| PMX-004 Phase 11 — Real-World Pilot / package COMPLETE | Separate authorize |
| UX-012 Slices C–E | Separate authorize |
| OPS-001 Slices C–E | Separate authorize |
| FIN-003 Phases C–E | Separate authorize |
| Certified partner marketplace UI | Separate authorize |
| Full offline CRUD (properties, leases, billing, admin) | Forbidden ([11](./11-offline-queue-design.md) non-goals) |
| Caching arbitrary authenticated GET APIs without per-route review | Forbidden in Phase 7 |
| Navigation IA redesign · role-home redesign · Command Center productization | Forbidden under this phase / separate packages |
| Schema migrations · provider swap / VAPID primary | Forbidden |
| Payments / Stripe / e-sign / auth mutations offline | Explicitly not allowlisted |

---

## 4. Dependencies

| Dependency | Role |
|------------|------|
| PMX-004 Approved with Amendments | Package SoT |
| Phase 1 Final PASS / Certified | Unified root-scope SW + offline composition substrate |
| Phases 2–6 Validated | Install / shell / standalone / UX / push preserved |
| M0 = GO | Program unlock |
| [11] Offline Queue Design | Binding offline architecture |
| UX-012 Slice A + B Validated | Token substrate for sync-status chrome |
| Existing allowlisted APIs (messaging · media · maintenance · inspections if present) | Sync targets — no new schema |
| CORE-003 Phase 7 eligibility | Program sequence (next PMX unit after Phase 6 Validated) |

**Does not depend on:** PMX-004 Phases 8–11 · UX-012 C–E · OPS-001 C–E · FIN-003 C–E · partner marketplace UI · new AUTH/COM slices.

---

## 5. Acceptance criteria (Phase 7) — P7-01 … P7-10

| ID | Criterion |
|----|-----------|
| **P7-01** | **Outbox foundation** — IndexedDB `mpa-outbox` (`items` · `blobs`) implemented per [11](./11-offline-queue-design.md); enqueue generates client UUID + idempotency key. |
| **P7-02** | **Allowlist enqueue** — at least maintenance note/comment and photo-attach (or documented equivalent allowlisted pair) can enqueue offline; endpoint map documented; unknown endpoints blocked. |
| **P7-03** | **Sync on reconnect** — airplane mode allowlisted submit → reconnect → **one** server entity (no silent drop) ([11](./11-offline-queue-design.md) §10 · A10). |
| **P7-04** | **Idempotency / double-submit** — automated or scripted double-delivery / retry tests PASS (no double-create for allowlisted paths) ([06](./06-acceptance-criteria.md) §3 Phase 7). |
| **P7-05** | **Triggers** — `online` + visibility fallback work; Background Sync registered when available; iOS (no Background Sync) still syncs on foreground online. |
| **P7-06** | **Sync status UI** — shell-level status when pending &gt; 0; detail sheet supports Retry / Discard (confirm); failures visible (never silent). |
| **P7-07** | **Non-allowlisted hygiene** — payments / e-sign / auth-org / Master Admin / bulk / destructive deletes show clear requires-connection (or equivalent) when offline. |
| **P7-08** | **Session / org safety** — logout with pending warns; outbox cleared on logout (confirm); org-mismatch items not synced cross-org. |
| **P7-09** | **Regression / non-negotiables** — Phases 1–6 SW/install/shell/standalone/UX/push preserved; OneSignal primary retained; Auth/Supabase/Stripe preserved; **no schema** / IA redesign under this authorize; package fail conditions not violated. |
| **P7-10** | **Documentation & scope** — implementation summary + validation evidence recorded; no Phases 8–11 · UX-C–E · OPS-C–E · FIN-C–E · marketplace UI / unauthorized workflows shipped under this authorize. |

Maps to package phase minimum: **A10 + double-submit tests PASS** ([06](./06-acceptance-criteria.md) §3).

---

## 6. Exit criteria (Validation)

Phase 7 exits **Validated** only when **all** are true:

1. Acceptance criteria **P7-01–P7-10** PASS.  
2. A10 satisfied — allowlisted offline submissions queue and sync without silent data loss.  
3. Double-submit / idempotency tests PASS for exercised allowlisted paths.  
4. Non-allowlisted offline actions blocked with clear messaging.  
5. Sync status UX evidenced (pending / syncing / failed).  
6. Phases 1–6 foundations not regressed; OneSignal primary preserved; no schema migrations.  
7. Documentation updated (implementation summary + validation report + board status).  
8. Governance recommendation recorded.  
9. Validation phrase recorded:

```
VALIDATE PMX-004 PHASE 7
```

Until Validation is recorded: PMX-004 Phases 8–11 · UX-012 C–E · OPS-001 C–E · FIN-003 C–E · partner marketplace UI remain subject to their own authorize phrases regardless of this authorize.

---

## 7. Remediation process (if Validation FAIL)

If `VALIDATE PMX-004 PHASE 7` results in **FAIL**:

1. **Preserve** the FAIL validation report (do not rewrite history).  
2. Document defects with severity and binding criterion IDs (P7-xx / A10).  
3. Produce a **remediation** record limited to fixing authorized Phase 7 defects — no scope expansion into Phases 8–11 · UX-012 C–E · OPS-001 C–E · FIN-003 · partner marketplace UI.  
4. Apply [07 — Rollback strategy](./07-rollback-strategy.md) Phase 7 guidance (disable outbox / sync UI if needed; preserve Phases 1–6).  
5. Re-run validation under phrase **`VALIDATE PMX-004 PHASE 7`** (or a clearly labeled re-run document) until **PASS** or gate owners halt.  
6. Other packages / later PMX phases stay locked until their own authorize phrases.

---

## 8. Deferred / outside Phase 7

| Item | Disposition |
|------|-------------|
| PMX-004 Phases 8–11 | Locked until each `AUTHORIZE PMX-004 PHASE …` |
| UX-012 Slices C–E | Locked until each `AUTHORIZE UX-012 SLICE …` |
| OPS-001 Slices C–E | Locked until each `AUTHORIZE OPS-001 SLICE …` |
| FIN-003 Phases C–E | Separate authorize |
| Certified partner marketplace UI | Separate authorize |
| Full offline CRUD / arbitrary GET cache | Deferred / forbidden in Phase 7 |
| Lighthouse ≥95 / premium APIs / pilot COMPLETE | Later phases |

---

## 9. Recommendation

| Field | Result |
|-------|--------|
| **Authorize Phase 7?** | ✅ **YES — AUTHORIZED** |
| **Begin implementation?** | ✅ **Eligible** in a dedicated implement session within this scope |
| **Validation?** | 🔒 Until `VALIDATE PMX-004 PHASE 7` |
| **Authorize Phases 8–11 / UX-C / OPS-C / FIN-C / marketplace UI?** | ❌ **NO** |

**Next:** Phase 7 ✅ **VALIDATED PASS** ([40](./40-phase-7-validation.md)). Phase 8 eligible for separate `AUTHORIZE PMX-004 PHASE 8` — not issued under this authorize.

---

## Sign-off

| Role | Decision | Date |
|------|----------|------|
| Governance / Product Owner authority | ✅ **AUTHORIZE PMX-004 PHASE 7** | 2026-07-26 |
| Implementation | ✅ **IMPLEMENTED** ([39](./39-phase-7-implementation.md)) | 2026-07-26 |
| Validation | ✅ **PASS** ([40](./40-phase-7-validation.md)) | 2026-07-26 |
