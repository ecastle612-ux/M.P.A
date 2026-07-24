# 06 — Security and Compliance

**Package:** FIN-003  
**Status:** ✅ **Approved**

---

## Custody compliance (binding)

| Rule | Requirement |
|------|-------------|
| Not a money transmitter | M.P.A. does not take custody of rent for redistribution |
| No customer fund holding | No platform rent float; destination charges to org Express |
| Stripe moves money | All transfers/payouts via Connect |
| Property accounting SoR | Allocations reconcile to ledger facts |
| SaaS independence | BILL-001 completely separate (ADR-024) |
| Disclosed fees only | Application/platform fees transparent |

Legal classification of money-transmitter licensing is a **compliance assumption** for counsel review at Approve — engineering follows the custody architecture above.

---

## RBAC

| Capability (conceptual) | Who | Allows |
|-------------------------|-----|--------|
| `financial:read` | Owner (scoped), PM | View payout history/pending |
| `payout:onboard` (or reuse profile/financial update) | Owner | Start own Connect onboarding |
| `payout:manage` | PM admin | Runs, retries, schedule config |
| `payout:manual_override` | Elevated PM / MA with audit | Constrained interventions |
| Owner property ACL | `resolveOwnerPropertyScope` | Owner reads limited to authorized properties |

Owners **must not** receive ledger mutate, org Connect admin, or SaaS billing powers via FIN-003.

---

## Webhook signature validation

- Verify Stripe signatures with **Connect-rail** webhook secret  
- Reject invalid / missing signatures  
- Separate secrets from payments and SaaS rails  

---

## Replay protection

- Persist processed Stripe `event.id` uniquely  
- Duplicate delivery → ack success, no re-apply side effects  
- Prefer upsert by Stripe object ID for status mirrors  

---

## Idempotency

- All transfer creates require idempotency keys  
- Retries reuse the same key for the same attempt  
- Scheduled jobs must be safely re-entrant  

---

## Audit logging

Log at minimum:

- Onboarding link creation  
- Eligibility changes  
- PayoutRun create/execute  
- TransferIntent / attempt outcomes  
- Manual retries/cancels/adjustments  
- Webhook apply summaries (not full PII payloads)

---

## Secrets management

| Secret | Storage |
|--------|---------|
| Stripe platform secret key | Server env / secret manager |
| Connect webhook secret | Server env / secret manager |
| Publishable keys | Client-safe only where required |

Never commit secrets; never expose secret keys to Owner Portal clients.

---

## Least privilege

- Server-only ConnectProvider  
- RSC/API routes check authz before any payout mutation  
- Master Admin diagnostics read-mostly unless audited override path Approved  
- No broad service-role use for owner reads when RLS/user client suffices  

---

## Failure handling (security lens)

- Fail closed on authz / signature failure  
- Do not leak other owners’ amounts in errors  
- Rate-limit onboarding link creation  
- On provider outage: show unavailable; do not mark Paid  

---

## Monitoring

| Signal | Why |
|--------|-----|
| Webhook failure rate | Silent drift risk |
| Transfer failure rate | Owner trust |
| Restricted account count | Onboarding friction |
| Job lag (schedule → execute) | Ops SLA |
| Idempotency conflict spikes | Double-pay attempts |

Alerting belongs on existing ops/monitoring channels (no new APM product required).

---

## Compliance assumptions (for Approve)

1. Counsel confirms Connect Express destination-charge model meets product custody claims.  
2. US-first KYC/bank rails initially.  
3. 1099 / tax reporting not automated in v1 (data export hooks optional).  
4. PCI: card data remains with Stripe (API-005); FIN-003 does not touch PAN.  
5. Payout disclosures in Owner Portal meet commercial honesty bar (DPX).  
