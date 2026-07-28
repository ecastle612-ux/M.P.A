# 12 — SignWell Migration (API-004 Amendment)

**Package:** API-004  
**Status:** Approved · Implemented  
**ADR:** [ADR-030](../18-decision-log/adr-030-signwell-as-primary-esign-provider.md)  
**Date:** 2026-07-27

---

## Objective

Replace Dropbox Sign with **SignWell** as the sole V1.0 production e-sign provider **without** redesigning API-004.

```
Business workflows → SignatureService → SignatureProvider → SignWellProvider
```

---

## Feature-parity matrix

Capabilities actually used by the prior `DropboxSignProvider` vs SignWell API (developers.signwell.com, Jul 2026):

| Capability | Dropbox Sign (MPA usage) | SignWell | V1.0 verdict |
|------------|--------------------------|----------|--------------|
| API authentication | Basic auth API key | `X-Api-Key` header | **Parity** |
| Create + send document | `POST /signature_request/send` | `POST /documents` (`draft: false`) | **Parity** |
| Unsigned PDF without field coords | File upload | `with_signature_page: true` | **Parity** (required for send) |
| Multi-signer + order | `signers[].order` | `recipients` + `apply_signing_order` | **Parity** |
| Package metadata | `metadata[mpa_*]` | `metadata` object | **Parity** |
| Test / sandbox | `test_mode` + no-key stub | `test_mode` + no-key stub | **Parity** |
| Get status | `GET /signature_request/{id}` | `GET /documents/{id}` | **Parity** |
| Cancel in-flight | `POST .../cancel` | `DELETE /documents/{id}` (cancels signing) | **Parity** |
| Remind signers | `POST .../remind` | `POST /documents/{id}/remind` | **Parity** (all pending; not per-recipient) |
| Download completed PDF | `GET .../files` | `GET /documents/{id}/completed_pdf` | **Parity** |
| Certificate of completion | Stub placeholder PDF | Audit trail embedded in completed PDF | **Parity** (same practical outcome; companion artifact from completed PDF) |
| Webhooks | Body HMAC + `DROPBOX_SIGN_WEBHOOK_SECRET` | Event hash HMAC with **webhook ID** (`type@time`) | **Parity** (different verify model; officially documented) |
| Events: sent / viewed / signed / completed / declined / expired / cancelled / failed | Mapped | `document_*` events including `document_error` | **Parity** |
| Signing URL on create (live email flow) | Not returned | Optional `embedded_signing` | **Parity** (email ceremony; same as prior live path) |

### Critical gaps

**None** for V1.0 relative to the prior adapter surface.

### Non-critical notes

| Note | Handling |
|------|----------|
| Remind is document-wide, not per recipient | Acceptable; domain still calls `remindRecipient` |
| Webhook key is webhook ID, not a shared secret | Env: `SIGNWELL_WEBHOOK_ID` |
| Historical `provider=dropbox_sign` rows | Complete/void before cutover; adapter removed |
| Future DocuSign / Adobe adapters | Still allowed by interface; not V1.0 |

---

## Environment variables

```
SIGNATURE_PROVIDER=noop|signwell
SIGNWELL_API_KEY=
SIGNWELL_WEBHOOK_ID=
SIGNWELL_MODE=sandbox|production
SIGNWELL_ALLOW_SIMULATE=true|false
SIGNWELL_API_BASE_URL=   # optional; default https://www.signwell.com/api/v1
SIGNWELL_ACCOUNT_ID=     # optional; unused unless API requires application scoping
```

Retired (removed):

```
DROPBOX_SIGN_*
HELLOSIGN_*
```

---

## Webhook

- Route: `POST /api/webhooks/signature/signwell`
- Verify: HMAC-SHA256(`type@time`, key=`SIGNWELL_WEBHOOK_ID`) vs `event.hash`
- Idempotency: existing `integrations_webhook_events` + domain apply path
- Simulate: `PUT` with `SIGNWELL_ALLOW_SIMULATE` (blocked in production unless explicitly enabled)

---

## Stop condition (satisfied)

Migration proceeded because no required V1.0 capability was missing. If a future SignWell API regression removes completed PDF download, webhook hash verification, or multi-signer send, reopen Design → Document → Approve before changing the interface.
