# 06 — Security and Compliance

**Package:** API-004  
**Status:** Draft — Ready for Approval

---

## Compliance posture (design)

M.P.A. designs for **ESIGN Act** and **UETA**-aligned electronic signature workflows in the United States. This documentation is **not** legal advice. Org counsel must approve templates, disclosures, and certificate retention for their jurisdictions.

| Concern | Design response |
|---------|-----------------|
| Intent to sign | Explicit signer action in provider ceremony |
| Consent to electronic process | Disclosure + acceptance before signing (template + provider UX) |
| Association of signature with record | Provider certificate + M.P.A. audit + vault hash |
| Record retention | Configurable retention; executed copy in vault |
| Tamper evidence | Content hashes; certificate of completion; append-only audit |

---

## Tamper evidence & certificate

On completion, `SignatureService` must:

1. Download executed PDF(s) and certificate of completion (when provider supplies)
2. Compute and store content hashes
3. Persist vault artifacts with immutable version semantics
4. Record provider envelope ID + completion timestamp + recipient IP/UA when available

M.P.A. does not claim to replace the provider’s certificate; it **retains and links** it as the compliance artifact.

---

## Audit trail

Every action audited:

| Event | Actors |
|-------|--------|
| Package create/update/send/cancel | PM / system |
| Recipient invite/view/sign/decline | Signer / provider webhook |
| Reminder sent | PM / system |
| Artifact download | Authorized user |
| Vault store | System |
| Void | Admin |

Audit fields: actor, org, package, recipient, IP (when known), timestamp, correlation ID.

---

## Permissions (proposed)

| Capability | Use |
|------------|-----|
| `signature:create` | Create draft packages |
| `signature:read` | View status / progress (redacted) |
| `signature:send` | Send / remind / resend |
| `signature:cancel` | Cancel in-flight |
| `signature:read_full` | Download executed PDF + certificate |
| `signature:admin` | Org settings, retention, void |

Least privilege: most PM roles get create/read/send; certificate download may be restricted.

---

## Identity verification

Phase 1: email-based invitation + provider session authentication.  
Optional provider features (access codes, SMS, ID verification) exposed as `auth_method` on recipients when the active provider supports them — never assumed universal.

AI must **never** complete identity verification on behalf of a human.

---

## Access to artifacts

- Executed documents served via **short-lived signed URLs** (API-002A pattern)
- No permanent public URLs
- Org isolation via RLS on package and vault rows

---

## Webhook security

- Verify provider signatures/HMAC before apply
- Reject replay outside skew window when timestamps present
- Store raw payloads with PII redaction policy
- Idempotent apply

---

## Secrets

| Secret | Storage |
|--------|---------|
| API keys / OAuth | Server env / vault secrets — never `NEXT_PUBLIC_` |
| Webhook secrets | Server only |
| Access codes | Encrypted at rest if stored; prefer provider-held |

---

## Retention & purge

See [07](./07-document-vault-integration.md). Retention periods are **org-configurable**. Do not hard-code multi-year constants in product code; defaults may be suggested in settings UI copy only.

---

## Explicit prohibitions

- AI must **never** sign documents
- AI must **never** impersonate users or apply signatures
- Business modules must **never** call provider SDKs directly
- Do not log full SSN / government ID from any identity-verification add-on
