# LAUNCH-001 — Product Organization Audit

**Status:** Draft  
**Question:** Is M.P.A. organized around **modules** or **operational work**?  
**Doctrine:** Workflow-first · One capability · One workflow · One home · Extend > Reuse > Consolidate > Create

---

## 1. Verdict

| Assessment | Result |
|------------|--------|
| Intended organization | **Operational work** (Blueprint 01/02/05, ADR-008) |
| Current PM experience (rc1) | **Hybrid** — strong workflow engines underneath a **module-heavy nav** |
| Primary Customer #1 risk | Users must ask **“Where do I go?”** too often |
| Remedy during LAUNCH-001 | Consolidate IA + entitlements — **not** new modules |

---

## 2. Where users must think “Where do I go?”

| Moment | Competing homes | Canonical home (recommend) |
|--------|-----------------|----------------------------|
| Start of day | Command Center vs Ops Inbox vs Manager Portal vs Notifications | **Command Center** (attention) + Inbox as queue |
| People in units | Tenants vs Residents vs Leases | **Lease** as contract home; Resident as person-on-lease; retire dual primary nav over time |
| Move-in | Residents/move-in vs Lease detail vs Setup | **Lease → Move-in** workflow |
| Broken thing | Maintenance vs Facility vs Inbox | **Maintenance** for reactive; Facility for plant (post-launch depth) |
| Money in | Financials vs Tenant payments vs Billing (SaaS) | **Financials** = rent; **Settings → Billing** = SaaS |
| Money out / owners | Owner portal vs Owner statements vs Payouts settings | **Owner Portal** for owner; PM statements under Financials |
| Messages | Communications vs Inbox vs Notification Center | **Communications** for threads; **Inbox** for cross-domain attention |
| Docs / sign | Settings/documents vs Lease vs SignWell progress | **Lease/Document** object; SignWell is provider not home |
| Vendors | Vendors list vs WO assignment vs token link | **Vendors** directory; execution from **Maintenance WO** |
| Facility plant | Facility/* vs Maintenance | **Facility** (first-class) — hide/limit for Customer #1 default |

---

## 3. Module residue to consolidate (design recommendations)

Do **not** implement in this package. Track as B or post-LB-22 fixes.

1. **Single PM home:** Command Center only; Manager Portal = redirect or deep-link hub.  
2. **People model wording:** Pick “Residents” or “Tenants” as primary label in nav.  
3. **Leasing cluster:** Applicants + Leases + Move-in/out under one Leasing mental model.  
4. **Attention cluster:** Merge mental model of Notification Center into Ops Inbox / Console chips.  
5. **Facility default:** Entitlement off or “Advanced” for first cohort unless contract requires.  
6. **Intelligence / AI Ops / Migration:** Not in Customer #1 primary nav.  
7. **Reports:** One entry later; avoid Facility Reports + Financial Reports + AI as peers on day one.

---

## 4. Enforce one capability / one home

| Capability | One home | Must not also live as |
|------------|----------|------------------------|
| Work execution | Maintenance | Facility ticket clone |
| Plant stewardship | Facility | Nested Maintenance tabs |
| Rent collection | Financials | Ad-hoc Resident-only ledger |
| SaaS subscription | Settings → Billing | Second checkout in-app |
| E-sign | SignWell via Documents/Lease | Dropbox Sign leftovers / second vendor |
| Vendor identity | Vendors / Marketplace | Contact fields only on WO |
| Attention | Command Center + Ops Inbox | Third dashboard product |
| Org setup | Guided Setup | Parallel “create org” hacks |

---

## 5. Alignment with LAUNCH-001 / CORE-004

| Program | Organization rule |
|---------|-------------------|
| LAUNCH-001 | Fix “where do I go?” only when it blocks Customer #1; freeze new modules |
| CORE-004 | Long-term platform expansion **after** launch; Facility depth under Facility home (ADR-015) |
| ADR-016 | Financial/commercial path before Facility expansion |

---

## 6. Success metric

Customer #1 Property Manager completes the [checklist](./customer-one-checklist.md) H-steps without asking support “which screen?” for Properties, Leases, Rent, Maintenance, or Messages.
