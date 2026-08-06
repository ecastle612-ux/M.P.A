# Capability Promises — Property Manager

**Parent:** [LAUNCH-001](./index.md)  
**Status:** Draft  
**Advertise sources:** Module Map · Subscription Matrix · Billing inclusions · PM nav (`COMMERCIAL_MODULES`)

Each capability is scored with the [six questions](./promise-evaluation-framework.md).

---

## Scoreboard

| Capability | Discover | No docs | No support | Begin→End | Matches ad | MA validate | Verdict |
|------------|:--------:|:-------:|:----------:|:---------:|:----------:|:-----------:|---------|
| Property Management | Partial | No | No | No | No | No | **Broken** |
| Leasing | Yes | No | No | No | No | No | **Broken** |
| Residents | Yes | No | No | No | No | No | **Broken** |
| Maintenance | Yes | No | No | No | No | No | **Broken** |
| Vendor Management | Yes | No | No | No | No | Partial | **Broken** |
| Financial Operations | Yes | Partial | Partial | Yes | Partial | Partial | **Conditional** |
| Documents | Yes | No | No | No | No | No | **Broken** |
| Communications | Yes | No | No | No | No | No | **Broken** |

**Launch ready?** No — seven broken, one conditional.

---

## 1. Property Management

### PROMISE
Manage portfolio properties and units; use Mission Control as the daily attention home; complete property setup as the foundation of PM ops.

### Customer Journey
```
Open Property Manager home
  → See what needs attention (or clear first action)
  → Add property (+ units)
  → Open property and understand its status
  → Return tomorrow and know what to do next
```

### Current Status
- `/pm/mission-control` = trusted home with org/plan + **Add your first property** CTA (J0).
- `/pm/properties` = FO money health list (S3); **cannot create** property here yet (J1).
- Property create still exists on Financial Operations Finance Desk.
- Guided Setup completes commercial onboarding and points to Mission Control (J0); first-property create is J1.

### Six questions
| # | Answer |
|---|--------|
| 1 Discover | **Partial** — Mission Control CTA + Properties nav; create still not on Properties |
| 2 No docs | **No** — create still requires FO path until J1 |
| 3 No support | **No** |
| 4 Begin→End | **Partial** — J0 home has clear next action; property create end-state is J1 |
| 5 Matches ad | **No** — portfolio ops not complete until J1 |
| 6 MA validate | **Partial** — [J0 cert](./j0/certification.md); Property Management full cert after J1 |

### Friction Points
- Properties page still looks financial, not administrative.
- CTA honesty: create is the next journey, not finished on Properties yet.

### Launch Blockers
- Property create not on the advertised Properties surface (J1).
- No unaided first-property completion from Properties (J1).

### Recommended Fix
- J1: Properties create/edit property & units; money panel secondary.
- Guided Setup / Mission Control already point at first property (J0 done).

### Verification Steps
1. New PM org → Mission Control shows single next action (**J0**).  
2. Create property without opening FO (**J1**).  
3. Property appears in list and detail (**J1**).  
4. Master Admin runs J0 then Property Management cert after J1.

---

## 2. Leasing

### PROMISE
Move vacancy to a signed lease: listing/pipeline → application → screening → lease → move-in (Module Map).

### Customer Journey
```
Open Leasing
  → Create or select vacancy / listing
  → Receive or enter application
  → Screen / approve
  → Create lease
  → Send for signature (or record signed)
  → Mark move-in ready
  → Lease active (linked to resident + unit)
```

### Current Status
- `/pm/leasing` = alignment stub.
- Lease rows can be created via FO “Add resident lease” (billing scaffolding) — not a leasing pipeline.
- SignWell / e-sign absent.
- Marketing, applications, screening not implemented.

### Six questions
| # | Answer | Notes |
|---|--------|-------|
| 1 Discover | **Yes** | Nav item present |
| 2 No docs | **No** | Stub only |
| 3 No support | **No** | |
| 4 Begin→End | **No** | |
| 5 Matches ad | **No** | Pipeline advertised; FO shortcut ≠ leasing |
| 6 MA validate | **No** | |

### Friction Points
- Customer opens Leasing and hits empty theater.
- FO lease create creates data without leasing UX → split brain.

### Launch Blockers
- No leasing workflow UI.
- No lease signing path matching “lease signed” journey.
- Advertise claims vacancy-to-lease pipeline.

### Recommended Fix
- Minimum launch leasing: create lease on unit → attach resident → status active (with offline/sign deferral honesty **or** SignWell).
- Defer marketing/screening from advertise copy if not shipping.
- Link FO charges to lease created in Leasing, not the reverse as the only path.

### Verification Steps
1. From Leasing, create lease start→active without FO desk.  
2. Resident appears linked.  
3. Optional: signature status recorded.  
4. MA cert script “Leasing.”

---

## 3. Residents

### PROMISE
Operational records for people in units — move-in, rent context, maintenance, move-out (Module Map).

### Customer Journey
```
Open Residents
  → Add resident
  → Attach to property / unit / lease
  → See balance / status without accounting jargon
  → Invite to portal (optional)
  → Resident can view/pay (portal)
```

### Current Status
- `/pm/residents` = alignment stub.
- Residents created only as part of FO lease create.
- Tenant billing portal works when linked + Stripe env configured.

### Six questions
| # | Answer |
|---|--------|
| 1 Discover | **Yes** (nav) |
| 2 No docs | **No** |
| 3 No support | **No** |
| 4 Begin→End | **No** |
| 5 Matches ad | **No** |
| 6 MA validate | **No** |

### Friction Points
- No resident directory UI.
- Portal invite/link path unclear for first-time PM.

### Launch Blockers
- Residents module not executable.
- Advertise “resident operational records” unmet.

### Recommended Fix
- Residents list + add/attach flows.
- Clear “Invite to resident portal” with email.
- Surface balance from FO (read model), edit identity in Residents.

### Verification Steps
1. Add resident from Residents module.  
2. See them on property/lease.  
3. Resident portal shows balance after link.  
4. MA cert “Residents.”

---

## 4. Maintenance

### PROMISE
Unit/resident work orders — intake → triage → assign → resolve (not Facility Ops).

### Customer Journey
```
Open Maintenance
  → Create request (or receive from resident)
  → Prioritize
  → Assign vendor
  → Track status
  → Resolve / close
  → Visible on Mission Control while open
```

### Current Status
- `/pm/maintenance` = alignment stub.
- No work-order tables/UI in PM product path.
- Resident cannot submit maintenance from portal as a real workflow.

### Six questions
| # | Answer |
|---|--------|
| 1 Discover | **Yes** (nav) |
| 2–5 | **No** |
| 6 MA validate | **No** |

### Friction Points
- Advertised continuously in Module Map workflow diagram; zero execution.

### Launch Blockers
- Entire maintenance loop missing.
- Blocks end-to-end Customer Journey (request → vendor → resolve).

### Recommended Fix
- MVP work order: create, status, assign vendor, close.
- Mission Control queue item for open WOs.
- Resident submit (portal) as soon as staff path works.

### Verification Steps
1. Staff creates WO → assigns vendor → closes.  
2. Appears on Mission Control while open.  
3. MA cert “Maintenance.”

---

## 5. Vendor Management

### PROMISE
Assign and manage service providers; vendor desk / marketplace consumption (Module Map). Directory + assignment for maintenance; payables via FO.

### Customer Journey
```
Open Vendors
  → Add vendor to directory
  → Assign vendor to maintenance job
  → Vendor completes work
  → (Optional) Invoice → approve → pay in Financial Operations
```

### Current Status
- `/pm/vendors` = alignment stub.
- FO Collections Desk: create vendor + invoice AP (S2) — **payables**, not job assignment.
- No marketplace consumption UX.

### Six questions
| # | Answer | Notes |
|---|--------|-------|
| 1 Discover | **Yes** | Nav |
| 2 No docs | **No** | Stub; AP hidden in FO |
| 3 No support | **No** | |
| 4 Begin→End | **No** for assignment; **Partial** for AP if FO found |
| 5 Matches ad | **No** | Assignment advertised; AP ≠ assignment |
| 6 MA validate | **Partial** | AP events exist; no assignment cert |

### Friction Points
- Two “vendor” stories (jobs vs AP) without a home.
- Marketplace wording oversells.

### Launch Blockers
- Vendor directory/assignment module missing.
- Cannot complete maintenance journey.

### Recommended Fix
- Vendors module = directory + assign to WO.
- FO keeps invoice approve/pay (already S2).
- Soften marketplace advertise until real.

### Verification Steps
1. Add vendor in Vendors.  
2. Assign to WO.  
3. Optional: invoice in FO.  
4. MA cert “Vendor Management.”

---

## 6. Financial Operations

### PROMISE
Rent, charges, collections, PM money ops — Command Center, not full GL (Module Map + FIN-OPS-001).

### Customer Journey
```
Open Financial Operations
  → See expected vs collected, past due, vendor bills
  → Post rent / charges
  → Collect (online or record manual)
  → Handle past due / late fees as needed
  → Owner/property money visibility
```

### Current Status
- **Strongest promise:** FO S0–S3 delivered (billing, collections, AP, Command Center, owner summary).
- Discoverable in nav; desks are real.
- Gaps: Connect org onboarding UI; Setup does not teach FO; autopay not in scope (paused S4).
- Catalog `plannedLabel` text may be stale vs S2/S3.

### Six questions
| # | Answer | Notes |
|---|--------|-------|
| 1 Discover | **Yes** | |
| 2 No docs | **Partial** | Usable but dense; Setup doesn’t introduce |
| 3 No support | **Partial** | Online pay needs platform Stripe env / Connect gap |
| 4 Begin→End | **Yes** | Charge → pay → receipt/ledger |
| 5 Matches ad | **Partial** | Ops finance yes; “deposit accounting” / full leasing money edge cases thin |
| 6 MA validate | **Partial** | Slice progress yes; not a full cert console per journey |

### Friction Points
- First-time customers may never leave Mission Control stub to find FO.
- SaaS `/billing` vs rent FO naming — OK if labeled; Setup silence hurts.

### Launch Blockers (for this promise)
- Connect self-serve readiness.
- Onboarding must route first money win here intentionally.
- Stale advertise copy in module catalog.

### Recommended Fix
- Guided Setup + Mission Control CTA → FO first money win.
- Connect onboarding empty states.
- Refresh module description to S0–S3 truth.
- Keep ERP out.

### Verification Steps
1. Unaided: post rent → collect → see snapshot.  
2. Delinquency/late fee optional path.  
3. Owner summary visible.  
4. MA cert “Financial Operations” with event/audit checks.

---

## 7. Documents

### PROMISE
Leases, agreements, evidence across PM workflows (shared platform module included in PM SKU).

### Customer Journey
```
Open Documents
  → Upload or generate document
  → Attach to property / lease / resident / WO
  → Share or send for signature when needed
  → Retrieve later from context
```

### Current Status
- `/shared/documents` = alignment stub (`platform.documents`).
- No document store UX; SignWell absent.
- Receipts exist as FO data (numbers), not a Documents module.

### Six questions
| # | Answer |
|---|--------|
| 1 Discover | **Yes** |
| 2–5 | **No** |
| 6 MA validate | **No** |

### Friction Points
- Included on Billing; zero product.

### Launch Blockers
- Cannot attach lease PDF or evidence.
- Blocks “lease signed” if e-sign/storage required.

### Recommended Fix
- MVP: upload + attach to lease/property + list/download.
- Signature: SignWell **or** “mark signed offline” with file upload.
- Until then: remove or mark Planned on customer Billing.

### Verification Steps
1. Upload lease file to a lease.  
2. Retrieve from lease/property context.  
3. MA cert “Documents.”

---

## 8. Communications

### PROMISE
Threads, notices, notifications across PM workflows.

### Customer Journey
```
Open Communications
  → Message resident / staff / vendor
  → Send notice (e.g. entry, past due)
  → See history on the person/property
  → Recipient gets in-app (and email when configured)
```

### Current Status
- `/shared/communications` = alignment stub.
- FO writes some `financial_notifications` rows for money events — not a Communications product.
- No general messaging/notices UI.

### Six questions
| # | Answer |
|---|--------|
| 1 Discover | **Yes** |
| 2–5 | **No** |
| 6 MA validate | **No** |

### Friction Points
- Customers expect inbox; get empty shell.
- Money notifications ≠ Communications module.

### Launch Blockers
- No staff↔resident messaging or notices.
- Past-due “notify” in FO is narrow and not the advertised product.

### Recommended Fix
- MVP: notice to resident (template) + in-app list; email when provider live.
- Threaded messaging can follow if notices ship first.
- Or de-advertise until MVP exists.

### Verification Steps
1. Send notice to resident from Communications.  
2. Resident sees it.  
3. MA cert “Communications.”

---

## Cross-cutting promise: Become a customer

Not a nav module, but required for all promises:

| Step | Status |
|------|--------|
| Purchase Property Manager | Self-serve assigns PM SKU (no customer picker); Admin assign / white-glove OK |
| Org created | Works |
| Guided Setup → Mission Control | **J0 delivered** |
| Staff invited | Broken (no email / link UX) — J2 |
| Email verification | Partial (Supabase) |

See [Customer Journeys](./customer-journeys.md) Journey J0–J2 · [J0 certification](./j0/certification.md).
