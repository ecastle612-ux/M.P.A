# 01 — Certification Audit

**Package:** PM-001 · EP-011  
**Date:** 2026-07-19  
**Method:** Code/surface audit + presentation walkthrough of PM routes (no architecture changes)

---

## 1. Workflow certification matrix

| Workflow | Entry | Success path | Verdict | Notes |
| --- | --- | --- | --- | --- |
| Organization setup | `/setup`, Settings → Organization | Complete setup → Operations Center | Pass | DP-001 permanent org/team surfaces |
| Property creation | `/properties/new` | Create → property detail | Pass | Empty state + primary CTA clear |
| Bulk unit creation | `/units/new` (bulk default) | Generate units → units list | Pass | UX-001 bulk generator |
| Residents list | `/tenants` | Open profile / move-in CTA | Pass* | *Document notes labeling cleaned |
| Applicants | `/applicants` | Create → advance status | Pass | Pipeline empty states professional |
| Move in | `/residents/move-in` | Wizard → lease + occupancy | Pass | Guided primary path |
| Move out | `/residents/move-out` | Wizard completion | Pass | Existing lifecycle |
| Transfers | `/residents/transfer` | Transfer completion | Pass | Existing lifecycle |
| Bulk residents | `/residents/bulk` | Bulk actions complete | Pass | Existing lifecycle |
| Leases | `/leases` | Detail / edit / move-in path | Pass* | *Document panel copy professionalized |
| Maintenance | `/maintenance` | Create → assign → complete | Pass* | *Attachment empty copy cleaned |
| Facility records | Property detail + WO link | View permanent record | Pass | No standalone Facility nav (by design — property-centric) |
| Assets | Property detail Assets panel | Open asset profile | Pass | Linked from property |
| Timeline | Property detail Timeline | Filter / navigate events | Pass | Embedded on property |
| Financials | `/financials` | Charges, payments, expenses | Pass* | *Payment method labels cleaned |
| Reports | `/financials/reports` | Generate / view report | Pass | Accounting subnav |
| Migration | `/migration` | Guided import → results | Pass | MIG-001 wizard |
| Announcements | `/communications` | Create → publish → readership | Pass* | *Delivery status label cleaned |
| AI Operations | `/ai-operations` | Insights / chat shell | Pass | UX-001 mobile shell |
| Command Center | Shell palette / tracker | Navigate / create actions | Pass | Architecture untouched |
| Operations Center | `/dashboard` | Widgets → deep links | Pass | Architecture untouched |
| Master Admin | `/master-admin/*` | Capability-gated tools | Pass | Slice B impersonation still deferred (gated) |
| Portals hub | `/portal` | Tenant available; Owner/Manager gated | Pass | Professional deferred messaging (DP-001) |

---

## 2. Navigation audit

| Finding | Severity | Disposition |
| --- | --- | --- |
| Facility/Assets/Timeline not top-level nav | Low | **Keep** — surfaces live on Property detail; avoids duplicate module |
| Portals → Owner/Manager gated | Info | **Keep** — professional reserved messaging |
| Auth “Coming soon” SSO/MFA chips | Medium | **Hide** — unfinished auth methods |
| Dense Operations nav (lifecycle items) | Low | **Keep** — intentional WF-003 discoverability; no IA redesign |

---

## 3. Placeholder audit

| Surface | Was | Outcome |
| --- | --- | --- |
| Auth brand shell SSO chips | “Coming soon” | **Hide** |
| Lease documents panel | “future phase” / OCR pending | **Replace** professional vault-oriented copy |
| WO attachments empty | “Reserved for a future phase” | **Replace** operational empty copy |
| Maintenance context rail attachments | “future phase” | **Replace** → point to Edit photo upload |
| Tenant detail / table docs | “Documents placeholder” | **Replace** → “Document notes” |
| Lease form co-tenant / late fee | “placeholder” labels | **Replace** professional labels |
| Payment methods ACH/Card | “(placeholder)” | **Replace** → “manual record” |
| Vendor Tax ID field | “Tax ID placeholder” | **Replace** → “Tax ID / EIN” |
| Announcement delivery `placeholder` | Badge “Placeholder” | **Replace** → “Recorded” |

Internal field names (`*Placeholder` in contracts/API) unchanged — presentation only.

---

## 4. Consistency / efficiency / mobile / a11y (summary)

| Area | Result |
| --- | --- |
| Buttons / forms / tables / badges | Align to Canopy primitives; label polish only this sprint |
| Efficiency | Prefer existing smart suggestions, sticky form actions, bulk units — no new shortcuts architecture |
| Mobile | Sticky WO/lease form actions retained; auth chips removed (less clutter) |
| Performance | No architectural rewrite; existing deferral/skeletons retained |
| Accessibility | ARIA labels updated with professional field names; contrast tokens unchanged |

---

## 5. Explicit non-changes

- No schema, API, or business-logic edits  
- No Facility/Accounting/Reporting/Command Center/Operations Center redesign  
- No Master Admin Slice B impersonation implementation  
- No new Facility index module
