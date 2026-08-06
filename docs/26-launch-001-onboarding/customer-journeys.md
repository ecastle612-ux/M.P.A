# Customer Journeys (replaces engineering slices)

**Parent:** [LAUNCH-001](./index.md)  
**Status:** Draft  
**Rule:** Authorize and deliver by **journey**, not by internal module.

Engineering slices L0–L6 are **retired** as the primary plan. Work may still touch modules, but **done** means the journey completes unaided.

---

## North-star journey (must succeed)

```
Customer purchases Property Manager
        ↓
Organization created
        ↓
Property added
        ↓
Staff invited
        ↓
Resident added
        ↓
Lease created
        ↓
Lease signed
        ↓
Rent collected
        ↓
Maintenance request submitted
        ↓
Vendor assigned
        ↓
Issue resolved
        ↓
Owner reviews property
```

Every step must complete successfully without workarounds.

---

## Journey catalog

| ID | Journey (customer outcome) | Promises exercised | Status today | Launch |
|----|----------------------------|--------------------|--------------|--------|
| **J0** | Buy Property Manager and reach a trusted home | Purchase, Setup, Mission Control | Partial | Blocked |
| **J1** | Add first property | Property Management | Fail | Blocked |
| **J2** | Invite staff who can log in and help | Organizations / team | Fail | Blocked |
| **J3** | Add resident and create lease | Residents, Leasing | Fail | Blocked |
| **J4** | Sign (or honestly record) the lease | Leasing, Documents | Fail | Blocked |
| **J5** | Collect first rent | Financial Operations, Residents | Conditional | Blocked* |
| **J6** | Run a maintenance job with a vendor | Maintenance, Vendors | Fail | Blocked |
| **J7** | Owner reviews property money | FO, Property Management, Owner portal | Conditional | Blocked* |
| **J8** | Communicate a notice | Communications | Fail | Blocked |

\*FO pieces exist; journey still blocked by discovery, Connect, and upstream J0–J4.

---

## J0 — Purchase → trusted home

```
Purchase Property Manager
  → Account + email verification
  → Organization created (SKU assigned — not shopped)
  → Guided Setup completes commercial + “you’re in”
  → Mission Control shows one clear next action
```

| Field | Content |
|-------|---------|
| Current | SKU simulate; Setup commercial-only; Mission Control stub |
| Blockers | No real purchase (or white-glove policy); empty home |
| Fix | Purchase path **or** Admin assign + remove SKU picker; Mission Control CTA |
| MA verify | Org has PM SKU; Setup state; Mission Control cert script |

**Authorize as:** `AUTHORIZE LAUNCH-001 JOURNEY J0`

---

## J1 — Property added

```
From Mission Control / Setup / Properties
  → Create property (+ unit)
  → See it in portfolio
  → Open property context
```

| Field | Content |
|-------|---------|
| Current | Create only in FO desk; Properties list is money health |
| Blockers | Wrong surface; Setup silent |
| Fix | Properties create; Setup step; MC CTA |
| MA verify | Property exists; created via Properties path |

**Authorize as:** `AUTHORIZE LAUNCH-001 JOURNEY J1`

---

## J2 — Staff invited

```
Settings → Invite teammate
  → Email delivered with accept link
  → Teammate accepts
  → Lands with correct role
  → Appears in memberships
```

| Field | Content |
|-------|---------|
| Current | DB invite; no email; no link in UI |
| Blockers | Unaided invite impossible |
| Fix | Email + copy-link; role defaults; role manage |
| MA verify | Invitation sent event; accept; membership role |

**Authorize as:** `AUTHORIZE LAUNCH-001 JOURNEY J2`

---

## J3 — Resident added → lease created

```
Residents / Leasing
  → Add resident
  → Create lease on unit
  → Status active (pre-signature if J4 separate)
  → Visible on property
```

| Field | Content |
|-------|---------|
| Current | FO-only lease+resident bundle; module stubs |
| Blockers | Advertised modules empty |
| Fix | Real Residents + Leasing MVP create flows; FO consumes lease |
| MA verify | Resident + lease records; created outside FO-only workaround |

**Authorize as:** `AUTHORIZE LAUNCH-001 JOURNEY J3`

---

## J4 — Lease signed

```
Lease ready
  → Send for e-sign OR upload signed PDF / mark signed offline
  → Status = signed
  → Document retrievable
```

| Field | Content |
|-------|---------|
| Current | SignWell absent; Documents stub |
| Blockers | Cannot fulfill “signed” honestly |
| Fix | SignWell **or** offline signed path + Documents MVP; advertise truth |
| MA verify | Lease status signed + document attached |

**Authorize as:** `AUTHORIZE LAUNCH-001 JOURNEY J4`

---

## J5 — Rent collected

```
Financial Operations
  → Post rent due
  → Resident pays online OR staff records payment
  → Receipt / balance updates
  → Command Center reflects collection
```

| Field | Content |
|-------|---------|
| Current | FO S0–S3 works; Connect UI gap; not in Setup |
| Blockers | Discovery; Connect self-serve; Stripe env |
| Fix | Setup/MC route to FO; Connect onboarding; keep FO single money system |
| MA verify | Charge + payment + receipt + snapshot; webhook if online |

**Authorize as:** `AUTHORIZE LAUNCH-001 JOURNEY J5`

---

## J6 — Maintenance → vendor → resolved

```
Maintenance request submitted
  → Vendor assigned
  → Work progresses
  → Issue resolved / closed
  → Mission Control clears the item
```

| Field | Content |
|-------|---------|
| Current | Both modules stubs; FO vendor AP ≠ assignment |
| Blockers | Entire ops loop |
| Fix | WO MVP + Vendors directory/assign; MC queue |
| MA verify | WO lifecycle + assignment; optional FO invoice after |

**Authorize as:** `AUTHORIZE LAUNCH-001 JOURNEY J6`

---

## J7 — Owner reviews property

```
Owner opens portal financials (or PM shares snapshot)
  → Sees income, expenses, outstanding, occupancy
  → Reviews property-level money
  → (Optional) downloads summary
```

| Field | Content |
|-------|---------|
| Current | Owner financial summary + CSV (FO S3) exists |
| Blockers | Depends on J1/J5 data; owner role provisioning; discovery |
| Fix | Ensure owner membership path; link from property; keep non-accounting language |
| MA verify | Owner user sees summary for org properties |

**Authorize as:** `AUTHORIZE LAUNCH-001 JOURNEY J7`

---

## J8 — Notice / communication

```
Staff sends notice to resident
  → Resident receives in-app (and email if configured)
  → History visible on resident/communications
```

| Field | Content |
|-------|---------|
| Current | Communications stub; FO money notifications only |
| Blockers | Module empty while advertised included |
| Fix | Notices MVP **or** de-advertise |
| MA verify | Notice created + delivered flag |

**Authorize as:** `AUTHORIZE LAUNCH-001 JOURNEY J8`

---

## Suggested delivery order (outcomes)

```
J0  Purchase → trusted home
J1  Property added
J2  Staff invited
J3  Resident + lease
J4  Lease signed (or scoped offline honesty)
J5  Rent collected
J6  Maintenance + vendor resolved
J7  Owner reviews property
J8  Communications notice
```

Parallelism allowed only when journeys do not share unfinished blockers (e.g. J7 after J5 data exists).

---

## Authorization protocol

```
APPROVE LAUNCH-001
AUTHORIZE LAUNCH-001 JOURNEY J0
AUTHORIZE LAUNCH-001 JOURNEY J1
…
```

Do **not** implement until Approve.  
Do **not** use retired `AUTHORIZE LAUNCH-001 SLICE Ln` as the primary gate.

---

## Definition of done (per journey)

- [ ] Six promise questions Pass for every capability the journey claims  
- [ ] First-time customer script succeeds without support  
- [ ] Master Admin certification script Pass  
- [ ] No workaround (FO lore, token paste, env-only secrets undocumented)  
- [ ] Advertise copy matches shipped behavior  
