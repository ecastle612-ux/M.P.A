# DX-003 — Recommendations & Implementation Slices

**Status:** Approved — Execution Phase 1  
**Rule:** Improve existing workflows only. No new modules. Each item must save time, reduce clicks, reduce training, and reduce mistakes.

---

## Priority definitions

| Priority | Meaning |
| --- | --- |
| **P0** | Users get frustrated or make mistakes |
| **P1** | Clear daily time waste |
| **P2** | Nice improvements once P0/P1 land |

---

## P0 — Frustration removers

| ID | Recommendation | Clicks Δ | Training Δ | Mistake Δ |
| --- | --- | ---: | --- | --- |
| P0-01 | Ops attention items gain primary **Resolve** actions (modal or inline) for payment, WO assign, screening decide, signature nudge | −2–4 / job | Less “where do I click?” | Fewer abandoned jobs |
| P0-02 | **Record Payment** Quick Action opens one-shot payment flow (resident → amount → method), not charges list | −2 / payment | One verb = one screen | Wrong charge less often |
| P0-03 | Dual-path policy: guided Move in/out/transfer is **primary**; `/tenants/new` + `/leases/new` demoted to “Advanced / record only” | − hesitation | One taught path | Duplicate lease/tenant |
| P0-04 | Applicant **Approve → Continue to Move in** with source prefilled | −3 | No re-select | Wrong resident |
| P0-05 | Maintenance: assign vendor + mark complete **without Edit page** on common path | −2 | Shorter triage training | Status drift |
| P0-06 | Remove/rewrite inspections fiction (move-out checklist + context rail) until a real inspections initiative exists | 0 nav | Stops false hunt | False checklist completes |
| P0-07 | Post-setup **Invite teammate** entry (Profile/org menu) reusing setup invite — not a Staff module | −5 hunt | Staff onboardable after week 1 | Shadow IT spreadsheets |
| P0-08 | Vacant Ops tasks + empty states → `/residents/move-in` | −1–2 | Consistent vocabulary | Manual tenant without unit |

---

## P1 — Time savers

| ID | Recommendation | Clicks Δ |
| --- | --- | ---: |
| P1-01 | Compress nav: **Residents** group (Tenants, Move in, Move out, Transfer, Bulk) | − scroll/hunt |
| P1-02 | Compress Comms: Announcements + Inbox under one parent with clear sublabels | − confusion |
| P1-03 | Command Center: pin Move in/out, Transfer, Inbox, Migration; point creates at guided paths | −2–3 |
| P1-04 | Signature Ops widget → leases filtered `signature=pending` (or equivalent filter) | −2 |
| P1-05 | Vendor Ops open assignments → WO filtered `unassigned` / `assigned:me` | −2 |
| P1-06 | Financials default landing = unpaid / due today | −1 |
| P1-07 | Bulk: extend pattern only where queues already exist (e.g. bulk WO status) — reuse bulk-residents UX grammar | −N |
| P1-08 | Keyboard: document + fix `G A` collision; add `G I` Inbox, `G R` Move in | −0–1 |
| P1-09 | Move-in success: demote “Create tenant manually”; promote Ops / Bulk invite | − wander |
| P1-10 | Property QR enrollment link from property detail header (visible, not buried) | − hunt |

---

## P2 — Nice improvements

| ID | Recommendation |
| --- | --- |
| P2-01 | Remember last Ops scroll/filter position on return |
| P2-02 | Wizard step keyboard Next/Back |
| P2-03 | Org switch confirmation when unpaid work exists |
| P2-04 | Prefer guided path org preference toggle |
| P2-05 | Softer competition between Portfolio Setup Health and daily attention after go-live |

---

## Ranked implementation slices (after Approve)

### Slice A — Ops Action Console (P0-01, P0-02, P0-08) · **High ROI**

**Scope:** Operations Center header Quick Actions + Needs attention row.  
**Out:** New modules, AI redesign.  
**Done when:** Top 5 attentions support Resolve; Record Payment is one-shot; vacancy points to Move in.  
**Est.:** M · **Minutes/day:** ~20

### Slice B — One Path Residents (P0-03, P0-04, P0-06, P1-01, P1-09) · **High ROI**

**Scope:** Nav labels/grouping, empty/success CTAs, applicant continuation, checklist copy.  
**Out:** New resident CRM.  
**Done when:** Training script has one onboarding story; inspections fiction gone.  
**Est.:** S–M · **Minutes/day:** ~10

### Slice C — Maintenance Close Loop (P0-05, P1-05) · **High ROI**

**Scope:** Inline assign/complete on WO detail; Ops vendor filters.  
**Out:** Field service overhaul.  
**Done when:** Common WO closes without `/edit`.  
**Est.:** M · **Minutes/day:** ~10

### Slice D — Command Center Alignment (P1-03, P1-08) · **Quick + sticky**

**Scope:** Static providers + shortcut map.  
**Done when:** ⌘K can start Move in and open Inbox without hunting.  
**Est.:** S · **Minutes/day:** ~5

### Slice E — Queues without new pages (P1-04, P1-06) · **Quick**

**Scope:** Query filters + default Financials tab/section.  
**Done when:** Signature/billing widgets land on filtered work.  
**Est.:** S · **Minutes/day:** ~5

### Slice F — Org invite after setup (P0-07) · **Frustration**

**Scope:** Profile/org menu → existing invite API/UI from setup.  
**Out:** Full staff directory product.  
**Done when:** Month-3 hire can be invited without re-entering setup wizard.  
**Est.:** S · **Minutes/day:** rare but high stakes

### Slice G — Polish (P2-*) · **Later**

Only after A–F.

---

## Screens requiring redesign (existing surfaces)

| Screen | Slice | Change type |
| --- | --- | --- |
| `/dashboard` Ops Center | A | Composition: attention → actions |
| Payment entry (charges/payment form) | A | One-shot flow reuse |
| `/maintenance/[id]` | C | Inline assign/complete |
| `/applicants/[id]` | B | Continuation CTA |
| Shell nav | B | Grouping/labels |
| Command Center providers | D | Action targets |
| Profile / org menu | F | Invite entry |
| Move-out checklist copy | B | Copy only |
| `/financials` | E | Default section |
| `/leases` list filters | E | Filter from Ops |

---

## Quick Wins (<30 min) — ship first after Approve

1. Vacant task href → `/residents/move-in`  
2. Fix `G A` shortcut collision  
3. CC pin Move in + Inbox  
4. Demote success CTA “Create tenant manually” on move-in complete  
5. Rewrite inspection checklist labels to operational language (“Unit condition photos uploaded”)  
6. Ops Record Payment deepest useful route (even temporary deep-link improvement)  
7. Property detail: “Enrollment QR” button if panel exists below fold  
8. Signature widget link adds `?renewalStatus` / signature filter if already supported

---

## High ROI (do next)

1. Slice A — Ops Action Console  
2. Slice B — One Path Residents  
3. Slice C — Maintenance Close Loop  
4. One-shot Record Payment (part of A)

---

## Long-term UX (still no new modules)

1. Shared **Queue** interaction grammar (list + inline resolve) across WO, signatures, screening, payments.  
2. Keyboard Ops (`J/K`, `Enter` resolve).  
3. Org preference: default create path = guided.  
4. Inspections **only** via a future approved initiative — replace fiction then, not invent now.

---

## Explicit non-goals (this package)

- New Inspections product  
- New Staff HR / payroll module  
- New AI features  
- NotificationService / provider redesign  
- Migration engine redesign  
- Visual Canopy redesign (layout composition only where listed)

---

## Approval checklist

- [ ] Product + Lead Architect approve P0/P1 scope  
- [ ] Confirm Inspections remain out-of-scope (copy-only)  
- [ ] Confirm Staff = invite reuse, not new module  
- [ ] Status → **Approved**  
- [ ] Implementation may begin **Slice A → B → C → D → E → F** only
