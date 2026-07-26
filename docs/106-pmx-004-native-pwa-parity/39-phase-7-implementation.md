# 39 — PMX-004 Phase 7 Implementation Summary

**Package:** PMX-004  
**Phase:** 7 — Offline Reliability  
**Authorization:** [38](./38-phase-7-authorization.md) · [CORE-003 §78](../113-core-003-implementation-master-plan/78-pmx-004-phase-7-authorization.md)  
**Status:** ✅ **IMPLEMENTED** · Validation 🔒 until `VALIDATE PMX-004 PHASE 7`  
**Date:** 2026-07-26  

> Phases 8–11 **not** implemented. UX-012 C–E · OPS-001 C–E · FIN-003 C–E · partner marketplace UI **not** touched.  
> Phases 1–6 preserved. OneSignal primary preserved. **No schema migrations.**  
> Design SoT: [11 — Offline Queue Design](./11-offline-queue-design.md).

---

## 1. Deliverables completed

| Area | Result |
|------|--------|
| IndexedDB outbox | `mpa-outbox` DB · `items` + `blobs` stores · org-scoped · durable across reload |
| Allowlisted sync | Messages · maintenance note updates · media photo · vendor photo · inspection checklist item responses |
| Sync engine | Page-driven FIFO flush · online/visibility · SW Background Sync wake · multi-tab lock |
| Sync status UI | Shell chip + Drawer detail (Retry / Discard) · UX-012 Badge/Drawer tokens |
| Idempotency | UUID `Idempotency-Key` per item · enqueue dedupe by key · double-submit tests |
| Logout / org safety | Logout warns + clears queue · org switch blocked offline · cross-org items skipped on flush |
| Non-allowlisted | Requires-connection messaging for create WO / payments / auth / MA / deletes |

---

## 2. Architecture

```
Client (page)
  lib/pwa/outbox/
    db.ts            IndexedDB mpa-outbox
    allowlist.ts     endpoint → workflow map
    enqueue.ts       queue JSON / media / vendor photo
    offline-fetch.ts online fetch OR enqueue
    sync-engine.ts   FIFO flush + conflict/auth/network handling
  components/pwa/
    outbox-provider.tsx   online / visibility / MPA_SYNC_REQUEST listeners
    sync-status-chip.tsx  Badge + Drawer

Service Worker (Phase 1 preserved)
  sw-offline.js
    MPA_REQUEST_SYNC → register sync tag mpa-outbox-sync
    sync event → postMessage MPA_SYNC_REQUEST (page flushes; SW holds no tokens)
```

---

## 3. Files changed (primary)

### New
- `apps/web/src/lib/pwa/outbox/types.ts`
- `apps/web/src/lib/pwa/outbox/db.ts`
- `apps/web/src/lib/pwa/outbox/allowlist.ts`
- `apps/web/src/lib/pwa/outbox/allowlist.test.ts`
- `apps/web/src/lib/pwa/outbox/enqueue.ts`
- `apps/web/src/lib/pwa/outbox/offline-fetch.ts`
- `apps/web/src/lib/pwa/outbox/sync-engine.ts`
- `apps/web/src/lib/pwa/outbox/org.ts`
- `apps/web/src/lib/pwa/outbox/index.ts`
- `apps/web/src/lib/pwa/outbox/idempotency.test.ts`
- `apps/web/src/components/pwa/outbox-provider.tsx`
- `apps/web/src/components/pwa/sync-status-chip.tsx`

### Wired
- `apps/web/src/lib/pwa/sw-client.ts` — `requestOutboxBackgroundSync`
- `apps/web/src/components/shell/authenticated-context-providers.tsx` — `OutboxProvider`
- `apps/web/src/components/shell/top-navigation.tsx` — `SyncStatusChip`
- `apps/web/src/components/portal/portal-shell.tsx` — `SyncStatusChip`
- `apps/web/src/components/messaging/conversation-view.tsx` — offline message send
- `apps/web/src/components/messaging/tenant-messages-inbox.tsx` — offline reply
- `apps/web/src/components/portal/owner-messages-inbox.tsx` — offline reply
- `apps/web/src/components/maintenance/work-order-form.tsx` — offline edit/update queue; create blocked offline
- `apps/web/src/components/media/media-upload.tsx` — offline photo queue
- `apps/web/src/components/vendor-jobs/vendor-job-card.tsx` — offline vendor photo queue
- `apps/web/src/components/facility/inspection-run-panel.tsx` — offline checklist item responses; start/complete/add blocked offline
- `apps/web/src/components/shell/profile-menu.tsx` — logout warn + clear outbox
- `apps/web/src/components/shell/organization-context.tsx` — org switch blocked offline

### Docs
- This summary · [CORE-003 §79](../113-core-003-implementation-master-plan/79-pmx-004-phase-7-implementation.md)

---

## 4. Allowlisted operations (v1)

| Workflow | Offline behavior |
|----------|------------------|
| `message_send` | Queue `POST /api/messaging/threads/:id/messages` |
| `maintenance_notes` | Queue `PATCH /api/maintenance/:id` with `action: "update"` |
| `maintenance_photo` | Queue blob + intent metadata → sync rebuilds intent → PUT → confirm |
| `vendor_photo` | Queue FormData `file` to `/api/vendor-jobs/:token/photo` |
| `inspection_item` | Queue `PATCH /api/facility/inspections/:id` with `action: "update_item"` |

**Blocked offline (examples):** WO create · payments · e-sign · auth · org switch · Master Admin · DELETE · bulk import.

---

## 5. Queue processing

1. Enqueue → `pending` + `Idempotency-Key`  
2. Triggers: `online` · `visibilitychange` · SW `MPA_SYNC_REQUEST` · manual Retry  
3. One active flush per tab (BroadcastChannel lock)  
4. FIFO · org match required  
5. Outcomes: ok → delete · 409/422 → `failed` · network → stay `pending` · 401 → pause for re-auth  

---

## 6. Sync status UI

- Hidden when queue empty  
- Chip: Waiting to sync (N) / Syncing… / Sync failed (N) / Sign in to sync  
- Drawer: list · Retry · Discard (confirm) · Retry all  
- Tokens: `@mpa/ui` Badge · Drawer · Button · EmptyState  

---

## 7. Idempotency strategy

- UUID per outbox item at enqueue  
- Sent as `Idempotency-Key` on every retry  
- `by_idempotency` unique index prevents duplicate active rows for the same key  
- Unit tests: allowlist + key stability (`allowlist.test.ts` · `idempotency.test.ts`) — **6/6 PASS**

---

## 8. Remaining PMX Phases 8–11 (locked)

| Phase | Status |
|-------|--------|
| 8 — Performance Optimization | 🔒 Locked |
| 9 — Premium Native Features | 🔒 Locked |
| 10 — Production Validation | 🔒 Locked |
| 11 — Real-World Pilot / COMPLETE | 🔒 Locked |

Also locked: UX-012 C–E · OPS-001 C–E · FIN-003 C–E · partner marketplace UI.

---

## 9. Tests

- `allowlist.test.ts` — ✅ PASS  
- `idempotency.test.ts` — ✅ PASS  

---

## 10. Recommendation

1. ✅ Phase 7 implementation complete within authorized scope.  
2. ✅ Proceed to dedicated session → **`VALIDATE PMX-004 PHASE 7`**.  
3. ❌ Do **not** authorize or implement Phase 8+ / UX-C / OPS-C / FIN-C / marketplace under this work.

---

## Sign-off

| Role | Decision | Date |
|------|----------|------|
| Implementation | ✅ **IMPLEMENTED** (this document) | 2026-07-26 |
| Validation | 🔒 Pending `VALIDATE PMX-004 PHASE 7` | — |
