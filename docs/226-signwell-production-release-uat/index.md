# 226 — SignWell Lease E-Signature Production Release + Controlled UAT

**Title:** SIGNWELL LEASE E-SIGNATURE — PRODUCTION RELEASE + CONTROLLED END-TO-END UAT  
**Status:** **PASS — SIGNWELL PRODUCTION END-TO-END UAT CERTIFIED**  
**Date:** 2026-08-18 (retrieval remediaiton on the existing lease)  
**Authority:** Owner authorization — deploy the certified docs/225 remediation; perform one controlled synthetic Production lease-signing lifecycle; then authorize the smallest no-migration completed-file mapping and one Production deploy of that remediaiton. **STOP after this record.**  
**Product boundary:** Lease e-signature only. Vendor / Facility Operations SignWell remains **NOT IMPLEMENTED / NOT ADVERTISED**.  
**Baseline:** [docs/224](../224-final-human-onboarding-simulation/index.md) · [docs/225](../225-signwell-documents-full-functionality-audit/index.md)

This package does **not** start another feature, change Stripe/M5/July/pricing, send a real customer legal document, or expand SignWell beyond leases.

---

## Verdict

**PASS — SIGNWELL PRODUCTION END-TO-END UAT CERTIFIED**

The **same** synthetic lease proved genuine SignWell **Completed**, M.P.A. activation through the certified **Sync** path, and completed-document retrieval through the existing Documents `externalUrl` / **Open external file** control. Record signed offline was **not** used. No second lease or second SignWell document was created. No SEC-001 mutation.

Webhook delivery was **not** observed (`signwell_webhook_events` = 0). That is **not** a webhook PASS. Sync is the certified completion path. Do not describe Sync as webhook success.

Do **not** claim `SIGNWELL DOCUMENTS PRODUCTION END-TO-END FUNCTIONAL — READY FOR REAL USERS`. Remaining P1: webhook never arrived, and the live SignWell hook host matches Production `www` but the callback path is **not** the exact designed route.

**STOP.** No SEC-001. No other feature. Do not send a real customer document.

---

## 1. Certification record

This file. Docs line 221 → 225 unchanged in meaning. **226** is the next unique number.

## 2. Deployed SHA

`f13cfd56d06677a07396c0d8206eb39426100112`  
Contains docs/225 remediations plus UAT remediations:

- `2750adc8` — PostgREST `pm_residents!resident_id` embed hint (no migration)
- `da41ece4` — SignWell upload wraps generated text as **HTML** (SignWell create-document rejects `.txt` with 422)
- `42616148` — completed SignWell PDF URL maps to Documents `externalUrl` (`completed_pdf?url_only=true`)
- `f13cfd56` — same mapping on the indexed Documents row the manager list actually opens

## 3. Deployment ID

Live `www.my-property-assistant.com`: **`dpl_66aVf8yem6ZmCAst8x3GMKAi6Zdp`** (`data-dpl-id` confirmed)  
Inspector: `https://vercel.com/ecastle612-uxs-projects/m-p-a-web/66aVf8yem6ZmCAst8x3GMKAi6Zdp`  
Also aliased: `m-p-a-web.vercel.app`  
Prior remediaiton deploy (lease-id detail only): `dpl_DXWA8jhhYc5HcDk4FZSy9y3ga75b`  
Prior HTML-upload deploy: `dpl_6wSaCYZ7bH6jbBu8Lh6kLyFPUsNB`  
Prior embed-hint deploy: `dpl_4ZJAoyQWdcpF73u8CH9RHVGGduq5`  
Docs/225-only deploy: `dpl_HZL1bktWfaHE6E94Pe4n62J6Vy2q`

## 4. Migration result

**NONE.** No new SignWell or leasing migration. Embed hint, HTML wrap, and completed-PDF mapping are application-only.

## 5. Production SignWell config status

Report only configured / missing / invalid / cannot verify safely. No secret values.

| Name / item | Status | Notes |
|-------------|--------|-------|
| `SIGNWELL_API_KEY` | **configured** (Vercel Production, Hidden) | Present and usable in this agent after Owner secret entry |
| `SIGNWELL_WEBHOOK_ID` | **configured** (Vercel Production, Hidden) | Still placeholder in this agent; HMAC live replay was not forged |
| `SIGNWELL_TEST_MODE` | **missing** | App defaults to **test mode** (`!== "false"`) |
| `SIGNWELL_MODE` / `SIGNWELL_ALLOW_SIMULATE` | configured | **Unused** by current code |
| Webhook destination in SignWell | **configured / invalid** | 1 hook; host is Production `www.my-property-assistant.com`; **exact designed path match = 0** |
| Designed M.P.A. route | `https://www.my-property-assistant.com/api/leasing/webhooks/signwell` | Live callback URL is not published here |
| API credentials server-only | **configured** as intended | Client bundle has **names only** (known P2) |

## 6. Synthetic org / property / unit / resident / lease

| Row | Identity |
|-----|----------|
| Org | M.P.A. UAT Property Demo `a11ce002-0001-4000-8000-0000000000c2` · SKU `mpa_property_manager` active |
| Property | M.P.A. Demo Apartments `a11ce002-0001-4000-8000-000000000101` |
| Unit | **SIGNWELL-UAT** `a11ce002-2026-4000-8000-00000000aa01` · created available (not Unit 101) |
| Resident | **SignWell UAT Resident** `a11ce002-2026-4000-8000-00000000aa02` · approved → pending_move_in after Send |
| Signer | Owner-controlled plus-address on `gmail.com` (not `uat.tenant.property.demo@…`) |
| Lease | `51fb0ba8-eb79-4902-a56d-e93c53fcd15f` · $1.00 · manager signature **not** required · title `Lease — SignWell UAT Resident — Unit SIGNWELL-UAT.txt` |

Existing Unit 101 / UAT Tenant were **not** reused.

## 7. Recipient correctness

| Check | Result |
|-------|--------|
| Signer email from same-org resident | **Pass** — resident email is the Owner plus-address; org/property/unit match |
| Browser cannot substitute another org | **Pass** — `getLease` / send scoped by `organization_id`; Clinic Demo cannot read this lease |
| Former resident cannot be used | **Pass** — UAT176 Lifecycle is `former` with a lease; create path rejects non-approved/pending/prospect |
| PM/Complete scope | **Pass** — Property Demo SKU includes `pm.leasing`; `property_manager` has `pm.leasing:write` |
| FO-only / technician cannot invoke | **Pass** — `facility_technician` has **no** `pm.leasing:*` grant; FO-only SKU has no `pm.leasing` entitlement; Complete + `facility_operations` scope drops PM entitlements |

Send was not performed until the resident mapping was confirmed on the wizard (SignWell UAT Resident · SIGNWELL-UAT).

## 8. First Send result

**Pass — one real Production Send.**

- Before: `draft`, no SignWell id, not signed  
- After: `pending_signature`, channel `signwell`, SignWell status `Created`, `signed_at` null  
- Timeline: `lease.created` → `lease.document_generated` → two `lease.signature_failed` (422 `.txt`) → `lease.sent_for_signature` at `2026-08-18 10:50:07Z`  
- UI: “Sent for signature.”

## 9. SignWell document correlation

**Pass.** Stored `signwell_document_id` present (36-character id). Status `Created`. Metadata `lease_id` is not used for webhook correlation (docs/225). Document id is not published here.

## 10. Duplicate Send result

**Pass (UI + service).** After the successful Send, **Send through SignWell is hidden**. Recovery shown: **Sync SignWell status** and **Record signed offline**. A second click was **not** used to create another SignWell document. `leases` with a SignWell id = **1**.

## 11. Signer email delivery

**Unverified in this environment.** Gmail was not signed in. Effective mode is **test** (`SIGNWELL_TEST_MODE` missing). The signer nonetheless completed the **existing** SignWell document (authoritative status `Completed` via Production Sync). Inbox contents were not inspected.

## 12. Desktop signing result

**Not observed in this agent.** Completion happened on the existing SignWell document before/during resume (SignWell status became `Completed`; M.P.A. still `pending_signature` until Sync). No second document.

## 13. Mobile signing result

**Not separately observed.** Same existing request only.

## 14. Completion result

**Pass — SignWell authoritative Completed, applied by Sync.**

| Item | Value |
|------|--------|
| SignWell status after Sync | `Completed` |
| M.P.A. before Sync | `pending_signature` / `Created` / not signed |
| M.P.A. after Sync | `active` / `Completed` / signed + activated `2026-08-18 23:10:03Z` |
| Events | `lease.signed` `23:10:03Z` · `lease.activated` `23:10:10Z` |
| Offline used | **No** |

## 15. Webhook delivery

**Not a webhook PASS.** `signwell_webhook_events` remains **0** after completion, Sync, and the remediaiton deploys. Completion reached M.P.A. by **Sync**, not by an authenticated webhook. Live hook host matches Production `www`; the callback path is **not** the exact designed route. Do not print the live callback URL.

Follow-on webhook destination remediaiton and authentic-delivery certification are recorded in [docs/227](../227-signwell-production-webhook-certification/index.md). This file remains the Sync + retrieval PASS for lease `51fb0ba8-…`. It is **not** a webhook PASS. Docs/227 Part B certified a **separate** webhook-only synthetic lease; do not describe this docs/226 completion as webhook-driven.

## 16. Webhook authentication

**Not live-exercised.** In-repo HMAC tests remain green. Authentication was **not** weakened.

## 17. Correlation security

**In-repo certified.** Live webhook correlation was not exercised because no webhook arrived. Sync used the stored `signwell_document_id` on this lease only. Still exactly **one** lease with a SignWell id.

## 18. Replay / idempotency

**Webhook replay: not possible** (no persisted webhook event; do not fabricate one).

**Sync replay: Pass.** Second authenticated `POST /api/pm/leasing/{leaseId}/sync` returned **200** / `alreadyActive: true`. Occupancy rows stayed **1**. Charge rows stayed **1**. SignWell document count stayed **1**. `signed_at` / `activated_at` stayed `2026-08-18 23:10:03Z`. Payments stayed **0**.

## 19. M.P.A. status transition

| Stage | M.P.A. |
|-------|--------|
| After Send | `pending_signature` / SignWell `Created` / not signed |
| Viewed / in progress | not separately observed |
| Completed via Sync | `active` / SignWell `Completed` / signed |

Completed did not move backward after the second Sync.

## 20. Lease / occupancy result

| Check | Result |
|-------|--------|
| Lease | `51fb0ba8-…` **active** · channel `signwell` |
| Resident | SignWell UAT Resident **active** · portal **active** |
| Unit | SIGNWELL-UAT **occupied** |
| Property / org | Demo Apartments / UAT Property Demo |
| Unit 101 / UAT Tenant | **unchanged** (occupied / own lease, no SignWell id) |
| `lease_residents` | **1** |
| Duplicate occupancy / lease / SignWell doc | **none** |
| Unrelated lease `a11ce002-…0401` | still active, no SignWell id |

## 21. Completed document retrieval

**Pass — required gate.** After the remediaiton deploys, manager Documents for this lease (`source=signwell`, title contains SIGNWELL-UAT, `signwellStatus=Completed`) exposes `externalUrl`. The list opens the earlier **indexed** Documents row (not `lease:{id}`); both paths now resolve SignWell `completed_pdf?url_only=true` when `files[].url` is absent. Authenticated GET returned `hasExternal=true`. The resolved file is `application/pdf` (magic `%PDF-`, 89,327 bytes). **Open external file is visible** on Production Documents. Generated text remains the on-page snapshot and is **not** the signed artifact. No signed-file URL was published in this record.

## 22. Completed document authorization

Org-scoped `getDocumentDetail` remains in force. Clinic Demo org cookie against this document id returns **403** / `Forbidden` and no `externalUrl`. No second org retrieved the signed file.

## 23. Historical immutability

Stored generated `document_name` / body were not rewritten by Sync or by the remediaiton. SignWell id unchanged. No real legal records mutated. Signed PDF snapshot is **not** stored in a new M.P.A. bucket (by design). Retrieval is on-demand through SignWell into the existing `externalUrl` control.

## 24. Cross-org isolation

**Pass.** Clinic Demo cannot read this document (403). No real customer used.

## 25. RBAC

Unchanged from the first Send proof. Resume actor remained Property Demo `property_manager`. FO technician still has no `pm.leasing:*`.

## 26. Sync recovery

**Pass.** First Sync after genuine SignWell Completed activated the lease. Second Sync was idempotent and created no new SignWell document. Sync is **not** a webhook PASS.

## 27. Offline fallback separation

**Pass.** Record signed offline was visible before Sync and **not** clicked. Hidden after `active`.

## 28. Failure / recovery behavior

Unchanged plus: delayed webhook / missing webhook recovered by Sync; completed file URL recovered by `completed_pdf?url_only=true` onto `externalUrl`.

## 29. Manager onboarding flow

Extended path: … → Send → Pending Signature → **Sync SignWell status** → Active / Completed → Documents → **Open external file** for the completed signed PDF.

## 30. Signer onboarding flow

**Not observed in-agent.** SignWell document reached Completed without a second Send.

## 31. Navigation / click count

Prior create/send = 6 actions. Resume: open existing lease → Sync = **1** action. Documents open + Documents Sync SignWell = **2** more. No hidden URL for Send/Sync.

## 32. Production UAT data created

Same synthetic unit / resident / lease / one SignWell document. Added by intended activation (not a new feature): `lease.signed`, `lease.activated`, one `lease_residents` row, one $1 rent schedule, one $1 ledger charge (`generateCurrentPeriod`). **No** `financial_payments`. Do not hard-delete.

## 33. Final synthetic UAT state

Lease **active** / SignWell **Completed** on SIGNWELL-UAT. Preserve the signed transaction. Isolated from Unit 101. Execution remains OFF.

## 34. Product regression

No UI/sidebar/pricing redesign. No SEC-001. Remediaiton-only deploys. Pre-existing `tenant-portal-billing-copy.test.ts` snake_case expectation **not changed**.

## 35. Finance / payment safety

| Check | After Sync |
|-------|------------|
| `stripe_payment_execution_enabled = true` | **0 of 6** |
| UAT `financial_payments` | **0** |
| UAT rent schedule / ledger charge | **1 / 1** · $1 · designed activation, not Stripe |
| Stripe / Connect / AutoPay / FIN-OPS / Checkout / prices | **not changed** |

No tenant money movement.

## 36. July / M5

July freeze **ON**. M5 **unauthorized**. Unchanged.

## 37. Tests / build

| Check | Result |
|-------|--------|
| Focused SignWell + document upload | **31 passed** |
| Shared typecheck | Pass |
| Web typecheck | Pass |
| Changed-source lint | Pass |
| Local `pnpm --filter @mpa/web build` | Pass · 204 pages (pre-hydration SHA `42616148`) |
| Live Production | `dpl_66aVf8yem6ZmCAst8x3GMKAi6Zdp` / SHA `f13cfd56` |
| Pre-existing | `tenant-portal-billing-copy.test.ts` snake_case — **not hidden** |

## 38. P0 remaining

**0.**

## 39. P1 remaining

| ID | Finding |
|----|---------|
| P1-UAT-04 | SignWell webhook callback path is not the exact designed route (host matches Production `www`) — **closed in [docs/227](../227-signwell-production-webhook-certification/index.md) Part A** (exact designed callback) |
| P1-UAT-05 | Authenticated webhook never arrived (`signwell_webhook_events` = 0) — **closed in [docs/227](../227-signwell-production-webhook-certification/index.md) Part B** on a **separate** webhook-only synthetic lease. This docs/226 completion remains Sync-driven. |

P1-UAT-01 (unsigned), P1-UAT-02 (no Sync), and P1-UAT-03 (retrieval) are **closed**. P1-UAT-04 / P1-UAT-05 no longer block webhook certification; they do **not** rewrite this file’s Sync + retrieval PASS as a webhook PASS.

## 40. P2 deferred

Unchanged: env **names** in the client bundle; test-mode default; unused `SIGNWELL_MODE`; no reminder/cancel/resend.

## 41. Final verdict

**PASS — SIGNWELL PRODUCTION END-TO-END UAT CERTIFIED**

Do not start another feature. Do not deploy SEC-001. Do not send a real customer legal document. Do not claim ready-for-real-users while webhook delivery and the exact designed callback path remain unproven.

---

## Resume mutations (existing lease only)

| Mutation | Result |
|----------|--------|
| New lease / new SignWell document | **None** |
| Record signed offline | **Not used** |
| Production deploys | `dpl_DXWA8jhhYc5HcDk4FZSy9y3ga75b` then `dpl_66aVf8yem6ZmCAst8x3GMKAi6Zdp` — remediaiton only |
| SEC-001 / WAF / Auth / MFA | **None** |
| First Sync | Applied genuine SignWell Completed → `activateSignedLease` |
| Second Sync | `alreadyActive` · no duplicate occupancy/charge/document |
| Completed-file retrieval | `externalUrl` + Open external file on the existing indexed Documents row |
| Stripe / July / M5 / pricing | **None** |

---

## Remediation implemented during this UAT (no new product)

1. `pm_residents!resident_id` on `lease_agreements` embeds — Production leasing list/create was failing with multiple relationships (bidirectional FKs). **No migration.**
2. SignWell upload uses HTML wrap of the generated lease text — create-document does not accept `.txt`. Stored M.P.A. body remains text. **No second media system.**
3. Documents `getDocumentDetail` maps SignWell `completed_pdf?url_only=true` onto the existing `externalUrl` / Open external file control when `files[].url` is absent. Applies to `lease:{id}` and to the indexed Documents row. **No migration. No second bucket.**

---

## STOP

Do not start another feature.  
Do not expand SignWell beyond leases.  
Do not send a real customer’s legal document.  
Do not modify Stripe/payment behavior.  
Do not enable M5.  
Do not unfreeze July.  
Do not change pricing.
