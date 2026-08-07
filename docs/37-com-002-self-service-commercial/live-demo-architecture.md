# COM-002 — Live Demo Architecture

**Parent:** [COM-002 Index](./index.md)  
**Status:** Draft  

---

## Goals

- No account required  
- No payment required  
- No real organization created  
- Fully interactive  
- Feels identical to production UX  
- Automatic reset  
- Separate demos for Property Manager, Facility Operations, Complete Platform  
- Instant role switching  
- Isolated from production  

---

## Demo products

| Demo | Surfaces available |
|------|-------------------|
| Property Manager | PM Mission Control, properties, residents, leasing, maintenance, vendors, FinOps (demo data), portals as roles |
| Facility Operations | Facility Mission Control + FO module homes (demo-safe depth; no Capital Projects) |
| Complete Platform | Union — launcher between PM and FO homes |

---

## Session model

```
DemoSession {
  id: uuid
  product: sku
  persona: role
  datasetVersion: string
  createdAt / expiresAt
  lastActiveAt
  conversionOfferHint?: { planTier, billingCycle }
}
```

- Issued as signed httpOnly cookie or short-lived token.  
- **TTL:** default 2 hours; idle timeout 30 minutes (Approve-tunable).  
- Exceed TTL → soft wall with Restart Demo / Start Subscription.

---

## Datasets

| Asset | Description |
|-------|-------------|
| Snapshot templates | Versioned seed per product (properties, people, work orders, invoices — synthetic) |
| Per-session clone | Copy-on-write or schema-separated clone from snapshot |
| Reset | Destroy session clone; rehydrate from snapshot |

**Rules:**

- Synthetic PII only (clearly fake names/emails).  
- No customer production data.  
- No outbound email/SMS to real addresses (notifications stubbed or demo sink).  
- Payments in demo are simulated — never call live Stripe charges.

---

## Role switching

Demo chrome includes a **View as** control:

| Persona | Typical for |
|---------|-------------|
| Property Manager | PM / Complete |
| Facility Operator | FO / Complete |
| Owner | PM / Complete |
| Resident | PM / Complete |
| Vendor | PM / Complete |

Switching rebinds entitlements/persona without new session id; audit as demo-only.

---

## Security

| Control | Requirement |
|---------|-------------|
| Network / DB | Demo data plane isolated (separate schema, DB, or project) |
| Credentials | Demo runtime cannot obtain production service role keys |
| Rate limit | Session create / reset rate limits per IP |
| Abuse | CAPTCHA or bot score on session create if needed |
| Content | No secret exfiltration paths; uploads quarantined / disabled if risky |
| Indexing | `noindex` on demo routes |

---

## Reset strategy

| Trigger | Behavior |
|---------|----------|
| User “Reset demo” | Confirm → rehydrate snapshot |
| TTL / idle | Expire session; next action starts fresh |
| Deploy of new snapshot version | New sessions only; existing expire naturally |
| Daily sweeper | Delete abandoned clones |

---

## Analytics (demo)

Track (privacy-light):

- Demo product entered  
- Time in session  
- Roles switched  
- Reset count  
- CTA clicks: Start Subscription / Request Enterprise  
- Funnel drop-off step  

No invasive session replay of sensitive fields.

---

## Conversion Demo → Paid

1. CTA **Start Subscription** carries `product` (+ optional plan/cycle if chosen in demo chrome).  
2. Lands on Choose Plan / Billing (skip product if known).  
3. Completes J1 Checkout.  
4. Demo session is **not** converted into the production org — production org is freshly provisioned.  
5. Optional: store `demo_session_id` on Checkout metadata for attribution only.

---

## Explicit non-goals

- Persisting demo work into a paid org  
- Real money movement  
- Real vendor/owner notifications  
- Capital Projects in demo  
