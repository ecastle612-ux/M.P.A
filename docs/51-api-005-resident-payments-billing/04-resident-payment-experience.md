# 04 — Resident Payment Experience

**Package:** API-005  
**Status:** Draft — Ready for Approval

---

## Principles

- **Mobile first** — primary pay path usable on phone  
- **Friendly errors** — map provider codes to plain language; never expose raw Stripe errors  
- **Stay in M.P.A.** — dashboard, history, AutoPay, receipts owned by product UI  
- **Trust** — clear amounts, due dates, fees (if any), and receipt after success  

---

## Payment dashboard

| Section | Content |
|---------|---------|
| Balance due | Total outstanding across open charges |
| Upcoming | Next scheduled rent / published charges |
| Past payments | Recent succeeded payments |
| Quick pay | CTA for full or selected charges |
| AutoPay status | Enrolled / not enrolled / action needed |
| Alerts | Failed payment, past due, method expiring |

---

## Supported resident actions (Phase 1)

| Action | Notes |
|--------|-------|
| One-time pay | ACH and/or card via PaymentProvider |
| Partial pay | Allowed per org policy |
| Multiple charges | Select or FIFO default |
| Save payment method | Tokenized only |
| AutoPay enroll / disable | Explicit consent + audit |
| View / download receipts | Immutable |
| Retry failed payment | Recovery flow |
| Payment history | Filterable list |

---

## AutoPay

1. Resident chooses method + agrees to terms (versioned disclosure).  
2. `BillingService.enrollAutoPay` stores enrollment + method ref.  
3. On due date, service creates attempt; failures notify + retry per org cadence (configurable).  
4. Disable anytime; does not delete history.

AI must **never** enroll or change AutoPay.

---

## Failed payment recovery

| Step | UX |
|------|----|
| Immediate | Banner + push/email (API-001) |
| Retry | Suggested dates / update method |
| Escalation | After max retries → PM collections visibility |

---

## Payment methods UI

- List brand/last4/bank name (provider-safe display fields only)  
- Set default  
- Remove (detach via provider)  
- Add new via Elements / bank link (provider-hosted fields)

---

## Receipts

After `succeeded` (or org policy for ACH acceptance):

- Receipt number, amount, method summary, charges applied, timestamp  
- Available in portal + email link  
- Content hash retained for integrity (see [06](./06-security-and-pci.md))

---

## Accessibility & empty states

- Clear empty state when no charges (“You’re all caught up”)  
- Loading / processing states during 3DS / ACH  
- No dead ends after failure — always a next action  

---

## Out of scope (Phase 1 resident UX)

- In-app payment plans wizard  
- Cryptocurrency  
- Cash/check QR (may be PM-recorded only)
