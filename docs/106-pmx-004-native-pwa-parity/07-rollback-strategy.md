# 07 — Rollback Strategy

**Package:** PMX-004  
**Status:** Draft — Ready for Approval  

---

## 1. Principles

1. Prefer **feature flags / env switches** over irreversible deletes.  
2. Service worker rollbacks must address **already-installed clients**, not only server files.  
3. Push integrity beats offline during an emergency (CP-003 lesson).  
4. Every phase PR lists its rollback steps in the PR body.

---

## 2. Emergency kill switches

| Switch | Effect |
| --- | --- |
| Revert worker to OneSignal-only `importScripts` (remove `/sw-offline.js`) | Restores pre-PMX-004 push-safe worker; offline lost again |
| `NEXT_PUBLIC_PWA_ONBOARDING=0` (or equivalent) | Hides install onboarding |
| `NEXT_PUBLIC_PWA_OUTBOX=0` | Disables offline mutation queue; passthrough online-only |
| Deploy previous Vercel deployment | App code rollback |

---

## 3. Phase rollbacks

### Phase 1 — Unified SW

**Symptom:** players=0, enrollment timeouts, push fail.

**Actions:**

1. Immediately ship `OneSignalSDKWorker.js` that **only** imports OneSignal CDN SW (remove offline importScripts).  
2. Confirm dashboard still uses `/OneSignalSDKWorker.js` scope `/`.  
3. Ask affected users to revisit site once (controller change).  
4. If clients stuck: document Clear site data / unregister SW as last resort.  
5. Re-open Phase 1 design; do not proceed Phases 6–7.

**Symptom:** Stale JS after deploy (SH-003).

**Actions:** Ensure network-first for `/_next/static`; bump cache name; force update prompt.

### Phase 2 — Onboarding

Disable via flag; remove sheet mount. No SW impact.

### Phase 3 — Shell meta

Revert `viewport` / metadata exports; CSS safe-area utilities can remain (low risk) or revert.

### Phase 4 — Standalone

Feature-flag in-app viewer; restore prior `target="_blank"` only if viewer broken (acceptance: temporary Accepted exit).

### Phase 5 — UX polish

Revert CSS/component size changes selectively; no data impact.

### Phase 6 — Push cert

Ops-only; no code rollback unless deep-link bugs introduced — revert link builder.

### Phase 7 — Outbox

1. Set outbox flag off.  
2. Flush or export pending outbox to user-visible “failed to sync” list before wipe.  
3. **Never** delete IndexedDB pending items without user acknowledgment if uploads are irreplaceable (photos).

### Phase 8 — Performance

Revert dynamic import boundaries that break routes; keep analyzer artifacts.

### Phase 9 — Premium

Feature-detect already; remove shortcut entries from manifest if harmful.

### Phase 10

N/A (validation).

---

## 4. Client recovery runbook (support)

1. Confirm app URL (`www` vs apex).  
2. Check Notification permission + OneSignal subscription via Master Admin diagnostics.  
3. If SW stuck: Chrome → Site settings → clear data; iOS: remove Home Screen icon and re-A2HS after fix.  
4. Re-enroll push from Settings.  
5. File incident with SW version stamp from diagnostics.

---

## 5. Data safety

PMX-004 introduces **no** new server tables. Worst client data risk is outbox loss — mitigated by never auto-wiping without UI confirm and by keeping blobs until server ACK.
