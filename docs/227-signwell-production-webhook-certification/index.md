# 227 — SignWell Production Webhook Destination + Live Delivery

**Title:** SIGNWELL PRODUCTION WEBHOOK — EXACT CALLBACK + AUTHENTIC DELIVERY  
**Status:** **BLOCKED — SIGNWELL PRODUCTION WEBHOOK**  
**Date:** 2026-08-19  
**Authority:** Owner authorization — remediate the SignWell webhook destination to the exact designed Production callback and certify authentic SignWell delivery. **STOP after this record.**  
**Product boundary:** Lease e-signature webhook path only. Vendor / Facility Operations SignWell remains **NOT IMPLEMENTED / NOT ADVERTISED**.  
**Baseline:** [docs/226](../226-signwell-production-release-uat/index.md) remains the Sync + retrieval PASS. That PASS is **not** a webhook PASS.

This package does **not** start another feature, apply SEC-001 Stage 2, change Stripe/M5/July/pricing, send a real customer legal document, or expand SignWell beyond leases.

---

## Verdict

**BLOCKED — SIGNWELL PRODUCTION WEBHOOK**

Pre-change inspection proved the live SignWell hook used the **wrong path** on the correct Production host. Application code already implements the designed route and fail-closed HMAC. No application-code remediaiton was required.

The destination was corrected in SignWell configuration to exactly:

`https://www.my-property-assistant.com/api/leasing/webhooks/signwell`

That is **not** a webhook PASS. SignWell’s public API has **no** update-hook and **no** resend/replay facility. Reminding the existing Completed document returns 422. Creating another SignWell document was **not** authorized by this package.

`signwell_webhook_events` remains **0**.

**Single next Owner action (do not do this without authorization):**

1. Preferred: if the SignWell dashboard can resend the existing Completed document’s webhook to the now-correct callback, authorize that resend only; or  
2. Authorize **one** additional controlled synthetic SignWell document on the **existing** SIGNWELL-UAT unit / SignWell UAT Resident (not Unit 101, not a real customer), so SignWell can POST an authentic `document_completed` to the designed route.

Do **not** treat a locally HMAC-signed POST as a PASS.

**STOP.** No SEC-001. No other feature.

---

## 1. Certification record

This file. Docs **226** is unchanged in meaning: Sync + retrieval certified; webhook delivery was unproven. **227** is the next unique number.

## 2. Tested Production SHA / deployment

| Item | Value |
|------|--------|
| Application SHA that first served retrieval | `f13cfd56d06677a07396c0d8206eb39426100112` |
| Config-only deploy after hook HMAC id rotation | `dpl_BejvXQvJ6gnqCh5ZNyX9sk3aL2yt` (`data-dpl-id` on `www`) |
| Inspector | `https://vercel.com/ecastle612-uxs-projects/m-p-a-web/BejvXQvJ6gnqCh5ZNyX9sk3aL2yt` |
| Prior live deploy | `dpl_66aVf8yem6ZmCAst8x3GMKAi6Zdp` |

No SignWell handler source changed. The config-only deploy loads the new hook id into `SIGNWELL_WEBHOOK_ID`.

## 3. Pre-change webhook destination

Authoritative `GET https://www.signwell.com/api/v1/hooks` (1 hook):

`https://www.my-property-assistant.com/api/webhooks/signature/signwell`

No query string. No token in the URL. Host was Production `www`. Path was **not** the designed route.

## 4. Root cause

**Incorrect SignWell webhook callback path.**

Evidence:

| Check | Result |
|-------|--------|
| Designed route in repo | `POST /api/leasing/webhooks/signwell` exists (`apps/web/src/app/api/leasing/webhooks/signwell/route.ts`) |
| Configured SignWell path | `/api/webhooks/signature/signwell` |
| Repo match for configured path | **none** |
| Live POST to configured path (empty JSON) | **200 HTML** app shell (`data-dpl-id` of then-live deploy) — not the webhook JSON handler |
| Live POST to designed path (empty JSON) | **400** `Invalid SignWell payload` |
| Live POST to designed path (typed event, unsigned) | **401** `Invalid webhook signature` |
| Middleware entitlement for designed path | `requiredEntitlementForApiPath` returns **null** (HMAC owns the route; no session required) |
| Official SignWell hook API | list / create / delete only — **no update** |

SignWell could receive HTTP 200 from the stale path and treat delivery as successful, so it would not retry. M.P.A. never persisted an event.

Not the cause: wrong domain, missing designed route, entitlement block on the designed route, or a need to weaken HMAC.

## 5. Exact remediaiton

SignWell configuration only (plus Production env so HMAC matches the new hook id):

1. `POST /api/v1/hooks` with `callback_url` = designed URL → **201**, exact match.  
2. Production `SIGNWELL_WEBHOOK_ID` updated to the new hook id (value not published). Create-hook is the only official way to change a callback; the new hook has a new id, which **is** the HMAC key.  
3. Config-only Production deploy `dpl_BejvXQvJ6gnqCh5ZNyX9sk3aL2yt` so serverless reads the new id.  
4. `DELETE /api/v1/hooks/{stale}` → **204**.  

HMAC verification, `signwell_document_id`-only correlation, isolation, and upsert idempotency were **not** changed.

## 6. Post-change webhook destination

`GET /api/v1/hooks` now returns **1** hook:

`https://www.my-property-assistant.com/api/leasing/webhooks/signwell`

Exact designed match. Unsigned POST still **401**.

## 7. Authentic SignWell delivery result

**Not obtained.** Official docs list no resend. Probed document/hook retry paths returned 404 HTML. `POST /documents/{id}/remind` on the existing Completed document returned **422** (`The document is in a status that cannot be reminded`). Creating the corrected hook did not persist a row. A self-signed Production POST was **not** used.

## 8. HTTP response result

No authentic SignWell POST was observed on the designed route after remediaiton. Unsigned probe: **401**.

## 9. Signature / HMAC verification result

In-repo fail-closed tests remain green. Live designed route rejects unsigned/malformed payloads (**400** / **401**) before persistence. Authentication was **not** weakened.

## 10. `signwell_document_id` correlation result

In-repo certified (docs/225 / existing webhook tests). Lookup remains `.eq("signwell_document_id", documentId)` only. Metadata mismatch still returns `unmatched` and does not activate. **Not live-exercised.**

## 11. Organization / isolation result

Existing lease remains org `a11ce002-0001-4000-8000-0000000000c2`. Clinic Demo Documents GET still **403** (retrieval regression). Webhook isolation not live-exercised.

## 12. Event persistence result

`signwell_webhook_events` = **0**. RLS remains enabled (`signwell_webhook_events_manage`). SEC-001 Stage 2 was **not** applied. Anonymous/client write certification of a live row is **not** possible with zero events.

## 13. Replay / idempotency result

**Not live-exercised** (no authentic first delivery). In-repo upsert + `activateSignedLease` idempotency unchanged.

## 14. Lease / occupancy convergence result

Existing lease unchanged: `active` / SignWell `Completed` / signed + activated `2026-08-18 23:10:03Z`. Leases with a SignWell id = **1**. No new occupancy.

## 15. Completed-document regression result

**Pass.** After the config-only deploy, Documents GET for the existing lease still returns `hasExternal=true`, `signwellStatus=Completed`, title contains SIGNWELL-UAT.

## 16. Cross-org / RBAC result

Unchanged from docs/226. No second org webhook retrieve. FO technician still has no `pm.leasing:*`. Webhook route remains HMAC-only (no session).

## 17. Finance / Stripe result

No Stripe, Connect, Checkout, AutoPay, M5, July, or pricing mutation. No new `financial_payments` expected or created by this package.

## 18. Code changes

**None.** Application webhook handler, HMAC, and correlation were already correct.

## 19. Production deployment

Config-only: `dpl_BejvXQvJ6gnqCh5ZNyX9sk3aL2yt` to load rotated `SIGNWELL_WEBHOOK_ID`. No application source change.

## 20. Migrations

**NONE.** SEC-001 Stage 2 **not** applied.

## 21. Tests / typecheck / lint / build

| Check | Result |
|-------|--------|
| Focused SignWell + webhook + document | **31 passed** |
| Shared typecheck | Pass |
| Web typecheck | Pass |
| Changed-source lint | Pass (no source change) |
| Production build | 204 pages on the config-only deploy |
| Pre-existing | `tenant-portal-billing-copy.test.ts` snake_case — **not hidden** |

No local rebuild was required beyond the Vercel deploy that already compiled 204 pages.

## 22. P0 remaining

**0.**

## 23. P1 remaining

| ID | Finding |
|----|---------|
| P1-WH-01 | Authentic SignWell POST to the designed callback has **never** been persisted |
| P1-WH-02 | SignWell cannot resend the historical Completed event through the public API |

P1-UAT-04 (wrong callback path) is **closed** by configuration. Docs/226 P1-UAT-05 remains open until live delivery.

## 24. P2 deferred

Unchanged: env **names** in the client bundle; test-mode default; unused `SIGNWELL_MODE`; no reminder/cancel/resend product features. Null-`organization_id` RLS on `signwell_webhook_events` stays with SEC-001 (not this package).

## 25. Exact Production mutations performed

| Mutation | Result |
|----------|--------|
| SignWell create hook (designed URL) | **201** · exact callback |
| Vercel Production `SIGNWELL_WEBHOOK_ID` | updated to the new hook id |
| Production deploy | `dpl_BejvXQvJ6gnqCh5ZNyX9sk3aL2yt` · config-only |
| SignWell delete stale hook | **204** · leftover wrong path removed |
| New lease / new SignWell document | **None** |
| Record signed offline | **Not used** |
| SEC-001 / WAF / Auth / MFA | **None** |
| Stripe / July / M5 / pricing | **None** |

## 26. Final verdict

**BLOCKED — SIGNWELL PRODUCTION WEBHOOK**

Destination remediaiton is done. Authentic SignWell delivery is **not** certified. Configuration correctness alone is not a PASS. Sync success is not a webhook PASS. A locally fabricated POST is not a webhook PASS.

---

## STOP

Do not start another feature.  
Do not create another SignWell document until the Owner authorizes it.  
Do not deploy SEC-001 Stage 2.  
Do not expand SignWell beyond leases.  
Do not send a real customer’s legal document.  
Do not modify Stripe/payment behavior.  
Do not enable M5.  
Do not unfreeze July.  
Do not change pricing.  
Return control to the Owner.
