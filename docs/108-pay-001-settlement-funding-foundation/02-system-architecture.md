# 02 — System Architecture

**Package:** PAY-001  
**Status:** 📝 Draft (amended · [11](./11-architecture-amendments.md))  
**Rule:** Compose existing systems — **do not redesign** Owner Portal, BILL-001, or FIN-003 transfer stack.

---

## Layering

```
Resident / PM UI (existing API-005 / portal checkout)
  → BillingService (API-005)
    → PaymentProvider (Stripe adapter)  ← PAY-001 extends here
        → Stripe Payments + Connect destination routing
  → Operational ledger (API-005 / Phase 10)
  → Org settlement account mirror (FIN-003 connect_accounts, purpose=org_settlement)
  → Audit Log
  → Kill switches / feature flags
```

**PAY-001 does not introduce OwnerPayoutService transfer methods.**  
**PAY-001 does not call `createTransfer`.**

---

## Integration map

| System | PAY-001 use | Must not |
|--------|-------------|---------|
| **API-005 PaymentProvider** | Destination + application fee on create Checkout/PI | Bypass provider; put Stripe SDK in random modules |
| **API-005 webhooks** `/api/webhooks/payments/*` | Settle payment success/failure; refunds as today + destination rules | Handle Connect `transfer.*` owner payouts |
| **FIN-003 connect_accounts** | Read org settlement `external_account_id` + readiness | Own owner transfer orchestration |
| **FIN-003 Connect webhooks** | Account readiness only if needed | Implement owner transfer apply |
| **Ledger** | Append payment/fee/refund facts | Become full GL |
| **BILL-001** | None | Shared customers/webhooks |
| **Notification Service** | Optional: org settlement not ready / funding failures | New product |
| **RBAC** | Existing financial/billing capabilities | New auth framework |

---

## Fund-flow architecture (PAY-001)

```
Resident → Stripe Payment (API-005 + PAY-001 routing)
         → Destination charge → Org Settlement Express
         → Application fee → M.P.A. platform account
Org Settlement Express balance
         → (STOP — FIN-003 Phase C later may transfer to owners)
```

---

## Provider boundary

| Port | Responsibility |
|------|----------------|
| `PaymentProvider` | Create/settle resident payments; **PAY-001 adds** destination + fee inputs |
| `ConnectProvider` | Express accounts / status (FIN-003) — **read for readiness**; no transfers in PAY-001 |

---

## Explicit non-architecture

- No OwnerPayoutService allocation/transfer redesign  
- No merging `/api/webhooks/saas` with payments  
- No platform→owner rent transfer path  
- No new Owner Portal IA  

---

## Dependency on FIN-003 Phase A/B

PAY-001 **requires** org settlement Connect accounts to exist (FIN-003 Phase A/B). PAY-001 does not recreate onboarding; it **gates** charges on settlement readiness.
