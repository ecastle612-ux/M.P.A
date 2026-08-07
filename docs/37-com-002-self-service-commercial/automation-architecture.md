# COM-002 — Automation Architecture

**Parent:** [COM-002 Index](./index.md)  
**Status:** Draft  

---

## Principle

For Professional and Business: **nothing manual**.

Humans appear only for Enterprise sales/implementation and exceptional support.

---

## Automation catalog

| Area | Automated behavior |
|------|--------------------|
| Organization creation | Created by provisioner after paid/trialing Checkout |
| User creation | Auth user created/bound from Checkout email; owner membership attached |
| Stripe customer | Created by Checkout; stored link `saas_customers` |
| Subscription lifecycle | Webhook-driven status sync |
| Trial handling | Start, remind, convert/cancel automatically |
| Module activation | Entitlement set applied from CatalogOffer — no operator SKU click |
| Guided Setup | Opens with org pre-created; checklist auto-marks provisioning items |
| Email verification | Auth verify flow triggered post-account |
| Welcome emails | On provisioning success |
| Billing | Stripe invoices + Portal |
| Renewals | Stripe automatic collection |
| Failed payments | Retries + emails + grace → fail closed |
| Cancellation | Portal/in-app → period-end revoke |
| Upgrade / downgrade | In-app → Stripe update → entitlement reconcile |
| Re-activation | Resubscribe → entitlement restore |
| Seat changes | Quantity/limit update + enforce |
| Property limits | Enforce on create |
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
