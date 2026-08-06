# Master Admin Certification Console

**Parent:** [LAUNCH-001](./index.md)  
**Status:** Draft  
**Rule:** For every Customer Promise, Master Admin must be able to **validate** the workflow.

Master Admin becomes the **certification console** for advertised Property Manager capabilities — not an accounting admin, not a second customer product.

---

## Purpose

| Audience | Job |
|----------|-----|
| Platform operators | Prove each advertised journey works before/after release |
| Launch governance | GO/NO-GO evidence per promise |
| Support | Reproduce customer path without guessing |

Customer chrome must **never** show Master Admin.

---

## Console information architecture (target)

```
Master Admin
└── Launch Certification
    ├── Promise scoreboard (8 PM capabilities)
    ├── Journey runner (J0–J8)
    ├── Entitlement & SKU inspector
    ├── Integration health (Stripe / email / SignWell)
    ├── Event & audit witness
    └── Evidence pack (export for launch review)
```

Until built: operators use the **verification scripts** below manually. Building this console is part of journey delivery (especially J0 + package Approve), not a side quest.

---

## How Master Admin verifies each promise

### Property Management
| Check | Method |
|-------|--------|
| Discover | Impersonation-free: open cert org → confirm Mission Control CTA + Properties create |
| Execute | Create property via Properties; confirm list/detail |
| Entitlement | Org SKU includes `pm.properties`, `pm.mission_control` |
| Evidence | Property id, timestamps, actor audit |

### Leasing
| Check | Method |
|-------|--------|
| Execute | Create lease start→active (and signed per J4) from Leasing |
| Evidence | Lease status history; link to unit/resident |
| Negative | Confirm Facility leasing claims absent |

### Residents
| Check | Method |
|-------|--------|
| Execute | Add resident; portal link state |
| Evidence | Resident record; portal login smoke (test resident) |

### Maintenance
| Check | Method |
|-------|--------|
| Execute | Create WO → assign → close |
| Mission Control | Open WO appears; clears when closed |
| Evidence | Status transitions + audit |

### Vendor Management
| Check | Method |
|-------|--------|
| Directory | Create vendor in Vendors |
| Assignment | Vendor on WO |
| Payables (optional) | Invoice path in FO still works |
| Evidence | Vendor id + WO assignment |

### Financial Operations
| Check | Method |
|-------|--------|
| Snapshot | Command Center metrics non-empty after J5 |
| Collect | Manual pay + (if configured) Checkout/webhook |
| Events | `finance.payment.succeeded` / ledger / receipt |
| Slice board | S0–S3 complete; S4+ still paused unless authorized |
| Evidence | Payment id, receipt number, audit |

### Documents
| Check | Method |
|-------|--------|
| Upload/attach | File on lease/property |
| Retrieve | Download/list |
| Evidence | Document id + attachment target |

### Communications
| Check | Method |
|-------|--------|
| Send notice | Staff → resident |
| Deliver | In-app (email if provider) |
| Evidence | Notice id + delivery status |

---

## Journey certification scripts (operator)

For each journey J0–J8, Master Admin records:

| Field | Value |
|-------|-------|
| Journey id | e.g. J5 |
| Environment | staging / launch candidate |
| Cert org | dedicated PM cert tenant |
| Operator | name |
| Result | Pass / Fail |
| Workaround used? | **Must be No** for Pass |
| Evidence links | ids, screenshots, event ids |
| Date | ISO |

### Minimal Pass bar
- Script completed by operator following **customer** steps (or watching seeded customer user).
- No engineering console, SQL, or token paste.
- Matches advertise copy for that journey.

---

## Entitlement validation (every promise)

Master Admin must confirm:

1. Property Manager SKU grants the module entitlement.  
2. Facility-only orgs **cannot** open PM promises.  
3. Unauthorized deep links fail closed.  
4. Complete Platform includes PM promises without duplicate homes.

---

## Integration health panel (supports promises)

| Integration | Promises affected | MA signal |
|-------------|-------------------|-----------|
| Email delivery | J2 invites, J8 notices | Provider health + last send |
| Stripe platform / Connect | J5 rent | Keys present; Connect account status per org |
| SignWell | J4 | Configured / deferred-by-policy |
| SaaS subscription | J0 | Checkout or white-glove assign log |

---

## Promise scoreboard (MA view)

Mirror [Capability Promises scoreboard](./capability-promises.md):

- Green = all six questions Pass + last journey cert Pass  
- Amber = Conditional  
- Red = Broken  

Launch GO requires **all advertised promises Green** (or formally de-advertised and removed from customer Billing/nav).

---

## Out of scope for Master Admin

- Editing customer ledgers as ERP  
- Facility feature administration (deferred)  
- Acting as the customer’s property manager day-to-day  

---

## Delivery note

Implementing the full Launch Certification console is itself gated:

```
APPROVE LAUNCH-001
→ deliver journeys
→ MA console hardens certification (can ship progressively with J0+)
```

Do not implement from this draft alone.
