# Customer Onboarding Certification

**Parent:** [Commercial Experience Certification](./index.md)

Walkthroughs assume a brand-new customer after login.

---

## Common entry path (all SKUs)

```
Login → /launcher (root) → Guided Setup (if no org/SKU) → Billing review → Product home
```

### Confusion points (all)

| Issue | Severity |
|-------|----------|
| Checklist marks “Review Billing” and “Open home” complete as soon as SKU exists — without forcing those visits | High |
| Customer can pick any SKU themselves (feels like shopping, not “what you purchased”) | High |
| Create organization exists in Guided Setup **and** Settings foundation panel | Medium |
| After org create, no automatic navigation to product Mission Control | Medium |
| Portal home (`/portal/manager`) still exists beside Launcher | Medium |
| Dead header Search invites typing with no outcome | Medium |
| Master Admin in profile menu for everyone | Medium |

---

## Property Manager onboarding

| Step | Experience | Certified? |
|------|------------|------------|
| 1. Land | `/launcher` — if no SKU, Setup + Billing cards | Yes |
| 2. Create org + choose Property Manager | Works | Yes |
| 3. Understand inclusions | Must manually open Billing; not guided | No |
| 4. Open PM Mission Control | Must click; not auto | Partial |
| 5. Attempt first work | Alignment shells / Planned FO — no real first win | No (expected for Phase 1 alignment, but onboarding feels empty) |

**Confusion:** Maintenance appears “Included” while Financial Operations is “Coming later” — clear. Facility absence is clear in nav.  
**Duplicate navigation:** Launcher cards ≈ Sidebar PM items.  
**Unnecessary clicks:** Setup → (manual) Billing → (manual) Mission Control.  
**Missing guidance:** No single primary CTA after product confirm (“Go to Mission Control”).

**PM onboarding verdict: Conditional Fail.**

---

## Facility Operations onboarding

| Step | Experience | Certified? |
|------|------------|------------|
| 1. Land | Launcher | Yes |
| 2. Choose Facility Operations | Works | Yes |
| 3. Understand nearly everything is Planned | Billing + Planned badges | Partial — may feel like they bought an empty product |
| 4. Open Facility Mission Control | Manual | Partial |
| 5. See Capital Projects in nav as Planned without entitlement | Confusing “is this included?” | Issue |

**Confusion:** Product identity is clear; value delivery is not (almost all Planned).  
**Missing guidance:** No explanation that Phase 1 is commercial alignment / Facility features intentionally not live.

**Facility onboarding verdict: Conditional Fail** (clarity of purchase yes; clarity of what they can do now no).

---

## Complete Platform onboarding

| Step | Experience | Certified? |
|------|------------|------------|
| 1. Land | Launcher with both product sections | Yes |
| 2. Choose Complete | Works | Yes |
| 3. Understand both products | Billing + dual nav | Yes |
| 4. Know where to start | Launcher default helps; two Mission Controls compete | Partial |
| 5. Avoid duplicate workflows | One href per module | Yes |

**Confusion:** Which Mission Control first?  
**Duplicate navigation:** Highest overlap (Launcher + two large sidebar trees).  
**Missing guidance:** No “Start with Property Manager if you manage leases” / “Start with Facility if you run buildings” chooser copy beyond card descriptions.

**Complete onboarding verdict: Conditional Pass** for composition understanding; **Conditional Fail** for first-action guidance.

---

## Onboarding certification summary

| SKU | Purchase clarity | First-action clarity | Overall |
|-----|------------------|----------------------|---------|
| Property Manager | Pass | Fail | Conditional Fail |
| Facility Operations | Pass | Fail | Conditional Fail |
| Complete Platform | Pass | Conditional | Conditional Fail |

Customer #1 can learn **what they bought**. They cannot yet complete a confident **first operational win**, and setup does not enforce commercial comprehension.
