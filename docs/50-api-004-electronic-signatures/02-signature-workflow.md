# 02 — Signature Workflow

**Package:** API-004  
**Status:** Draft — Ready for Approval

---

## End-to-end lifecycle

```
Lease Created (or other document context)
  → Generate Signing Package
  → Assign Signers (order + roles)
  → Preview Documents
  → Send Invitations (via SignatureProvider)
  → Reminder Schedule
  → Partial Signatures
  → Completed Signatures
  → Executed Document(s)
  → Vault Storage + Certificate
  → Timeline Event
  → Lease Status = Executed (when lease package)
  → Resident Activated (when workflow requires)
  → Notifications
  → Operations Center Updated
  → Command Center Indexed
```

Upstream dependency (leasing path): API-003 screening **approved / conditionally approved** → lease generation → API-004 package. Non-lease document types may start without screening.

---

## Domain objects

| Object | Responsibility |
|--------|----------------|
| **Signature package** | M.P.A. system of record for one signing ceremony (may wrap one provider envelope) |
| **Package document** | Source PDF/template instance included in the package |
| **Recipient** | A required or optional signer / CC / viewer |
| **Reminder** | Scheduled or manual nudge for outstanding recipients |
| **Certificate** | Provider certificate of completion metadata + vault artifact |
| **Audit event** | Immutable timeline of package actions |

Existing RX-001 `signature_requests` is a **seed stub**. After Approve, implement extends it into the package model (or migrates into `signature_packages` with compatibility view) — design prefers a richer package + recipients model without abandoning lineage to applicant/lease.

---

## Package states

| State | Meaning |
|-------|---------|
| `draft` | Package assembled; not sent |
| `ready_to_send` | Documents + recipients validated; preview OK |
| `sent` | Provider envelope created; invitations out |
| `in_progress` | At least one recipient viewed or signed; not complete |
| `partially_signed` | ≥1 required signer complete; others outstanding |
| `completed` | All required signers signed |
| `declined` | A required signer declined (terminal unless restarted) |
| `expired` | Past expiration without completion |
| `cancelled` | PM/system cancelled before completion |
| `failed` | Provider failure after retries exhausted |
| `voided` | Completed package administratively voided (rare; audited) |

**Note:** `partially_signed` may be aliased to `in_progress` in UI; both are valid tracking labels. Implementation should persist a single canonical status plus derived progress.

---

## Recipient states

| State | Meaning |
|-------|---------|
| `pending` | Not yet invited (draft) |
| `invited` | Invitation sent |
| `viewed` | Opened signing session |
| `signed` | Signature captured |
| `declined` | Explicit decline |
| `expired` | Invitation expired |
| `skipped` | Optional recipient skipped by policy |

---

## Signing order modes

| Mode | Behavior |
|------|----------|
| **Sequential** | Recipient *n+1* invited only after *n* signs |
| **Parallel** | All required recipients invited together |
| **Hybrid** | Ordered groups; parallel within group |

Order is stored on recipients (`signing_order` integer / group). Property Manager is often last for countersignature; Owner optional last or parallel with PM per org policy.

---

## Lease execution path

1. Lease exists in M.P.A. (`leases`) with draft/pending_signature status.
2. PM (or automation) creates signature package linked to `lease_id` (+ optional `applicant_id`, `screening_case_id`).
3. Template merge produces lease PDF → package document.
4. Recipients resolved from lease parties + PM (+ owner if required).
5. Send → provider → webhooks update recipients.
6. On `completed`:
   - Pull executed PDF + certificate via provider (or webhook payload refs)
   - Store in Document Vault (API-002A / vault_documents)
   - Set lease status to `executed` (or org-equivalent)
   - Emit timeline events
   - Optionally trigger **Resident Activation** workflow (create/link tenant resident record, portal access)
7. Notifications to all parties + Ops widgets refresh.

---

## Non-lease packages

Same engine, different `document_type` and entity links:

| Type | Typical link |
|------|----------------|
| Lease renewal | Existing lease + resident |
| Pet / parking agreements | Lease or resident |
| Move-in / inspection forms | Lease + unit |
| Owner agreements | Property + owner membership |
| Vendor agreements | Vendor + work order / contract |
| General PDF | Free-form org entity links |

---

## Reminders

| Trigger | Behavior |
|---------|----------|
| Schedule | Org default cadence (e.g. T+24h, T+72h) — **configurable**, not hard-coded product constants |
| Manual | PM “Resend / Remind” from dashboard |
| Cap | Max reminders per recipient; then escalate to Ops “Reminder Queue” |

Reminders go through `SignatureService` → notifications (API-001) and/or provider native reminder APIs via `SignatureProvider.remindRecipient`.

---

## Decline, expire, cancel, restart

| Event | Effect |
|-------|--------|
| Decline | Package → `declined`; audit; notify PM; lease remains unsigned |
| Expire | Package → `expired`; outstanding invitations invalid |
| Cancel | Package → `cancelled`; provider envelope cancelled if supported |
| Restart | New package with `supersedes_package_id` lineage; prior retained for audit |

---

## Timeline events (minimum)

- `signature.package.created`
- `signature.package.sent`
- `signature.recipient.viewed`
- `signature.recipient.signed`
- `signature.recipient.declined`
- `signature.package.completed`
- `signature.package.expired` / `cancelled` / `failed`
- `signature.vault.stored`
- `lease.executed`
- `resident.activated` (when applicable)

---

## Idempotency

Provider webhooks may retry. `SignatureService.applyProviderEvent` must be idempotent on `(provider, external_event_id)` using the shared integrations webhook store pattern (aligned with API-003 / Stripe ingress rules).
