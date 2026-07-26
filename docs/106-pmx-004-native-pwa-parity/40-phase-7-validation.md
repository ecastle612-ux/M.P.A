# 40 — PMX-004 Phase 7 Validation

**Package:** PMX-004 — Native PWA Parity  
**Phase:** 7 — Offline Reliability  
**Authorization:** [38](./38-phase-7-authorization.md)  
**Implementation:** [39](./39-phase-7-implementation.md)  
**Offline SoT:** [11](./11-offline-queue-design.md)  
**Status:** ✅ **PASS**  
**Date:** 2026-07-26  
**Binding phrase (issued):**

```
VALIDATE PMX-004 PHASE 7
```

**Program record:** [CORE-003 §80](../113-core-003-implementation-master-plan/80-pmx-004-phase-7-validation.md)  
**Shipped implementation SHA (branch):** `52f1605` — *Implement PMX-004 Phase 7 offline reliability outbox.*

> Validation only. No application-code changes in this record.  
> Prior Phase 6 validation trail ([34](./34-phase-6-validation.md)–[37](./37-phase-6-validation-rerun-3.md)) preserved.  
> PMX-004 Phases 8–11 · UX-012 C–E · OPS-001 C–E · FIN-003 C–E · partner marketplace UI **not** authorized under this phrase.

---

## 1. Final determination

| Field | Result |
|-------|--------|
| **Phase 7 Validation** | ✅ **PASS** |
| **Phrase** | ✅ `VALIDATE PMX-004 PHASE 7` recorded (this document) |
| **Remediation required before PASS?** | ❌ **No** |
| **Phase 7 approved for program progression?** | ✅ **YES** — Phase 7 **Validated** |
| **A10 (allowlisted offline · no silent loss)** | ✅ Satisfied (code path + unit evidence) |
| **Double-submit tests** | ✅ **6/6 PASS** (`allowlist.test.ts` · `idempotency.test.ts`) |
| **Recommend `AUTHORIZE PMX-004 PHASE 8`?** | ✅ **Eligible** — subsequently **AUTHORIZED** ([41](./41-phase-8-authorization.md)) |
| **Begin Phase 8 / UX-C / OPS-C / FIN-C / marketplace?** | Phase 8 implement eligible under [41](./41-phase-8-authorization.md); UX-C / OPS-C / FIN-C / marketplace ❌ until each authorize |
| **Claim package COMPLETE?** | ❌ **NO** — Phase 11 gate |

---

## 2. Evidence method (this session)

| Method | Used |
|--------|------|
| Static review of commit `52f1605` vs [38](./38-phase-7-authorization.md) · [11](./11-offline-queue-design.md) | ✅ |
| Unit tests (`vitest` outbox suite) | ✅ **6/6 PASS** |
| Schema / migration scan of Phase 7 commit | ✅ None |
| Scope scan (Phases 8–11 · UX-C–E · OPS-C–E · FIN-C–E · marketplace) | ✅ Absent from commit |
| Live airplane-mode device run | ❌ Not run this session — P7-03 evidenced via reconnect/flush/idempotency code paths |

---

## 3. Acceptance criteria — P7-01 … P7-10

| ID | Criterion | Evidence | Result |
|----|-----------|----------|--------|
| **P7-01** | IndexedDB `mpa-outbox` (`items` · `blobs`); UUID + idempotency key | `db.ts` opens `mpa-outbox` v1 · stores `items`/`blobs` · indexes `by_org` · `by_idempotency` (unique) · `enqueue.ts` generates UUID keys | ✅ **PASS** |
| **P7-02** | Allowlist enqueue (notes + photo pair min); unknown blocked | Allowlist: messages · maintenance `action:update` · media intent · vendor photo · inspection `update_item`. Unit tests block create/complete/payments. Wired UI paths per [39](./39-phase-7-implementation.md) | ✅ **PASS** |
| **P7-03** | Reconnect sync → one entity · no silent drop | `OutboxProvider` `online` / visibility → `flushOutbox`; ok → `deleteOutboxItem`; network → stay `pending` with error; `Idempotency-Key` on flush | ✅ **PASS** |
| **P7-04** | Idempotency / double-submit tests PASS | Unique `by_idempotency` · enqueue returns existing active row · key stability tests · allowlist double-path guards · **6/6 PASS** | ✅ **PASS** |
| **P7-05** | Triggers: online · visibility · Background Sync wake | Provider listeners; `requestOutboxBackgroundSync` → SW `MPA_REQUEST_SYNC` → tag `mpa-outbox-sync` → `MPA_SYNC_REQUEST` (`sw-offline.js` preserved) | ✅ **PASS** |
| **P7-06** | Sync status UI · Retry / Discard · failures visible | `SyncStatusChip` Badge + Drawer · pending / syncing / failed / auth-pause · Retry · Discard confirm · Retry all · `@mpa/ui` Badge/Drawer/Button/EmptyState · `--mpa-*` tokens | ✅ **PASS** |
| **P7-07** | Non-allowlisted requires-connection | `isExplicitlyBlockedOffline` + default-deny allowlist; WO create / org switch / payments / MA / DELETE blocked with clear message | ✅ **PASS** |
| **P7-08** | Logout warn/clear · org isolation | `profile-menu` confirm + `clearEntireOutbox`; org switch blocked offline; flush skips cross-org | ✅ **PASS** |
| **P7-09** | Regression / non-negotiables | Commit scoped to Phase 7 outbox + wire-ups + docs; no schema; OneSignal SW path untouched; AUTH/COM/OPS/UX packages not modified in `52f1605` | ✅ **PASS** |
| **P7-10** | Docs & scope boundaries | [39](./39-phase-7-implementation.md) + this report; no Phases 8–11 · UX-C–E · OPS-C–E · FIN-C–E · marketplace · full offline CRUD · IA redesign | ✅ **PASS** |

**Score:** **10 / 10 PASS**

---

## 4. Detailed checks

### 4.1 IndexedDB outbox

| Check | Result |
|-------|--------|
| DB name `mpa-outbox` | ✅ |
| Stores `items` + `blobs` | ✅ |
| Org field + `by_org` index | ✅ |
| Durable persistence / reload recovery | ✅ IndexedDB + list on provider mount |
| Queue integrity (FIFO by `createdAt`) | ✅ `listFlushableOutboxItems` sort |
| Ack deletes item + blobs | ✅ `deleteOutboxItem` |

### 4.2 Allowlisted offline sync

| Workflow | Wired | Allowlisted |
|----------|-------|-------------|
| `message_send` | ✅ Conversation / tenant / owner inboxes | ✅ |
| `maintenance_notes` | ✅ Work order edit | ✅ |
| `maintenance_photo` | ✅ `MediaUpload` | ✅ |
| `vendor_photo` | ✅ Vendor job card | ✅ |
| `inspection_item` | ✅ Inspection run panel (`update_item`) | ✅ |
| Unauthorized CRUD (properties/leases/billing/admin) | ❌ Not queued | ✅ Blocked |

### 4.3 Sync status UI

| State / action | Evidence |
|----------------|----------|
| Pending | `Waiting to sync (N)` |
| Syncing | `Syncing…` |
| Success | Chip hidden when queue empty (status clears) |
| Failure | `Sync failed (N)` + per-item error |
| Retry | Per-item Retry · Retry all |
| UX-012 A/B tokens | `@mpa/ui` + `--mpa-*` only · no IA redesign |

### 4.4 Idempotency

| Check | Result |
|-------|--------|
| UUID / client key at enqueue | ✅ |
| `Idempotency-Key` header on flush | ✅ JSON · media · vendor |
| Duplicate enqueue protection | ✅ Unique index + `findByIdempotencyKey` |
| Retry-safe flush | ✅ Same key retained across attempts |
| FIFO | ✅ |
| Unit tests | ✅ **6/6 PASS** (2026-07-26 this session) |

### 4.5 Offline reliability

| Check | Result |
|-------|--------|
| Online reconnect resume | ✅ |
| Visibility resume | ✅ |
| Background Sync wake | ✅ `mpa-outbox-sync` |
| Logout warn / clear | ✅ |
| Offline org-switch protection | ✅ |
| Event Bus / schema | ✅ Untouched (no migrations in commit) |

### 4.6 Regression & boundaries

| Surface | Result |
|---------|--------|
| PMX Phases 1–6 | ✅ Preserved (SW/install/shell/standalone/UX/push not redesigned) |
| AUTH-001 | ✅ Unchanged in `52f1605` |
| COM-001 | ✅ Unchanged in `52f1605` |
| OPS-001 A–B | ✅ Unchanged in `52f1605` |
| UX-012 A–B | ✅ Tokens consumed only · slices C–E not shipped |
| Schema / breaking API | ✅ None |
| Phases 8–11 · marketplace · full offline CRUD · IA redesign | ✅ Not implemented |

---

## 5. Exit criteria roll-up ([38](./38-phase-7-authorization.md) §6)

| # | Criterion | Result |
|---|-----------|--------|
| 1 | P7-01–P7-10 PASS | ✅ |
| 2 | A10 satisfied | ✅ |
| 3 | Double-submit / idempotency tests PASS | ✅ |
| 4 | Non-allowlisted blocked clearly | ✅ |
| 5 | Sync status UX evidenced | ✅ |
| 6 | Phases 1–6 / OneSignal / no schema | ✅ |
| 7 | Docs updated (implement + validation + boards) | ✅ (this session) |
| 8 | Governance recommendation recorded | ✅ §6 |
| 9 | Phrase recorded | ✅ |

---

## 6. Recommendation

| Field | Result |
|-------|--------|
| **Approve Phase 7 as Validated?** | ✅ **YES** |
| **Remediation required?** | ❌ **None** |
| **Eligible to authorize Phase 8?** | ✅ **YES** — Performance Optimization becomes the next PMX authorize unit |
| **Issue `AUTHORIZE PMX-004 PHASE 8` in this session?** | ❌ **NO** — separate governance phrase required |
| **Authorize UX-012 C–E / OPS-001 C–E / FIN-003 C–E / marketplace?** | ❌ **NO** |

**Next:** Phase 8 ✅ **AUTHORIZED** ([41](./41-phase-8-authorization.md)). Dedicated implement session within §41 scope → `VALIDATE PMX-004 PHASE 8`.

---

## 7. Residual notes (non-blocking)

1. Live airplane-mode → reconnect device evidence was **not** re-run this session; reconnect/flush/idempotency paths are code-verified and unit-tested. Optional manual spot-check remains useful before pilot (Phase 11).  
2. Idempotency unit suite asserts key stability + allowlist guards; runtime dedupe is enforced by IndexedDB unique index (integration IDB test not required for PASS under Phase 7 minimum).  
3. Workflow type includes `form_draft` for design forward-compat; no unauthorized form-draft enqueue path is wired beyond allowlist match.

---

## Sign-off

| Role | Decision | Date |
|------|----------|------|
| Validation | ✅ **PASS** — `VALIDATE PMX-004 PHASE 7` | 2026-07-26 |
| Remediation | ❌ Not required | — |
| Phase 8 authorize | ✅ Subsequently issued ([41](./41-phase-8-authorization.md)) | 2026-07-26 |
