# 24 — Slice B Authorization

**Package:** ACQ-001  
**Phrase:** `AUTHORIZE ACQ-001 SLICE B`  
**Status:** ✅ **AUTHORIZED** (2026-07-27)  
**Prerequisite:** Slice A accepted · [21 — Approval](./21-approval-record.md) · OQ-01–OQ-12 locked

---

## Scope (in)

| Item | Detail |
|------|--------|
| Stripe Checkout Session | Create from `/acquire/start` via `POST /api/acquire/checkout` |
| Self-serve plans | Trial, Professional, Business only |
| Plan rejection | Enterprise + Founder → 403 from public Checkout API |
| BILL-001 reuse | `SaasBillingProvider.createCheckoutSession` + existing webhooks |
| Duplicate open subscription | Hard-block by buyer email (409) |
| Contact Sales → COM | Persist / reuse opportunity (`public_contact_sales`) |
| Completion UX | `/acquire/success`, `/acquire/canceled`, `/acquire/error` |
| Provision wire | Webhook + sandbox simulate → `activateOpportunityFromPayment` |
| Auth rule | **No** auto-login after payment; email → `/login` / `/first-login` |

## Scope (out)

| Item | Belongs to |
|------|------------|
| Funnel analytics pipeline | Slice D |
| Production Stripe price cert walk / SEO cert | Slice C/D |
| Redesign BILL / AUTH / COM / Setup | Forbidden |
| Open team registration | Forbidden (AUTH invitation-only) |

---

## Exit criteria

1. Trial / Pro / Business start Checkout Session (sandbox or live)  
2. Enterprise & Founder rejected by API  
3. Contact Sales creates or reuses COM opportunity  
4. Success polls provision; cancel offers resume; error messages cover expired / duplicate / payment failure  
5. Webhook (or sandbox simulate) provisions org via existing COM→AUTH path  
6. No session minted on success page  
7. Automated tests for validation + Contact Sales reuse + sandbox URL template  

---

## Next phrase

```
AUTHORIZE ACQ-001 SLICE C
```
