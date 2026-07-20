# 06 — Security and Compliance

**Package:** API-003  
**Status:** Draft — Ready for Approval

---

## Compliance posture (FCRA & related)

M.P.A. designs for **FCRA-aware workflows** for U.S. consumer reports used in rental decisions:

| Obligation | Platform support |
|------------|------------------|
| Disclosure & authorization | Versioned consent + electronic capture ([04](./04-applicant-experience.md)) |
| Permissible purpose | Rental screening purpose coded on order |
| Adverse action | Workflow + templates + delivery audit ([05](./05-property-manager-review.md)) |
| Accuracy disputes | Link to provider dispute process; freeze decision edits with audit note |
| Data minimization | Store normalized summaries + vault artifacts; avoid duplicating full raw JSON long-term |
| Access control | Role permissions + audit on view/download |

**Counsel review required before production.** This package is engineering design, not legal advice. State/local tenant screening laws (e.g., NYC, CA) may impose extra limits — org policy flags reserved.

---

## PII protection

| Data | Handling |
|------|----------|
| Legal name, DOB, address | Encrypted at rest (platform default); RLS |
| SSN / ITIN | Prefer provider-hosted capture; if collected transiently, never log; tokenize/minimize retention |
| Government ID images | Private media assets (API-002A); short-lived signed URLs |
| Full consumer reports | Least-privilege roles; audit every access |
| Logs / analytics | Redact SSN, full report bodies, auth tokens |

---

## Permission model (design)

| Permission | Allows |
|------------|--------|
| `screening:read` | Case status, non-sensitive summaries, Ops widgets |
| `screening:read_full` | Full report / PDF download |
| `screening:create` | Start / re-screen / send consent |
| `screening:decide` | Approve / reject / conditional |
| `screening:admin` | Package config, retention overrides, provider settings |

UI hiding is not security — RLS + server checks enforce.

---

## Organization isolation

- All screening tables scoped by `organization_id`
- RLS denies cross-org reads/writes
- Webhooks resolve org via internal case id, not trust provider org claim alone
- Service role only in Edge Functions / trusted jobs

---

## Audit logging

Mandatory events:

- Consent presented / granted / revoked
- Provider order created / retried / failed
- Report fetched / viewed / downloaded
- Decision recorded
- Adverse action generated / sent
- Retention purge executed
- Permission denied attempts (security monitoring)

Retain audit independently of report purge where legally required (see [07](./07-data-retention.md)).

---

## Encrypted storage & signed documents

- Consent PDFs and report PDFs in private vault/storage
- Signed URLs with short TTL
- Consent records immutable after grant (corrections = new version + audit)

---

## Webhook & API security

- Provider signature verification required
- Idempotency keys on webhook apply
- Rate limits on consent token endpoints
- No provider API keys in client bundles

---

## Least privilege operations

- Support staff: time-bound break-glass with audit (future enterprise)
- Vendors / owners: no screening report access by default
- Residents post-conversion: summary only unless org policy shares more

---

## Future AI (security constraint)

AI may summarize reports for PMs **only** with:

- Explicit `screening:read_full` context
- No autonomous approve/reject
- Prompt/response logged without storing unnecessary raw PII replicas
- Org opt-in

Documented in README; **not implemented** in API-003 Phase 1.
