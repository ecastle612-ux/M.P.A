# COM-002 — Automation Architecture

**Parent:** [COM-002 Index](./index.md)  
**Status:** Approved  

---

## Principle

For Property Manager self-serve: **nothing manual**.

Humans appear only for Enterprise sales motion/implementation, FO/Complete until FO-READY, and exceptional support.

---

## Automation catalog

| Area | Automated behavior |
|------|--------------------|
| Organization creation | Checkpointed provisioner after paid Checkout |
| User creation | Auth bind after **email verification** (A2) |
| Stripe customer | Created by Checkout; `saas_customers` link |
| Subscription lifecycle | Webhook-driven status sync |
| Trial handling | 30-day trial when ≤500 managed units; card required; Live Demo still available |
| Module activation | PM entitlements at `entitled`; usable after `owner_bound` |
| Guided Setup | Org pre-created; capacity/cycle read-only from subscription |
| Email verification | Required before workspace access |
| Welcome emails | On owner_bound / welcome_sent |
| Billing | Stripe invoices + Portal |
| Renewals | Stripe automatic collection |
| Failed payments | Retries + dunning cadence → fail closed |
| SCA / disputes | Action-required UX; dispute_hold fail closed |
| Cancellation | Period-end revoke |
| Additional Unit Capacity | Explicit authorize → next-period recurring price |
| Re-activation | Resubscribe → entitlement restore |
| Unit capacity | Server quote + payment gate; **no seat/property commercial caps** |
| Audit | `subscription_events` + platform audit trail |
| Notifications | In-app + email for commercial events |
| Mission Control | Available when entitlements active + setup rules met |
| Assistant | Uses live signals once org active (no special commercial mode) |
| Demo reset / expiry | Sweeper jobs |
| Enterprise lead routing | Auto-notify sales channel |

---

## Orchestration pattern

```
Event (Stripe | App | Scheduler)
  → Validate + authenticate
  → Idempotency key lookup
  → Transactional write (subscription_events + domain updates)
  → Outbox / queue side effects (email, analytics)
  → Emit metrics
```

**Idempotency keys (examples):**

- `stripe:checkout:{session_id}`  
- `stripe:sub_updated:{subscription_id}:{event_id}`  
- `provision:org:{session_id}`  

---

## Schedulers

| Job | Cadence | Purpose |
|-----|---------|---------|
| Demo sweeper | Hourly | Expire/delete abandoned demos |
| Trial reminder reconcile | Daily | Backup if webhook missed |
| Entitlement reconcile | Daily | Drift detection vs Stripe |
| Past-due enforcement | Hourly | End grace periods |

---

## Explicitly not automated (Enterprise)

| Step | Owner |
|------|-------|
| Consultation scheduling content | Sales |
| Proposal / contract | Sales / Legal |
| Security questionnaire | Sales Eng |
| Initial org create for Enterprise | Master Admin operator |
| Custom entitlement exceptions | Master Admin (audited) |

---

## Observability

- Success/failure rates for provisioning jobs  
- Webhook lag  
- Checkout conversion funnel  
- Demo → paid conversion  
- Past-due count  
- Manual Enterprise provisions count (should dominate human work)
