# 225 — SignWell Documents Full End-to-End Functionality Audit

**Title:** SIGNWELL DOCUMENTS FULL FUNCTIONALITY AUDIT + IN-REPO REMEDIATION  
**Status:** **SIGNWELL DOCUMENTS IN-REPO CERTIFIED — PRODUCTION UAT REQUIRED**  
**Date:** 2026-08-18  
**Authority:** Owner authorization — audit existing SignWell document/signature integration. Implement only the smallest in-repo P0/P1 remediations. **Do not deploy. Do not mutate Production. Do not send a real customer’s legal document.**  
**Baseline:** [docs/224](../224-final-human-onboarding-simulation/index.md) · live Production SHA `a1f617de77f30696471045e2f684ba8fe3d15f4f` · deploy `dpl_4vsYcecpATEcFeQUNJaSJT4izHGS`  
**In-repo remediation SHA:** `dcf63210`  
**Prior design:** LAUNCH-001 J4 · [docs/26/j4](../26-launch-001-onboarding/j4/certification.md) · [docs/60](../60-phase-5-leasing-applicant-lifecycle/sprint-1-authorization.md) (no SignWell redesign)

This package does **not** replace SignWell, add a second document system, redesign leases, change pricing, enable M5, unfreeze July, or start another feature.

---

## Verdict

**SIGNWELL DOCUMENTS IN-REPO CERTIFIED — PRODUCTION UAT REQUIRED**

The designed workflow is **lease e-signature only** (Property Manager / Complete Property Operations). Vendor and Facility documents are **NOT IMPLEMENTED / NOT ADVERTISED**.

Two P1 defects in the already-approved workflow are fixed **in-repo**:

1. Webhooks no longer activate a lease from `metadata.lease_id` alone.
2. A second Send no longer creates another SignWell document on the same pending lease.

**P0:** 0 remaining.  
**P1 remaining:** none in code. A real Production send → SignWell sign → webhook → Completed → retrieve cycle has **never** been observed (`signwell_webhook_events` = 0, leases with `signwell_document_id` = 0). That UAT is still required.

Do **not** claim `SIGNWELL DOCUMENTS PRODUCTION END-TO-END FUNCTIONAL — READY FOR REAL USERS` from mocks, unit tests, or the existence of env var names.

**STOP.** Do not deploy from this package.

---

## 1. Repository lineage

| Item | Value |
|------|--------|
| Certified docs line | 221 → **222** Slice 6 Production · **223** AI audit · **224** human onboarding |
| This record | **225** — no collision; 222–224 meanings unchanged |
| Live Production SHA | `a1f617de77f30696471045e2f684ba8fe3d15f4f` |
| Live deploy | `dpl_4vsYcecpATEcFeQUNJaSJT4izHGS` |
| This branch | `cursor/signwell-documents-audit-6821` from the docs/224 line |
| Remediation commit | `dcf63210` |
| Schema | Existing J4 migrations only. **No new migration.** |

---

## 2. Existing SignWell architecture

Sole executable integration: **LAUNCH-001 J4 lease signing**.

| Layer | Path |
|-------|------|
| API client | `apps/web/src/lib/signwell/client.ts` — `POST /documents`, `GET /documents/{id}`, HMAC verify |
| Correlation | `apps/web/src/lib/signwell/correlation.ts` (this package) |
| Lease send/sync/activate | `apps/web/src/lib/leasing/lease-service.ts` |
| Generated text | `apps/web/src/lib/leasing/document.ts` (plain-text lease → base64 `.txt`) |
| Webhook | `POST /api/leasing/webhooks/signwell` |
| Documents library | `document-service.ts` — virtual `lease:{id}` + optional index `source=signwell` |
| UI | `/pm/leasing`, `/pm/leasing/[leaseId]`, `/shared/documents` |
| Env | `SIGNWELL_API_KEY`, `SIGNWELL_WEBHOOK_ID`, `SIGNWELL_TEST_MODE` (server-only; optional) |
| Honesty fallback | **Record signed offline** when SignWell is missing or delayed |

`createAndSendSignWellDocument` is called only from `sendLeaseForSignature`.

---

## 3. Exact supported product workflows

**Supported**

```
Property → Unit → Resident → Create lease (generated text)
  → Send through SignWell
  → SignWell emails signer(s)
  → Hosted SignWell signing
  → Webhook document_completed and/or manager Sync
  → activateSignedLease (signed → active, portal, occupancy, rent schedule)
  → Lease + Documents show status / generated text / optional SignWell file URL
```

Offline path: `draft | pending_signature | signed` → Record signed offline → same activation (`signing_channel: offline`).

**Not supported**

| Workflow | Status |
|----------|--------|
| Vendor documents via SignWell | **NOT IMPLEMENTED / NOT ADVERTISED** |
| Facility documents via SignWell | **NOT IMPLEMENTED / NOT ADVERTISED** |
| Generic “any PDF” send-for-signature | **NOT IMPLEMENTED** |
| Cancel / resend / reminder / correct signer APIs | **NOT IMPLEMENTED** (UI no longer implies resend) |
| Stored executed PDF in M.P.A. object storage | **NOT IMPLEMENTED** (fetch-on-demand SignWell URL + generated text) |

---

## 4. Routes / UI

| Surface | Route | Who |
|---------|-------|-----|
| Leasing directory | `/pm/leasing` | PM / Complete property surface / leasing agent |
| Lease Command Center | `/pm/leasing/[leaseId]` | Same + `pm.leasing:read` |
| Send | `POST /api/pm/leasing/[leaseId]/send` | `pm.leasing:write` |
| Sync | `POST /api/pm/leasing/[leaseId]/sync` | `pm.leasing:write` |
| Offline complete | `POST /api/pm/leasing/[leaseId]/complete-offline` | `pm.leasing:write` |
| Webhook | `POST /api/leasing/webhooks/signwell` | HMAC only (no session) |
| Documents | `/shared/documents` · `GET /api/shared/documents/[id]?syncSignWell=1` | `platform.documents:read` |
| Master Admin J4 evidence | `/admin` launch J4 | Platform operator |

Discoverability: **Leasing** is a sidebar item on the Property surface. Send lives on the lease under **Signature workflow**. FO-only and technicians do not see Leasing. Hidden URL is not required.

---

## 5. Database model

**`lease_agreements`:** `status` (`draft | pending_signature | signed | active | ended`), `signing_channel` (`signwell | offline`), `signwell_document_id`, `signwell_status`, `signwell_error`, `document_name`, `document_body`, manager signer fields, `signed_at`, `activated_at`.

**`signwell_webhook_events`:** unique `(event_type, document_id, event_id)`; stores payload after HMAC verify.

**`document_documents`:** `source` includes `signwell`; `signwell_document_id`; `external_url`.

---

## 6. SignWell configuration status

Read-only. **No secret values printed.**

| Item | Status |
|------|--------|
| `SIGNWELL_API_KEY` | **cannot verify safely** (server-only; not inspected) |
| `SIGNWELL_WEBHOOK_ID` | **cannot verify safely** |
| `SIGNWELL_TEST_MODE` | Defaults to test unless exactly `"false"`. **Must be `false` for real Production UAT** |
| Webhook URL | Designed: `https://www.my-property-assistant.com/api/leasing/webhooks/signwell` |
| Production webhook rows | **0** — missing, unused, or never delivered |
| Production leases with SignWell id | **0** |
| Schema | **configured** (J4 tables exist) |
| Storage bucket for executed PDFs | **not part of this design** |

---

## 7. API integration

| Call | Endpoint | Auth |
|------|----------|------|
| Create + send | `POST https://www.signwell.com/api/v1/documents` | `X-Api-Key` server-only |
| Get status / files | `GET …/documents/{id}` | same |

Payload: `test_mode`, `draft: false`, `with_signature_page: true`, signing order, generated `.txt` base64, resident (+ optional manager) recipients, metadata `lease_id` / `organization_id` / `resident_id`.

Customer-facing errors use SignWell `error_message` or a generic create/get failed string. API key is not returned.

---

## 8. Recipient correctness

Send loads the lease with `getLease(organizationId, leaseId)` — org cookie is authoritative. Resident email comes from the lease’s `pm_residents` row, not the browser. Create lease requires the resident in the same org and status `approved | pending_lease | prospect` without an existing lease.

This package adds: missing resident email fails closed before SignWell.

Wrong-org / wrong-resident / technician / FO-only API calls fail at `requireLeasingPermission` (`pm.leasing` entitlement + `pm.leasing:write`). Client-hidden buttons are not the control.

---

## 9. Document creation

One path: generated residential lease text (`buildLeaseDocumentText`). Not an uploaded PDF and not a SignWell template library. Title: `Lease — {resident} — Unit {label}.txt`. Identity is the M.P.A. `lease_agreements.id`. Browser cannot choose `organization_id`.

---

## 10. Send lifecycle

`draft` (or `pending_signature` **without** a stored document id) → SignWell create → `pending_signature` + `signwell_document_id`.

**After this package:** if `pending_signature` already has a SignWell id, Send returns `sent: false`, `alreadySent: true`, and does not call SignWell again. UI hides Send in that state. Recovery: **Sync SignWell status** or **Record signed offline**.

---

## 11. Hosted signing lifecycle

SignWell delivers the email/link and hosts the signer UI (desktop and phone). M.P.A. does not embed the SignWell editor. M.P.A. never sets `signed`/`active` from a client click — only webhook completion or Sync after `isSignWellCompletedStatus` (`completed` / `complete`). Declined / canceled / expired / viewed do **not** activate.

---

## 12. Webhook verification

Matches SignWell docs: HMAC-SHA256 of `event.type + "@" + event.time` with `SIGNWELL_WEBHOOK_ID`. Fail closed if secret missing. 401 before service-role work. Event `time` is stringified (SignWell may send a unix number).

---

## 13. Webhook idempotency

Events upsert on `(event_type, document_id, event_id)` where `event_id = type:documentId:time`. Duplicate completion still calls `activateSignedLease`, which is idempotent when `status === active && activated_at`.

---

## 14. Status mapping

| SignWell | M.P.A. |
|----------|--------|
| create accepted | `pending_signature` + raw `signwell_status` |
| `completed` / `complete` or `document_completed` | `signed` then `active` |
| viewed / declined / canceled / expired | not activated; Sync may store raw `signwell_status` |
| offline | `signing_channel: offline` → same activation |

Completed documents cannot move backward through this path. There is no optimistic “Signed” UI.

**P1 remediations (this package):** lookup is **only** `signwell_document_id = event document id`. Metadata `lease_id` / `organization_id` must match the stored row or the event is ignored (`unmatched`). A foreign `lease_id` no longer activates a different lease.

---

## 15. Completed-document retrieval

| What | Where |
|------|-------|
| Generated lease text | `lease_agreements.document_body` (pre-sign snapshot) |
| SignWell file URL | Fetched on demand via `getSignWellDocument` → Documents “Open external file” |
| Indexed library row | `ensureSignWellLeaseDocumentIndexed` copies text + `external_url` |
| Executed PDF in M.P.A. storage | **Not stored** — do not build a second media system |

UAT must confirm the SignWell URL still opens after completion. Tenant/signer access to the M.P.A. library is documents entitlement / portal, not a public bucket.

---

## 16. Historical immutability

The generated `document_body` is written at create and not rewritten on resident rename. Correlation ids stay on the lease. Activation does not hard-delete the lease. Changing the resident later does not rewrite the stored text. There is no approved retention delete of completed signature history.

---

## 17. Lease / resident integration

Create lease binds `property_id`, `unit_id`, `resident_id` from the same-org resident. Unit 101 cannot receive Unit 202’s resident without a new authorized create. Former / moved-out residents are not in the create picker (`lease_id` null + approved/pending/prospect only). Move-out does not delete the lease row or document body.

---

## 18. Vendor / facility support

**NOT IMPLEMENTED / NOT ADVERTISED.** FO SKU has no `pm.leasing`. Facility managers and technicians have no Send-for-Signature rail. Do not manufacture a PASS for those modules.

---

## 19. Cancel / resend / recovery

| Action | Supported? |
|--------|------------|
| Cancel SignWell document | No — not advertised |
| Resend / new SignWell doc | No — blocked after first successful send |
| Reminder | SignWell-side only, not in M.P.A. |
| Sync | Yes |
| Offline complete | Yes (honesty fallback) |
| Mutate a completed document | No |

---

## 20. Notifications

| Message | Sender |
|---------|--------|
| Signature request email | **SignWell** (subject/message on create) |
| M.P.A. signature-request email | **None** — avoids a second request email |
| Portal magic link | After activation, not a SignWell state change |

A missing optional M.P.A. email cannot mark a lease signed.

---

## 21. RBAC

| Role / scope | Create | Send / Sync / Offline | View status | View signed text | Manage SignWell templates |
|--------------|--------|------------------------|-------------|------------------|---------------------------|
| organization_admin (PM / Complete both / Complete PM) | Yes | Yes | Yes | Yes | N/A (none) |
| property_manager (same surfaces) | Yes | Yes | Yes | Yes | N/A |
| leasing_agent | Yes | Yes | Yes | Yes | N/A |
| facility manager / FO-only Complete | No `pm.leasing` | No | No Leasing nav | Documents if entitled | N/A |
| facility technician | No | No | No | No leasing write | N/A |
| tenant | No | Signs on SignWell | Portal after activation | Portal documents if exposed | N/A |
| Master Admin | Evidence only | No org send | J4 panel | No customer doc as MA | N/A |

SKU alone does not grant FO users PM leasing. `effectiveSurfaces` still applies.

---

## 22. Complete scoped behavior

Complete + property surface: Leasing works. Complete + FO-only: no Leasing entitlement/nav. Complete both: Leasing stays under Property Operations; surface switch does not put SignWell on Facility Mission Control.

---

## 23. Org isolation

`getLease` / send / sync / activate all filter `organization_id`. Webhook now uses the **stored** lease org after document-id match. Cross-org completed-document API still requires the caller’s org membership.

---

## 24. Security / privacy

| Check | Result |
|-------|--------|
| API key server-only | Yes — no `NEXT_PUBLIC_SIGNWELL_*` |
| Webhook HMAC fail-closed | Yes |
| Client bundle secrets | **No secret values.** Client chunks contain **env var names** from the Zod schema and Master Admin ops panel (`process.env.SIGNWELL_API_KEY` is always empty in the browser) — P2 |
| Signing URLs | Treated as SignWell-hosted; not logged by this package |
| IDOR | Lease id scoped by org |
| Public signed-lease bucket | None |

---

## 25. Mobile / accessibility

Lease Command Center uses `min-h` buttons, text status (not color-only badges alone), signer name/email, Send/Sync/Offline. SignWell hosted UI is not redesigned. Phone-width staff shell uses the certified Menu drawer.

---

## 26. Performance

Mission Control does **not** call SignWell. It counts local lease statuses. SignWell GET runs on send (create), manual Sync, and Documents detail when a SignWell id exists — not on every list row as an N+1 by default.

---

## 27. Audit trail

Events/audit: `lease.created`, `lease.document_generated`, `lease.sent_for_signature` (includes SignWell id + recipient emails), `lease.signed`, `lease.activated`, `lease.signature_failed`. Webhook table stores verified events. Customer UI shows status/channel/document name, not raw correlation ids as the primary label.

---

## 28. Human onboarding simulation

Manager: “I need this resident to sign this document.”

| Question | Answer |
|----------|--------|
| Find the record | Sidebar **Leasing** → resident lease |
| Sent? | Status `pending_signature` + SignWell status + channel |
| Who signs? | Resident email on the lease; manager signer if required |
| Completed? | `signed` / `active` after webhook or Sync — not on Send click |
| Open completed? | Documents strip / Shared Documents + generated text / external SignWell URL |
| Not signed? | Sync, or Record signed offline |

Signer: SignWell email → hosted sign → confirmation on SignWell. They do not need M.P.A. training for the hosted step.

---

## 29. Click counts / dead ends

| Action | Clicks |
|--------|--------|
| Open lease from PM home | Leasing → row (~2) |
| Send | +1 on draft |
| See status | 0 extra (same page) |
| Sync / offline recovery | +1 |
| Technician / FO-only Send | Dead end avoided — no nav / 403 |

No Send button after an active SignWell request (this package). No second document system.

---

## 30. Tests / typecheck / lint / build

| Check | Result |
|-------|--------|
| Focused SignWell tests | **22 passed** (correlation, isolation, webhook gates + document-id activation + metadata rejection) |
| Shared typecheck | Pass |
| Web typecheck | Pass |
| UI typecheck | Pass |
| Changed-source lint | Pass |
| `pnpm --filter @mpa/web build` | Pass (204 pages) |
| Pre-existing | `tenant-portal-billing-copy.test.ts` still expects literal `stripe_payment_execution_enabled` — **not changed** |

---

## 31. P0 findings

**None.**

`SIGNWELL_TEST_MODE` defaulting to test is a **configuration** gate for Production UAT, not a secret exposure or forged-completion bug.

---

## 32. P1 findings

| ID | Finding | Disposition |
|----|---------|-------------|
| P1-01 | Webhook preferred `metadata.lease_id` over `signwell_document_id` | **Fixed in-repo** |
| P1-02 | Repeat Send created a new SignWell document and overwrote the id | **Fixed in-repo** |
| P1-UAT | No Production send→sign→webhook row exists | **UAT still required** |

---

## 33. P2 findings

Do **not** implement from this package.

- Recent/Search polish unrelated to SignWell.
- Client bundle includes SignWell **env names** (Master Admin ops + shared Zod schema).
- Offline / unconfigured notices mention `SIGNWELL_API_KEY`.
- Completed PDF is not ingested into private media (by design; confirm URL in UAT).
- No M.P.A. reminder/cancel/resend.
- Master Admin ops panel always reads “not configured” in the browser.

---

## 34. Remediations implemented

1. `resolveSignWellLeaseCorrelation` — stored document id is authoritative; metadata mismatch is ignored.
2. Webhook lookup **only** `.eq("signwell_document_id", documentId)`.
3. `alreadyHasActiveSignWellRequest` — second Send does not call SignWell.
4. Lease UI hides Send once a SignWell id exists.
5. Resident email required before send.
6. Focused tests for the above.

No schema change. No deploy.

---

## 35. Production configuration readiness

| Item | Readiness |
|------|-----------|
| API key | cannot verify safely |
| Webhook secret | cannot verify safely |
| Webhook endpoint | designed; **0 events received** |
| `SIGNWELL_TEST_MODE=false` | required for non-test UAT |
| Schema | ready |
| This app SHA on Production | **not deployed** (`dcf63210` is in-repo only) |

---

## 36. Exact controlled Production UAT still required

Do **not** execute from this package.

1. Deploy this SHA only after separate Owner authorization.  
2. Create one labeled UAT lease on a synthetic org (not a real customer legal document).  
3. Use a controlled UAT signer email.  
4. Confirm `SIGNWELL_TEST_MODE` intent (test vs live).  
5. Send through SignWell.  
6. Open the SignWell email on phone and desktop.  
7. Sign.  
8. Confirm webhook row + M.P.A. `active`.  
9. Replay the same webhook; status stays `active`.  
10. Open Documents / external file.  
11. Confirm another org cannot read the lease.  
12. Confirm a second Send does not create another SignWell document.  
13. Leave disposable drafts only.

---

## 37. Production safety snapshot

Read-only. No mutations from this audit.

| Gate | Result |
|------|--------|
| Tenant payment execution TRUE | **0 of 6** |
| Tenant payment processed | **No** |
| July freeze | **ON** |
| M5 | Unauthorized |
| SaaS prices | **$59 / $59 / $109** |
| Connect / AutoPay / complimentary / routing / public request | **Unchanged** |

---

## 38. Final verdict

**SIGNWELL DOCUMENTS IN-REPO CERTIFIED — PRODUCTION UAT REQUIRED**

**STOP.** Do not deploy without a new Owner authorization. Do not start another feature.
