# J0 Certification — Purchase → First Login / Trusted Home

**Parent:** [LAUNCH-001](../index.md)  
**Journey:** [J0](../customer-journeys.md#j0--purchase--trusted-home)  
**Authorization:** `AUTHORIZE LAUNCH-001 JOURNEY J0`  
**Delivery status:** Delivered (implementation)  
**Certification status:** Ready for Master Admin Pass script  

---

## Outcome

```
Purchase / assign Property Manager
  → Account + email verification
  → Organization created (SKU assigned — not shopped)
  → Guided Setup completes commercial + “you’re in”
  → Mission Control shows one clear next action
```

---

## What shipped

| Step | Behavior |
|------|----------|
| First login | `/login` → `/dashboard` → `/setup` if no SKU or setup incomplete; else product home |
| Organization create | Customer self-serve always gets `mpa_property_manager`; no SKU picker in Setup or Settings |
| Guided Setup | Checklist: org, PM confirmed, billing review, Mission Control home, next-step acknowledge → finish |
| Mission Control | Real trusted home: org + plan; Setup CTA if incomplete; else **Add your first property** → `/pm/properties` |
| Operator exception | Platform operators may still assign other SKUs at create / subscription console |

---

## Honest boundary (not J0)

Property **create** on the Properties surface is **J1**. Mission Control’s next action is clear; completing portfolio create is authorized separately.

---

## Master Admin Pass script

| # | Step | Expected |
|---|------|----------|
| 1 | Create/cert customer user; verify email; sign in | Lands Setup (or dashboard→setup) — not Launcher theater |
| 2 | Create organization without choosing a SKU | Org exists; subscription = Property Manager |
| 3 | Complete Guided Setup checklist; Finish | `setupComplete`; redirect Mission Control |
| 4 | Open Mission Control | Shows org, plan, single primary CTA “Add your first property” |
| 5 | Click CTA | Opens `/pm/properties` |
| 6 | Negative: Facility-only org (operator-assigned) | Cannot open PM Mission Control (entitlement fail-closed) |
| 7 | Subscription console | Operator can see PM SKU + setup state on cert org |

**Pass requires:** Workaround used? **No**

---

## Evidence to record

- Organization id  
- `sku_code = mpa_property_manager`  
- `organization_setup_state.completed_at` set  
- Actor + timestamps for create + setup complete  
- Screenshot or note: Mission Control single CTA  

---

## Result log

| Field | Value |
|-------|-------|
| Environment | _fill on cert_ |
| Cert org | _fill_ |
| Operator | _fill_ |
| Result | _Pass / Fail_ |
| Workaround used? | _Must be No for Pass_ |
| Date | _ISO_ |
