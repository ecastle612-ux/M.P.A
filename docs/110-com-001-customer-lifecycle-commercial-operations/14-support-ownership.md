# 14 — Support Ownership

**Package:** COM-001  
**Status:** Draft — Awaiting Approval  
**Related:** AUTH-001 [30 Support escalation](../109-auth-001-organization-provisioning-authentication/30-support-escalation-levels.md)

---

## Commercial support ladder

```
Level 0 — AI Assistant
    ↓
Level 1 — Organization Administrator
    ↓
Level 2 — Customer Success
    ↓
Level 3 — Technical Support
    ↓
Level 4 — Master Administrator
```

### Label mapping (avoid confusion with AUTH platform “Level 0”)

| COM label | Actor | AUTH-001 support doc analogue |
|-----------|-------|-------------------------------|
| **L0 — AI Assistant** | In-product help AI | L0 AI |
| **L1 — Organization Administrator** | Customer workspace owner | L1 Org Admin |
| **L2 — Customer Success** | Post-sale relationship / commercial health | (AUTH lumped some into L2 Support) |
| **L3 — Technical Support** | Product defects, provisioning, integrations | L2/L3 technical |
| **L4 — Master Administrator** | Platform operators (`master_admin`) | AUTH L3 Master Admin |

---

## Ownership by commercial issue

| Issue | First owner | Escalate when |
|-------|-------------|----------------|
| Pricing / which plan | L0 → Sales (pre-customer) or L2 CS (customer) | Non-standard discount → Finance |
| Checkout / payment failure | L0 → L2 CS + Billing | Stripe anomalies → L3 |
| Welcome email not received | L1 resend request → L2 → L3 deliverability | Provision incomplete → L3 |
| Org Admin cannot log in | L0 directs to M.P.A. (not self-reset) → L3 verify → **L4** credential re-issue | Always L4 for Org Admin secrets |
| Subaccount lockout | **L1 Org Admin** | L1 unavailable → L2 coordinates; still L1 action preferred |
| Setup stuck (AI) | L0 → L1 → L2 | Convert Professional / L3 if defect |
| Setup stuck (Professional) | Implementation → L2 | L3 defects; L4 access |
| Feature missing (not on plan) | L0 explains entitlements → L2 expansion | — |
| Feature missing (bug) | L2 → **L3** | P0 → L4 if platform-wide |
| Past Due / collection | L2 + Billing | Suspend → L4 for access policy |
| Cancellation / refund | L2 → Billing / Finance | Disputes → Finance |
| Ownership dispute | L2 → **L4** + recovery contact | Immediate L4 |
| Suspend / reactivate org | L2 request → **L4** | Compliance |
| Renewal negotiation | L2 (+ Sales Enterprise) | Executive sponsor |
| Data export after cancel | L2 → L3 | Legal hold → L4 |

---

## Authority matrix (commercial)

| Action | L0 | L1 | L2 CS | L3 Tech | L4 Master |
|--------|----|----|-------|---------|-----------|
| Explain plan / limits | ✔ | ✔ | ✔ | ✔ | ✔ |
| Change subscription plan | ✖ | Portal if entitled | Assist | ✖ | Audited exception |
| Issue Org Admin temp password | ✖ | ✖ | ✖ | Verify only | ✔ |
| Reset subaccount password | ✖ | ✔ | ✖* | ✖* | Audited exception |
| Suspend organization | ✖ | ✖ | Request | Recommend | ✔ |
| Approve refund | ✖ | ✖ | Recommend | ✖ | Finance process (+ L4 if access) |
| Create day-to-day users | ✖ | ✔ | ✖ | ✖ | Exception + audit |

\*L2/L3 must route subaccount resets to L1 unless emergency with audit.

---

## AI Assistant (L0) commercial constraints

- Cannot create organizations or subscriptions  
- Cannot promise discounts  
- Cannot issue credentials  
- Must route Org Admin lockouts to human Support / L4 path  
- Must tell subaccounts to contact their Organization Administrator  
- May explain plan entitlements and Setup Wizard steps  

---

## Acceptance

| ID | Criterion |
|----|-----------|
| SO-01 | Commercial issues map to L0–L4 |
| SO-02 | Org Admin credential re-issue only at L4 |
| SO-03 | Subaccount resets owned by L1 |
| SO-04 | CS owns post-sale health; Tech owns defects |
