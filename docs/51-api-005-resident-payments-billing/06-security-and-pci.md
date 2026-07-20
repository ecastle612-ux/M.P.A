# 06 — Security and PCI

**Package:** API-005  
**Status:** Draft — Ready for Approval

---

## PCI scope minimization

| Store in M.P.A. | Never store |
|-----------------|-------------|
| Provider customer ID | Full PAN |
| Payment method token / ID | CVV / CVC |
| Last4, brand, exp month/year (display) | Full bank account + routing |
| Amounts, currency, status | Magstripe / track data |
| Webhook event digests | Raw card payloads in logs |

Card/bank capture happens in **provider-hosted fields** (e.g. Stripe Elements). M.P.A. aims for SAQ A / equivalent posture where feasible; final PCI questionnaire is org + counsel responsibility.

---

## Tokenized payment methods

- Created via `PaymentProvider.attachPaymentMethod`  
- Soft-delete / detach on remove  
- Org + resident scoped RLS  

---

## Webhook security

- Verify provider signatures (Stripe-Signature, etc.)  
- Reject replay outside skew window when timestamps present  
- Idempotent apply  
- Redact sensitive fields before log persistence  

---

## Audit logging

Immutable audit for:

- Charge create/publish/waive/cancel  
- Payment initiate/succeed/fail  
- Refund  
- Credit/adjustment  
- AutoPay enroll/disable  
- Method attach/detach  
- Receipt issue / download (optional for downloads)  

---

## Access control

- Least privilege (`financial:*`)  
- Organization isolation via RLS  
- Resident sees only own ledger/methods  
- Encrypted-at-rest for financial metadata JSON where platform supports  

---

## Receipt integrity

- Receipt number unique per org  
- Content hash of receipt payload  
- Append-only; corrections via credit memo / adjusted receipt lineage  

---

## Refund audit

- Actor, reason code, amount, provider refund ID, linked payment  
- Cannot silently delete payment history  

---

## Explicit prohibitions

- AI must **never** initiate charges, refunds, or AutoPay changes  
- Business modules must **never** call payment SDKs directly  
- Do not log full account numbers even in “debug” modes  
- Do not bypass BillingService for “just this one Stripe call”
