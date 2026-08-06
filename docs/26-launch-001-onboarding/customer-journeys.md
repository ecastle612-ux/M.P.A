# Customer Journeys (replaces engineering slices)

**Parent:** [LAUNCH-001](./index.md)  
**Status:** Approved (package) · authorize per journey  
**Rule:** Authorize and deliver by **journey**, not by internal module.  
**Hard rule:** No feature work may bypass an incomplete customer journey.

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
| **J0** | Buy Property Manager and reach a trusted home | Purchase, Setup, Mission Control | **Delivered** — certified | Pass |
| **J1** | Add first property | Property Management | **Delivered** — certified | Pass |
| **J2** | Invite staff who can log in and help | Organizations / team | **Delivered** — MA cert pending | Certifying |
| **J3** | Add resident and create lease | Residents, Leasing | **Delivered** — MA cert pending | Certifying |
| **J4** | Sign (or honestly record) the lease | Leasing, Documents | **Delivered** — MA cert pending | Certifying |
| **J5** | Collect first rent | Financial Operations, Residents | **Delivered** — MA cert pending | Certifying |
| **J6** | Run a maintenance job with a vendor | Maintenance, Vendors | **Delivered** — MA cert pending | Certifying |
| **J7** | Owner reviews property money | FO, Property Management, Owner portal | Conditional | Blocked* |
| **J8** | Communicate a notice | Communications | Fail | Blocked |

\*J7 still depends on owner portal discovery/membership after J5–J6 data exists; J7–J8 remain unauthorized.

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
| Status | **Authorized + delivered** |
| Current | Self-serve org → PM SKU assigned (no customer SKU picker); Setup → Mission Control with “Add your first property” CTA; login/dashboard route through Setup when incomplete |
| Remaining | Master Admin runs [J0 certification](./j0/certification.md); SaaS checkout still white-glove / Admin assign acceptable for launch |
| Out of scope | Property create (J1) |
| MA verify | [J0 certification](./j0/certification.md) |

**Authorized:** `AUTHORIZE LAUNCH-001 JOURNEY J0`

---

## J1 — Property added

```
Mission Control
  → Add your first property
  → Wizard (name + units)
  → Active property
  → Directory + Command Center + MC + search + timeline + audit + Assistant
  → Assistant: Invite your team
```

| Field | Content |
|-------|---------|
| Status | **Authorized + delivered** |
| Current | Properties wizard creates/activates; Command Center; MC progresses to invite team; FO create removed |
| Remaining | Master Admin runs [J1 certification](./j1/certification.md) |
| Out of scope | Invite email/accept (J2) |
| MA verify | [J1 certification](./j1/certification.md) |

**Authorized:** `AUTHORIZE LAUNCH-001 JOURNEY J1`

---

## J2 — Staff invited

```
Mission Control → Invite your team
  → /settings/team
  → Assign launch role
  → Email + accept link
  → Accept → role home
  → MC / Assistant → Add your first resident
```

| Field | Content |
|-------|---------|
| Status | **Authorized + delivered** |
| Current | Six launch roles; Resend email; accept sets org + role home; single Team invite UI |
| Remaining | Master Admin runs [J2 certification](./j2/certification.md) |
| Out of scope | Residents product (J3) |
| MA verify | [J2 certification](./j2/certification.md) |

**Authorized:** `AUTHORIZE LAUNCH-001 JOURNEY J2`

---

## J3 — First resident

```
Mission Control → Add your first resident
  → /pm/residents
  → Create resident → Assign property → Assign unit
  → Resident Command Center
  → Portal Pending Activation (no lease yet)
  → MC / Assistant → Create your first lease
```

| Field | Content |
|-------|---------|
| Status | **Authorized + delivered** |
| Current | First-class `pm_residents`; sole create path; Command Center; MC → create lease |
| Remaining | Master Admin runs [J3 certification](./j3/certification.md) |
| Out of scope | Lease create / e-sign (J4) |
| MA verify | [J3 certification](./j3/certification.md) |

**Authorized:** `AUTHORIZE LAUNCH-001 JOURNEY J3`

---

## J4 — First lease

```
Mission Control → Create your first lease
  → /pm/leasing
  → Select resident (Pending Lease)
  → Lease wizard → document → SignWell (or offline honesty)
  → Activate → Resident Active · Portal Active · recurring rent
  → MC / Assistant → Collect your first rent
```

| Field | Content |
|-------|---------|
| Status | **Authorized + delivered** |
| Current | Sole Leasing path; SignWell client + webhook; offline honesty; auto-activation |
| Remaining | Master Admin runs [J4 certification](./j4/certification.md) |
| Out of scope | Rent collection UX depth (J5) |
| MA verify | [J4 certification](./j4/certification.md) |

**Authorized:** `AUTHORIZE LAUNCH-001 JOURNEY J4`

---

## J5 — Rent collected

```
Mission Control → Collect your first rent
  → /pm/financial-operations#collect
  → Review charges → payment reminder
  → Resident Billing → Stripe pay OR manual payment
  → Receipt · balances · property/owner money
  → Timeline · Audit
  → Mission Control → Submit your first maintenance request
```

| Field | Content |
|-------|---------|
| Current | **Delivered** — reuses FIN-OPS single payment workflow |
| Remaining | Master Admin runs [J5 certification](./j5/certification.md) |
| Out of scope | Maintenance work orders (J6); deeper owner portal (J7) |
| MA verify | [J5 certification](./j5/certification.md) |

**Authorized:** `AUTHORIZE LAUNCH-001 JOURNEY J5`

---

## J6 — Maintenance → vendor → resolved

```
Resident Portal → Submit Maintenance Request
  → Maintenance Command Center
  → Prioritize → Assign Technician OR Vendor
  → Progress → Complete → Resident confirms
  → Timeline · Audit
  → Mission Control → Review your daily operations.
```

| Field | Content |
|-------|---------|
| Current | **Delivered** — one WO workflow; vendors via `vendor_vendors` |
| Remaining | Master Admin runs [J6 certification](./j6/certification.md) |
| Out of scope | Owner financial review depth (J7); communications (J8) |
| MA verify | [J6 certification](./j6/certification.md) |

**Authorized:** `AUTHORIZE LAUNCH-001 JOURNEY J6`

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
