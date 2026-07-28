# 26 — Subscription Capability Matrix

**Package:** AUTH-001  
**Amendment:** A01  
**Status:** Binding (Approved with Amendments)

---

## Binding chain

```
Subscription
    ↓
Organization Type
    ↓
Enabled Modules
    ↓
Dashboard
    ↓
Maximum Users
    ↓
Maximum Properties
    ↓
Storage Limits
    ↓
AI Usage
    ↓
Marketplace Access
    ↓
Future Add-ons
```

**Rule:** The Organization Administrator (and all subaccounts) must **only** see features included in their subscription. Nothing purchased must be missing from entitlement enforcement; nothing unpurchased may appear as an available product capability.

Visibility hiding in UI is UX. **Server-side entitlements** (BILL-001 `assertEntitled` + AUTH-001 dashboard/module resolution) are authority.

---

## Resolution order

1. Resolve active SaaS subscription / `plan_code` (BILL-001)  
2. Resolve **organization type** from SKU / plan mapping  
3. Resolve **enabled modules** from plan + add-ons + Level 0 overrides (audited)  
4. Resolve **dashboard family** ([07](./07-dashboard-assignment-rules.md))  
5. Enforce **numeric limits** (users, properties, storage, AI)  
6. Enforce **marketplace** and **add-on** gates  

```
Auth → AuthZ → Entitlements(plan) → Domain action
```

---

## Plan × capability matrix (design defaults)

Numeric caps are commercial defaults for architecture; final Stripe price ↔ cap tables remain BILL-001 ops-owned and may be refined without redesigning this chain.

| Capability | `trial` | `founder` | `professional` | `business` | `enterprise` |
|------------|---------|-----------|----------------|------------|--------------|
| **Organization types allowed** | PM or Owner (SKU) | PM or Owner | PM or Owner | PM or Owner | All Approved types |
| **Primary dashboard** | By org type | By org type | By org type | By org type | By org type |
| **Max users (seats)** | Low (e.g. 5) | Mid | Mid | High | Custom |
| **Max properties** | Low | Mid | Mid | High | Custom |
| **Storage** | Low | Mid | Mid | High | Custom |
| **AI usage** | Limited | Full* | Standard | Elevated | Custom |
| **Marketplace access** | Off / limited | On | On | On | On |
| **Owner portal (PM orgs)** | Per module | Per module | Per module | Per module | Per module |
| **Priority support** | — | ✓ | — | ✓ | ✓ |
| **Future add-ons** | Attachable if SKU allows | Attachable | Attachable | Attachable | Attachable |

\*Founder AI “Full” still org-scoped and rate-limited for platform safety.

Module examples (illustrative): Maintenance, Leasing, Financials, Documents, Messaging, Vendor Marketplace, Owner Portal, AI Copilot, Screening, E-Sign.

---

## Visibility rules

| Situation | UX | Enforcement |
|-----------|-----|-------------|
| Module not on plan | **Do not show** nav/entry points | API returns not entitled |
| Limit reached | Show upgrade CTA on blocked action | Mutation rejected with clear code |
| Add-on not purchased | Hidden | Rejected |
| Level 0 temporary grant | Visible while grant active | Audited override |

**Forbidden:** Teaser modules that look enabled but are dead-ends without an explicit “Upgrade” affordance Approved by Product. Default is **absent**, not disabled-looking clutter.

---

## Organization Administrator experience

Org Admin settings / billing surfaces may show:

- Current plan name  
- Included modules  
- Usage vs limits (users, properties, storage, AI)  
- Upgrade / manage via BILL-001 Customer Portal  

They must not see operational workflows for modules outside the plan.

---

## Relationship to BILL-001

| Concern | Owner |
|---------|-------|
| Money, invoices, Stripe subscription status | BILL-001 |
| Capability matrix & “see only what you bought” | AUTH-001 (this doc) + entitlements service |
| Dashboard family | AUTH-001 [07](./07-dashboard-assignment-rules.md) |

---

## Acceptance (A01)

| ID | Criterion |
|----|-----------|
| CAP-01 | Plan resolves to org type, modules, dashboard, and limits |
| CAP-02 | Unpurchased modules do not appear as available features |
| CAP-03 | Limit overages fail closed server-side |
| CAP-04 | Add-ons extend matrix without breaking the chain |
