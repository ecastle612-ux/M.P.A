# 04 — Stripe Connect Design

**Package:** FIN-003  
**Status:** ✅ **Approved**  
**Binding:** [ADR-023](../18-decision-log/adr-023-stripe-connect-express-owner-payouts.md)

---

## Account types (v1)

| Party | Stripe account type | Purpose |
|-------|---------------------|---------|
| M.P.A. | Platform account | Application fees; Connect platform |
| Property management org | **Connect Express** (settlement) | Receive destination charges |
| Property owner | **Connect Express** (recipient) | Receive transfers; payout to bank |

**Deferred:** Custom accounts. **Rejected for v1:** Standard accounts for owners (full Stripe Dashboard burden).

---

## Charge & transfer model

1. Resident pays via API-005 (Stripe PaymentIntent / Checkout as already implemented).  
2. Funds route as **destination charges** (or equivalent approved Connect charge type) to the **org settlement Express** account.  
3. **Application fee** is taken by the M.P.A. platform (disclosed).  
4. Owner distributions are **Connect Transfers** from org settlement → owner Express.  
5. Owner bank credit occurs via **Stripe Payout** on the owner Express account (automatic or controlled per Stripe settings).

### Forbidden model

```
Resident → Platform balance (M.P.A. holds rent) → later Transfer to owners
```

This would make M.P.A. hold customer money and is **rejected**.

---

## Onboarding UX (Stripe-hosted)

Use Stripe **Account Links** (or Connect embedded onboarding if Approve selects) for:

- Org settlement Express creation/update  
- Owner Express creation/update  
- Requirements remediation (`currently_due` / `past_due`)

M.P.A. stores only Connect account IDs + mirrored capability/requirement flags — not raw KYC documents.

---

## Capabilities & eligibility gates

Before creating a TransferIntent to an owner:

| Check | Required |
|-------|----------|
| Org settlement `charges_enabled` / balance available as needed | Yes |
| Owner account not `disabled` / not fatally `restricted` | Yes |
| Owner `payouts_enabled` (or transfer-capable state per Stripe) | Yes |
| No blocking `currently_due` requirements for transfer | Yes |
| Owner authorized for the property (Owner Portal ACL) | Yes |
| Idempotency key unused | Yes |

---

## Fees transparency

| Fee | Who sees | Notes |
|-----|----------|-------|
| Platform application fee | PM (config); owner (disclosed summary) | Platform revenue |
| Stripe processing fees | As disclosed in product copy | Do not hide material fees |
| Management fees / reserves | From property accounting inputs | Not invented in Connect adapter |

Owner Portal must show **net paid** and material fee/reserve deductions at a level Approve defines (summary vs line-item).

---

## Idempotency

| Operation | Key guidance |
|-----------|--------------|
| Create Express account | `(organizationId|ownerUserId)+purpose` |
| Create transfer | `payoutAttemptId` or `transferIntentId` |
| Webhook apply | Stripe `event.id` unique processed store |

---

## Webhook endpoint separation

| Endpoint (conceptual) | Rail |
|-----------------------|------|
| `/api/webhooks/payments/...` | API-005 rent |
| `/api/webhooks/connect/...` | **FIN-003** |
| `/api/webhooks/saas/...` | BILL-001 |

Never share signing secrets or handlers across rails without an explicit adapter (default: **no sharing**).

---

## Shared Connect primitives vs vendor payouts

ADR-023 allows future reuse of ConnectProvider primitives for vendor marketplace (ADR-004). **Product scopes stay separate** — no FIN-003 tables or Owner Portal UX for vendor payouts.
