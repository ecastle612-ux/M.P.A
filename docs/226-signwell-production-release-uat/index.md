# 226 — SignWell Lease E-Signature Production Release + Controlled UAT

**Title:** SIGNWELL LEASE E-SIGNATURE — PRODUCTION RELEASE + CONTROLLED END-TO-END UAT  
**Status:** **BLOCKED — SIGNWELL PRODUCTION END-TO-END UAT**  
**Date:** 2026-08-18  
**Authority:** Owner authorization — deploy the certified docs/225 remediation; perform one controlled synthetic Production lease-signing lifecycle; certify or block. **STOP after this record.**  
**Product boundary:** Lease e-signature only. Vendor / Facility Operations SignWell remains **NOT IMPLEMENTED / NOT ADVERTISED**.  
**Baseline:** [docs/224](../224-final-human-onboarding-simulation/index.md) · [docs/225](../225-signwell-documents-full-functionality-audit/index.md)

This package does **not** start another feature, change Stripe/M5/July/pricing, send a real customer legal document, or expand SignWell beyond leases.

---

## Verdict

**BLOCKED — SIGNWELL PRODUCTION END-TO-END UAT**

A real Production Send succeeded on one synthetic Property Demo lease. M.P.A. stored a SignWell document id, moved the lease to **Pending Signature / Created**, hid Send, and left recovery as **Sync** or **Record signed offline**. The lease is **not** signed or activated.

The remaining required cycle did **not** happen in this run:

- Owner-controlled signer inbox was not available in this environment (`gmail_not_signed_in`)
- This environment cannot decrypt Production `SIGNWELL_API_KEY`, so the signing URL cannot be fetched safely
- Webhook rows remain **0**
- Completed-document retrieval was not exercised
- Webhook replay / Sync-after-completion were not exercised

Do **not** claim `SIGNWELL DOCUMENTS PRODUCTION END-TO-END FUNCTIONAL — READY FOR REAL USERS`.

**Exact Owner / manual action required (do not create another lease):**

1. Complete the **existing** SignWell request for synthetic lease `51fb0ba8-eb79-4902-a56d-e93c53fcd15f` (SignWell UAT Resident · unit SIGNWELL-UAT · $1) from the Owner-controlled plus-address inbox, **or** place Production `SIGNWELL_API_KEY` in this Cloud Agent environment so the agent can retrieve the signing URL and finish desktop/mobile/completion.
2. Confirm the SignWell dashboard webhook destination is `https://www.my-property-assistant.com/api/leasing/webhooks/signwell`.
3. Reply on this package to continue UAT (webhook, replay, retrieval, Sync). Do **not** use Record signed offline to fake the PASS.

**STOP.**

---

## 1. Certification record

This file. Docs line 221 → 225 unchanged in meaning. **226** is the next unique number.

## 2. Deployed SHA

`da41ece43e7e1467fdf57e9f9aebfa4d750d5b7c`  
Contains docs/225 remediations (`dcf63210`) plus two Production blockers found during UAT:

- `2750adc8` — PostgREST `pm_residents!resident_id` embed hint (no migration)
- `da41ece4` — SignWell upload wraps generated text as **HTML** (SignWell create-document rejects `.txt` with 422)

## 3. Deployment ID

Live `www.my-property-assistant.com`: **`dpl_6wSaCYZ7bH6jbBu8Lh6kLyFPUsNB`**  
Inspector: `https://vercel.com/ecastle612-uxs-projects/m-p-a-web/6wSaCYZ7bH6jbBu8Lh6kLyFPUsNB`  
Also aliased: `m-p-a-web.vercel.app`  
Prior deploy on this package (pre-HTML fix): `dpl_4ZJAoyQWdcpF73u8CH9RHVGGduq5`  
Docs/225-only deploy (pre-embed hint): `dpl_HZL1bktWfaHE6E94Pe4n62J6Vy2q`

## 4. Migration result

**NONE.** No new SignWell or leasing migration. Embed hint and HTML wrap are application-only.

## 5. Production SignWell config status

Report only configured / missing / invalid / cannot verify safely. No secret values.

| Name / item | Status | Notes |
|-------------|--------|-------|
| `SIGNWELL_API_KEY` | **configured** (Vercel Production, Hidden) | Value not readable in this agent (placeholder / API decrypt empty) |
| `SIGNWELL_WEBHOOK_ID` | **configured** (Vercel Production, Hidden) | Same |
| `SIGNWELL_TEST_MODE` | **missing** | App defaults to **test mode** (`!== "false"`) |
| `SIGNWELL_MODE` / `SIGNWELL_ALLOW_SIMULATE` | configured | **Unused** by current code |
| Webhook destination in SignWell | **cannot verify safely** | Hooks list requires API key |
| Designed M.P.A. route | `https://www.my-property-assistant.com/api/leasing/webhooks/signwell` | |
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

**Cannot complete.** Gmail was not signed in on this VM. `SIGNWELL_TEST_MODE` is missing, so the live app sends with **test mode**, which SignWell documents as not sending a real email. Delivery is **unverified**.

## 12. Desktop signing result

**Not run.** Blocked on signing URL / inbox.

## 13. Mobile signing result

**Not run.** Same request only; no second lease created.

## 14. Completion result

**Not run.** M.P.A. correctly remains **not signed** (`signed_at` null, status `pending_signature`).

## 15. Webhook delivery

**Not observed.** `signwell_webhook_events` = **0** after Send (expected until completion). Destination **cannot verify safely** without the API key.

## 16. Webhook authentication

**Not live-exercised.** In-repo HMAC tests remain green (fail-closed on `SIGNWELL_WEBHOOK_ID`).

## 17. Correlation security

**In-repo certified; live completion not exercised.** Webhook lookup remains `.eq("signwell_document_id", documentId)` only.

## 18. Replay / idempotency

**Not run.** No completion event to replay.

## 19. M.P.A. status transition

| Stage | M.P.A. |
|-------|--------|
| After Send | `pending_signature` / SignWell `Created` / not signed |
| Viewed / in progress | **not observed** |
| Completed | **not observed** |

Completed must not move backward — not exercised.

## 20. Lease / occupancy result

Activation **did not run** (correct). Unit SIGNWELL-UAT remains isolated. No duplicate occupancy. No tenant payment rows on this lease (`financial_payments` = 0).

## 21. Completed document retrieval

**Not run.** Required PASS for READY. Treat as **P1 until proven**.

## 22. Completed document authorization

**Not run.** Isolation tests remain in-repo.

## 23. Historical immutability

**Not run** (no signed snapshot yet). Synthetic-only; no real legal data mutated.

## 24. Cross-org isolation

**Service evidence Pass; live Org B retrieve not run.** Clinic Demo org cannot `getLease` this id. No real customer used.

## 25. RBAC

| Role / scope | Lease SignWell Send |
|--------------|---------------------|
| organization_admin | allowed (grant) |
| property_manager | **allowed** — UAT actor |
| leasing_agent | allowed (grant) |
| facility_technician | **denied** (no grant) |
| FO-only SKU | **denied** (no `pm.leasing`) |
| Complete FO-only scope | **denied** (PM entitlements filtered) |
| Complete PM/both | allowed |
| tenant | signer via SignWell, not staff admin |
| Master Admin | no implicit customer SignWell powers in this design |

## 26. Sync recovery

**Not run after completion.** Sync control is visible and was **not** clicked (would not create a new document).

## 27. Offline fallback separation

**Pass as UI separation.** Record signed offline remains a distinct control. **Not used.** It must not be used to fake this UAT PASS. After activation it is hidden (`canOffline` false when `active`).

## 28. Failure / recovery behavior

| Case | Evidence |
|------|----------|
| SignWell 422 unsupported `.txt` | **Observed live**, then fixed (`da41ece4`) |
| Duplicate Send | UI hides Send |
| Invalid / spoofed webhook | In-repo 401 tests |
| Customer-facing errors | 422 shown as `SignWell create failed (422)` — no stack, no key value |
| Credentials not broken | No Production key rotation |

## 29. Manager onboarding flow

Intuitive path worked after the embed + HTML fixes:

Leasing → Create lease (SignWell UAT Resident) → rent $1, no manager countersign → draft Command Center → **Send through SignWell** → Pending Signature.

No hidden URL. No Owner explanation required on the lease page.

## 30. Signer onboarding flow

**Not run.**

## 31. Navigation / click count

From signed-in Mission Control: Leasing → Create lease → Continue → Continue (rent / uncheck manager) → Create lease draft → Send = **6** primary actions (**7** screens including Command Center). Login is one additional screen when the session is cold.

## 32. Production UAT data created

| Object | Marked synthetic |
|--------|------------------|
| Unit SIGNWELL-UAT | yes |
| Resident SignWell UAT Resident | yes |
| Lease `51fb0ba8-…` | yes · $1 |
| SignWell document | one · test-mode Created |
| Domain events | created / generated / two failed 422 / sent |
| Payments / occupancy activation | none |

Do **not** hard-delete the signed/sent history to restore counts.

## 33. Final synthetic UAT state

Leave the lease **pending_signature** with the stored SignWell id. Unit stays **SIGNWELL-UAT** (not customer Unit 101). No billing execution. Preserve the transaction for the continuation UAT.

## 34. Product regression

Read-only / in-repo: PM leasing now loads (embed hint). FO/Complete/tenant/QR/My Work/Assets/Search/PM/sidebar/complimentary were not redesigned. Pre-existing `tenant-portal-billing-copy.test.ts` snake_case expectation **not changed**.

## 35. Finance / payment safety

| Check | After Send |
|-------|------------|
| `stripe_payment_execution_enabled = true` | **0 of 6** |
| UAT lease payments | **0** |
| Stripe / Connect / AutoPay / FIN-OPS / Checkout / prices | **not changed** |

No tenant money movement.

## 36. July / M5

| Check | Result |
|-------|--------|
| `finance_july_freeze_enabled()` | **true** (ON) |
| `isFinanceM5Authorized()` | **false** (hard-coded) |
| Automated late fees / collections | **unauthorized** |

## 37. Tests / build

| Check | Result |
|-------|--------|
| Focused SignWell + document upload | **25 passed** |
| Web typecheck | Pass |
| Changed-source lint | Pass |
| Production Vercel build | Pass · `dpl_6wSaCYZ7bH6jbBu8Lh6kLyFPUsNB` · 204 pages |
| Pre-existing | `tenant-portal-billing-copy.test.ts` expects literal `stripe_payment_execution_enabled` — **not hidden** |

## 38. P0 remaining

**0.** Live Send works on the HTML upload path.

## 39. P1 remaining

| ID | Finding |
|----|---------|
| P1-UAT-01 | Controlled signer has not completed the existing Production request |
| P1-UAT-02 | Authenticated webhook (or authoritative Sync after real completion) not observed |
| P1-UAT-03 | Completed document retrieval not proven |
| P1-UAT-04 | SignWell webhook destination cannot be verified from this environment |

These keep the package **BLOCKED**. They are not a license to invent a second document system.

## 40. P2 deferred

- Client bundle still contains SignWell **env names** (`SIGNWELL_API_KEY`, `SIGNWELL_WEBHOOK_ID`); no key-like assignments found
- `SIGNWELL_TEST_MODE` missing → test mode (email may not send)
- Unused `SIGNWELL_MODE` / `SIGNWELL_ALLOW_SIMULATE`
- Offline / unconfigured copy may mention the env name
- No M.P.A. reminder/cancel/resend

## 41. Final verdict

**BLOCKED — SIGNWELL PRODUCTION END-TO-END UAT**

Owner action: complete the existing synthetic SignWell request (or provide `SIGNWELL_API_KEY` to this agent) and confirm the webhook URL, then continue this package. Do not start another feature.

---

## Remediation implemented during this UAT (no new product)

1. `pm_residents!resident_id` on `lease_agreements` embeds — Production leasing list/create was failing with multiple relationships (bidirectional FKs). **No migration.**
2. SignWell upload uses HTML wrap of the generated lease text — create-document does not accept `.txt`. Stored M.P.A. body remains text. **No second media system.**

---

## STOP

Do not start another feature.  
Do not expand SignWell beyond leases.  
Do not send a real customer’s legal document.  
Do not modify Stripe/payment behavior.  
Do not enable M5.  
Do not unfreeze July.  
Do not change pricing.
