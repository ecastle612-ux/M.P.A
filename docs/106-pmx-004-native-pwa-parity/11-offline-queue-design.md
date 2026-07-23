# 11 — Offline Queue Design

**Package:** PMX-004 · Phase 7  
**Status:** Draft — Ready for Approval  
**Constraint:** **No database schema changes.** Client IndexedDB outbox + existing APIs.

---

## 1. Goals

1. Never silently lose allowlisted user submissions made offline.  
2. Automatically sync when connectivity returns.  
3. Show sync status.  
4. Avoid double-submit.  
5. Do not pretend the whole product works offline.

---

## 2. Non-goals

- Full offline CRUD for properties, leases, billing, admin  
- Conflict-free multi-device editing OT  
- Caching arbitrary authenticated GET APIs in Phase 7 without per-route review  

---

## 3. Allowlist (v1)

| Workflow | Offline behavior | Sync |
| --- | --- | --- |
| Maintenance request notes / comments | Queue text | Existing message/comment API |
| Maintenance / vendor photo attach | Queue blob + metadata | Existing media upload API (API-002A) |
| Inspection checklist item responses | Queue field patches | Existing inspection APIs (if present); else defer item |
| Message draft send | Queue outbound body | Messaging send API |
| Simple form drafts (explicitly tagged) | Queue | Endpoint map in code allowlist |

**Not allowlisted (show requires-connection):**

- Payments / Stripe  
- Lease e-sign  
- Org switch / auth  
- Master Admin mutations  
- Bulk imports  
- Destructive deletes (unless explicitly added later)

Exact endpoint map is finalized in Phase 7 implement notes; unknown endpoints default to **block offline**.

---

## 4. Data model (IndexedDB)

Database: `mpa-outbox` (versioned).

### Store: `items`

| Field | Type | Notes |
| --- | --- | --- |
| id | string (uuid) | Client id |
| idempotencyKey | string | Sent as header/`Idempotency-Key` when API supports; else body field |
| createdAt | number | |
| updatedAt | number | |
| status | `pending` \| `syncing` \| `failed` \| `acked` | |
| method | `POST` \| `PATCH` \| `PUT` | |
| url | string | Same-origin path |
| headers | object | Auth via cookies; do not store tokens |
| bodyType | `json` \| `form` \| `multipart-meta` | |
| body | json \| reference | |
| blobKeys | string[] | Keys into `blobs` store |
| error | string? | Last error |
| attempts | number | |
| workflow | string | Allowlist tag |

### Store: `blobs`

| Field | Type |
| --- | --- |
| key | string |
| blob | Blob |
| mime | string |
| name | string |

Acked items deleted after successful sync (blobs too).

---

## 5. Sync engine

Triggers:

1. `window` `online`  
2. `visibilitychange` → visible + online  
3. SW `sync` event tag `mpa-outbox-sync` (Chromium)  
4. Manual “Retry” in UI  

Algorithm:

```
for item in pending (FIFO):
  mark syncing
  rebuild Request (multipart if blobs)
  fetch with idempotencyKey
  if ok → acked → delete
  if 409/422 conflict → failed + user message (no auto wipe)
  if network error → pending + backoff
  if 401 → pause queue; prompt re-auth
```

Concurrency: **one active sync** at a time per tab; BroadcastChannel coordinate multi-tab.

---

## 6. UI

| Element | Behavior |
| --- | --- |
| SyncStatus chip | Hidden when 0 pending; else “Waiting to sync (N)” / “Syncing…” / “Sync failed” |
| Detail sheet | List pending items; Retry / Discard (confirm) |
| Optimistic UI | Allowed only if clearly marked Pending; reconcile on ack |

Placement: shell-level (PM + relevant portals), non-blocking.

---

## 7. Service worker role

- `sw-offline.js` registers Background Sync when client posts `MPA_REQUEST_SYNC`.  
- On `sync`, notify clients via `postMessage` to run sync engine **in page** (easier auth cookies) — SW does not hold user session tokens.  
- Alternative: SW fetch with `credentials: 'include'` for same-origin — validate carefully; prefer page-driven sync for v1.

**v1 recommendation:** Page-driven sync; SW only wakes clients via sync event / skipWaiting unrelated.

---

## 8. Idempotency

1. Generate UUID per outbox item at enqueue time.  
2. Send on every retry.  
3. Where server lacks idempotency, document risk and prefer safer endpoints first (uploads with stable client media ids if available).  
4. Test double-delivery scenarios in Phase 7.

---

## 9. Privacy / security

- Outbox may contain PII and photos on device — expected for offline.  
- Clear outbox on logout (with confirm if pending &gt; 0).  
- Do not sync cross-org: include org context in item; drop if org mismatch on resume.

---

## 10. Acceptance

- [ ] Airplane mode allowlisted photo + note → reconnect → one server entity  
- [ ] Kill browser mid-pending → reopen → sync  
- [ ] Non-allowlisted action blocked with message  
- [ ] Logout with pending warns user  
- [ ] iOS (no Background Sync) still syncs on foreground online  
