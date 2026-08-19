# 227 — SignWell Production Webhook Destination + Live Delivery

**Title:** SIGNWELL PRODUCTION WEBHOOK — EXACT CALLBACK + AUTHENTIC DELIVERY  
**Status:** **PASS — SIGNWELL PRODUCTION WEBHOOK CERTIFIED**  
**Date:** 2026-08-19  
**Authority:** Owner authorization — remediate the SignWell webhook destination to the exact designed Production callback and certify authentic SignWell delivery. A later Owner authorization permitted the minimum Production activity required to obtain **one authentic SignWell-originated webhook delivery**. **STOP after this record.**  
**Product boundary:** Lease e-signature webhook path only. Vendor / Facility Operations SignWell remains **NOT IMPLEMENTED / NOT ADVERTISED**.  
**Baseline:** [docs/226](../226-signwell-production-release-uat/index.md) remains the Sync + retrieval PASS for lease `51fb0ba8-…`. That PASS is **not** a webhook PASS and is not rewritten here.

This package does **not** start another feature, apply SEC-001 Stage 2, change Stripe/M5/July/pricing, send a real customer legal document, or expand SignWell beyond leases.

---

## Current verdict

**PASS — SIGNWELL PRODUCTION WEBHOOK CERTIFIED**

Part A below is the historical **BLOCKED** result after destination remediaiton and is preserved unchanged in meaning. Part B is the later Owner-authorized authentic-delivery run. Docs/226 remains Sync-driven. This PASS is only for the webhook-only synthetic document created under Part B.

---

## Historical verdict (Part A — preserved)

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

## STOP (Part A — historical)

The destination remediaiton package stopped here. Authentic delivery was **not** certified in Part A. The later Owner authorization and evidence are Part B below.

---

# Part B — Owner-authorized authentic delivery (2026-08-19)

**Authority:** Owner authorized (1) a SignWell dashboard resend/retry of the existing Completed docs/226 document if the dashboard exposed that capability; (2) **only if unavailable**, exactly one additional synthetic SignWell document on the isolated `SIGNWELL-UAT` test surface. SEC-001 Stage 2 remained unauthorized. No unrelated Production work.

## B.1 Re-established state (before further mutation)

| Check | Result |
|-------|--------|
| Live `www` deploy | `dpl_BejvXQvJ6gnqCh5ZNyX9sk3aL2yt` (`data-dpl-id`) |
| Deploy git SHA | `d48d46845e17d98af916b022249ce307a0c287f4` (docs/226 certification commit) |
| Last application-code SHA | `f13cfd56d06677a07396c0d8206eb39426100112` — webhook handler unchanged |
| Webhook destination | exactly `https://www.my-property-assistant.com/api/leasing/webhooks/signwell` |
| Active SignWell hooks | **1** |
| Production `SIGNWELL_WEBHOOK_ID` | corresponds to that hook id (value not published; id **is** the HMAC key) |
| Original docs/226 lease | `51fb0ba8-eb79-4902-a56d-e93c53fcd15f` still **active** / SignWell **Completed** / signed+activated `2026-08-18 23:10:03Z` |
| Original SignWell document | intact (`badd9aaa-…`, test mode, Completed) |
| `signwell_webhook_events` before fallback | **0** (Part A baseline). Authentic events arrived only after the fallback Send. |

No authentic event existed before the authorized fallback document. Dashboard resend was attempted first.

## B.2 Dashboard resend / retry

**Unavailable.**

| Attempt | Result |
|---------|--------|
| SignWell Production dashboard | Login wall at `/app/log_in/`. No operator Google session in this environment. Evidence: `/opt/cursor/artifacts/signwell_dashboard_login_wall.webp` (no secrets). |
| Official help “Update and Resend” | Forces a new signing request / copy. **Not used.** Would alter or re-issue the completed document. |
| `POST /documents/{orig}/remind` | **422** `The document is in a status that cannot be reminded` |
| Probed resend / retry / deliveries / replay paths | **404** HTML |

The original Completed document was not altered. The signer was not re-sent a signing request merely to simulate a webhook.

## B.3 Controlled fallback — exactly one additional synthetic document

Dashboard webhook resend could not produce an authentic delivery, so the Owner-authorized fallback ran **once**.

The original docs/226 resident could not be reused (`lease_id` already set; status not eligible for a second Send). Creating **one** isolated synthetic resident + **one** isolated synthetic lease on `SIGNWELL-UAT` was required by application constraints and is authorized solely for this webhook test.

| Artifact | Value | Distinction |
|----------|--------|-------------|
| Property | M.P.A. Demo Apartments `a11ce002-…0101` | same UAT/demo property |
| Unit | SIGNWELL-UAT `a11ce002-2026-4000-8000-00000000aa01` | not Unit 101 |
| Resident | SignWell Webhook UAT `28148270-a976-46fc-83f7-2186de214b9f` | plus-address `ecastle612+signwell-wh@…` — **not** the docs/226 resident |
| Lease | `448d2dba-e6a0-47ee-a48b-9d91485e081d` | webhook-only; **not** `51fb0ba8-…` |
| Rent | **$1.00** nominal synthetic | no real payment |
| SignWell document | `37366bdf-c534-438f-afc2-8dd27bc6ffbb` | test mode; one additional document |
| Send | HTTP **200** · `sent: true` · `requireManagerSignature: false` | manager countersign not required |

No real tenant. No real customer. No Unit 101. No Record signed offline. Original certified lease was not overwritten.

## B.4 Genuine signer completion

The new document was completed **in SignWell**, not by Sync and not by Record signed offline.

| Time (UTC) | Evidence |
|------------|----------|
| 16:03:14 | `document_created` persisted |
| 16:03:23 | `document_sent` persisted |
| 16:03:50–16:03:52 | `document_viewed` ×3 |
| 16:03:55 | `document_in_progress` |
| 16:04:08 | `document_signed` |
| 16:04:09.584 | **`document_completed`** persisted |
| 16:04:10.216 | lease `signed_at` / `activated_at` / `status=active` / `signwell_status=Completed` |
| 16:04:10.837 | `audit_events.lease.signed` **`actor_id` null** |
| 16:04:17.580 | `audit_events.lease.activated` **`actor_id` null** |

Docs/226 activation used actor `0e1fc6e4-…` (UAT PM Sync). This lease’s signed/activated audits are **null actor**, which is the webhook `activateSignedLease(..., actorId=null)` path.

Live SignWell GET: status **Completed**, recipient status **completed**, `test_mode=true`, metadata `lease_id` = the webhook-only lease. Sync was **not** invoked before these rows existed.

## B.5 Authentic SignWell delivery gate

SignWell itself POSTed to:

`https://www.my-property-assistant.com/api/leasing/webhooks/signwell`

Proof (not a local POST; not a locally generated HMAC; not Sync; not configuration-only):

| Gate | Result |
|------|--------|
| Delivery occurred | **8** rows in `signwell_webhook_events`, all for document `37366bdf-…` |
| Exact callback | Sole live hook callback is the designed URL |
| HTTP | Designed-route probes remain **400** (empty) / **401** (typed+unsigned). The handler upserts only after HMAC and returns **200** `{ ok: true, activated: true }` on `document_completed` success. Activation + null-actor audit occurred. SignWell continued the full created→completed lifecycle, which it does after **2xx**. Vercel request-log export was not available through the APIs usable in this environment. |
| HMAC | All **8** stored `event.hash` values (64-hex) recompute to the live hook id using `HMAC-SHA256(webhook_id, type@time)`. Production persisted them only after `verifySignWellWebhook`. Agent env `SIGNWELL_WEBHOOK_ID` is a placeholder and was **not** used to mint these hashes. |
| Expected document | Every row `document_id` = `37366bdf-…` = lease `signwell_document_id` |
| Lease selection | `.eq("signwell_document_id", documentId)` only. Original lease `badd9aaa-…` was not selected and not mutated. |
| Metadata | `lease_id` / `organization_id` present as **consistency checks**. They did not redirect to another lease. |
| Organization | All 8 rows `organization_id` = `a11ce002-0001-4000-8000-0000000000c2`. Clinic Demo events **0**. Other-org events **0**. |
| Persistence | Upsert succeeded. Unique `(event_type, document_id, event_id)`. No API keys / webhook ids / service-role material in payload columns. |

## B.6 Database persistence

| Item | Before fallback | After authentic delivery |
|------|-----------------|--------------------------|
| `signwell_webhook_events` count | **0** | **8** |
| Types | — | created 1, sent 1, viewed 3, in_progress 1, signed 1, **completed 1** |
| Unexpected duplicates | — | none beyond three distinct `document_viewed` event ids (SignWell sent three) |
| RLS | unchanged `signwell_webhook_events_manage` | **not** modified. Persistence succeeded with the existing service-role handler path. Pre-SEC-001 RLS did **not** block this run. |

SEC-001 Stage 2 was **not** applied.

## B.7 Correlation security

Primary lookup remains stored `signwell_document_id`. Metadata `lease_id` and `organization_id` are consistency checks only (`resolveSignWellLeaseCorrelation`). The authentic `document_completed` selected lease `448d2dba-…` because that is the only lease whose stored SignWell document id equals `37366bdf-…`. Docs/226 lease stayed on `badd9aaa-…`.

## B.8 Replay / idempotency

**Authentic initial delivery PASS; live authentic replay unavailable.**

After the successful completion event, SignWell still exposes **no** public retry/redelivery/replay API (`remind` **422**; resend/retry/deliveries/replay **404** HTML). Dashboard replay was not reachable (login wall). A locally signed replay was **not** manufactured.

Supporting in-repo evidence remains green: HMAC fail-closed, metadata-cannot-redirect, upsert idempotency, `activateSignedLease` already-active short-circuit.

## B.9 Completed-document regression (webhook-only lease)

Manager Documents GET `lease:448d2dba-…` **without** `syncSignWell`:

| Check | Result |
|-------|--------|
| HTTP | **200** |
| `signwellStatus` | **Completed** |
| Title | contains “Webhook” and “SIGNWELL-UAT” |
| `source` | `signwell` |
| External completed file | present (`hasExternal` / `externalUrl` on `www.signwell.com`; URL not published) |
| Signed PDF | official `completed_pdf` **200** · `application/pdf` · magic `%PDF-1.5` · 89,561 bytes |
| Indexed generated snapshot MIME | `text/plain` (on-page generated body — **not** the signed artifact; same distinction as docs/226) |

No second file store. No signed-file URL in this record.

## B.10 Cross-org denial

UAT Property Demo PM is **not** a Clinic Demo member. Same session + Clinic Demo `mpa_active_organization_id` against `lease:448d2dba-…` returns **403** `Forbidden` and no `externalUrl`.

## B.11 Occupancy / isolation

| Record | After completion |
|--------|------------------|
| Webhook lease | **active** · channel `signwell` · Completed · $1 · SIGNWELL-UAT · resident `28148270-…` |
| Docs/226 lease | **unchanged** active / Completed / signed `2026-08-18 23:10:03Z` |
| Webhook `lease_residents` | **1** occupying row created `2026-08-19 16:04:15Z` for SignWell Webhook UAT |
| Docs/226 `lease_residents` | **1** occupying row from `2026-08-18` (preserved) |
| SIGNWELL-UAT | **occupied** |
| Unit 101 | **occupied**, lease `a11ce002-…0401` updated `2026-08-14`, **no** SignWell id |
| UAT Tenant `…0301` | unchanged `updated_at` `2026-08-14` |
| Org SignWell leases | **exactly 2** (original + webhook-only) |

Two synthetic occupancies on SIGNWELL-UAT are intentional: the original certified lease was not overwritten. No duplicate occupancy on the webhook lease. No Unit 101 mutation. Records preserved (no hard-delete).

## B.12 Finance / Stripe

| Check | Result |
|-------|--------|
| Stripe Checkout | **none** for this package |
| Stripe SaaS / Connect / AutoPay | **no mutation**. Existing org AutoPay row is **revoked** on unrelated lease `…0401`, created `2026-08-17` |
| Tenant payment execution | **FALSE** on all orgs including UAT Property Demo and Clinic Demo |
| July freeze | **ON** (`finance_july_freeze_enabled` = true) |
| M5 / pricing | untouched |
| `financial_payments` on webhook lease | **0** |
| Expected activation side effect | one **$1** rent schedule + one **$1** open rent charge (same `activateSignedLease` behavior as docs/226). Not a payment. Not FIN-OPS feature work. |
| Stripe webhook events near this run | `customer.subscription.deleted` at **15:48–15:49Z**, **before** the 16:03 Send. Not caused by this document. |

## B.13 Tests / typecheck

No application source change was required for this UAT.

| Check | Result |
|-------|--------|
| Focused SignWell + webhook + document | **31 passed** (5 files) |
| Shared typecheck | Pass |
| Web typecheck | Pass |
| Changed-source lint | not required (docs only) |
| Production build | not required (no source change; live deploy already serving) |

## B.14 SEC-001 / deployments / code

| Item | Result |
|------|--------|
| SEC-001 Stage 2 | **UNAUTHORIZED / not applied** |
| Vercel WAF / Auth / leaked-password / operator MFA | **not changed** |
| Application code | **none** |
| Production deploy this run | **none** |
| Migrations this run | **none** |

## B.15 Exact Production mutations (Part B)

| Mutation | Result |
|----------|--------|
| Dashboard webhook resend of docs/226 document | **not available / not performed** |
| One synthetic resident SignWell Webhook UAT | created on SIGNWELL-UAT |
| One synthetic lease `448d2dba-…` | created; original `51fb0ba8-…` preserved |
| One SignWell document `37366bdf-…` | created + sent + genuinely completed |
| Authentic SignWell POSTs | 8 events persisted; completion activated the webhook lease |
| Record signed offline / Sync before webhook | **not used** |
| Additional SignWell documents after the one fallback | **0** |
| SEC-001 / Stripe / July / M5 / pricing | **none** |

## B.16 Final verdict

**PASS — SIGNWELL PRODUCTION WEBHOOK CERTIFIED**

An authentic SignWell-originated POST reached `https://www.my-property-assistant.com/api/leasing/webhooks/signwell`, authenticated with the live hook HMAC, correlated by `signwell_document_id` to the webhook-only synthetic lease, persisted, and activated that lease. Docs/226 remains Sync-driven.

---

## STOP

Do not start another feature.  
Do not deploy SEC-001 Stage 2.  
Do not expand SignWell beyond leases.  
Do not send a real customer’s legal document.  
Do not create another SignWell document.  
Do not modify Stripe/payment behavior.  
Do not enable M5.  
Do not unfreeze July.  
Do not change pricing.  
Return control to the Owner for the next authorization.
