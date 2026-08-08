# Slice D — Failure Recovery Verification

| Scenario | Behavior | Verification |
|----------|----------|--------------|
| Identity created, org fails | `failed_retryable`; resume retries org create; no second identity invent | Compensation in `customer_linked` case |
| Org created, activation fails | Retry entitle; do not create second org | `org_created` case + `markProvisioningRetry` |
| Email verification timeout | Job stays `owner_pending`; continue URL + bind token resume later | Continue page + claim API |
| Webhook replay | Duplicate event ack; same job / org ids | `webhook.test.ts` + runner idempotency test |
| Transient failure mid-pipeline | Resume from last successful checkpoint | `resumeFromRetryable` + runner retry test |
| Missing checkout email | `failed_dead` | Runner test |
| Email mismatch on claim | Deny; audit remains; no bind | Claim test |
| Invalid / expired bind token | Deny when token supplied | Claim test |
| Poison after 8 attempts | `failed_dead` | Shared `markProvisioningRetry` |

Emails: `failure_recovery` on retryable failure; `continue_setup` / `verification` for resume UX.

**Never:** orphaned paid orgs without forward repair path; duplicate subscriptions invented on retry; duplicate identities on webhook replay.
