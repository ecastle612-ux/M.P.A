# 4 — Implementation Slices

**Status:** Draft  
**Parent:** [LAUNCH-001](./index.md)  
**Gate:** Each slice requires `AUTHORIZE LAUNCH-001 SLICE Ln` after package Approve — **no code now**

---

## Slice map

| Slice | Name | Delivers | Depends | Customer #1 |
|-------|------|----------|---------|:-----------:|
| **L0** | Onboarding Foundation | Mission Control first CTA; Guided Setup operational checklist shell; readiness honesty labels | Package Approve | Required |
| **L1** | Team Invites & Roles | Email invite delivery; accept UX; copy-link fallback; role defaults + manage UI | L0 | Required |
| **L2** | First Property & Lease Win | Properties create UX; Residents/Leasing MVP create; Setup steps; deep-link FO | L0 | Required |
| **L3** | Payments Readiness | Stripe Connect onboarding UI; Setup payments step; FO empty states; manual-collect opt-out | L2, FO S0–S3 | Required |
| **L4** | Maintenance & Vendor Ops MVP | Submit request; assign vendor; statuses; Mission Control signals | L2 | Required |
| **L5** | SignWell & Purchase Hardening | SignWell config/send **or** explicit deferral; SaaS purchase **or** white-glove runbook + remove SKU picker | L1–L3 | Scope decision |
| **L6** | Unaided Certification | End-to-end Customer #1 script; accessibility; regression; launch readiness exit | L1–L4 (+ L5 if scoped) | Required |

---

## L0 — Onboarding Foundation

**In**
- PM Mission Control: empty-state composition + primary CTA
- Guided Setup: extend checklist model (steps may be incomplete until later slices)
- Nav/empty-state copy: stop implying stub modules are live
- First Five Minutes alignment (doc → UI)

**Out**
- Full maintenance, Connect, SignWell, purchase Checkout

**Exit**
- New PM lands and knows the single next action without opening FO by lore

---

## L1 — Team Invites & Roles

**In**
- Transactional invite email with accept URL
- Settings: pending invites, resend, copy link, revoke
- Safe default roles for staff invites
- Membership role change UI (existing PATCH)

**Out**
- SCIM / directory sync

**Exit**
- Second user joins org without operator pasting tokens

---

## L2 — First Property & Lease Win

**In**
- Create property from Properties (share FO property API/service)
- Create resident + lease from Residents/Leasing (or unified first-win wizard)
- Guided Setup marks property + lease steps
- FO remains ledger/collections home; no second money model

**Out**
- Property import CSV (P2)
- Full CRM

**Exit**
- Solo PM creates property + lease + sees them in portfolio without using hidden FO setup only

---

## L3 — Payments Readiness

**In**
- Connect onboarding start/status in Setup + FO settings
- Online pay blocked with plain language until ready
- Explicit “collect manually for now” completes Setup payments step
- Smoke: post charge → collect (manual or Checkout)

**Out**
- Autopay / payment plans (FIN-OPS S4)
- SaaS subscription Checkout (L5)

**Exit**
- Customer understands how rent collection works for their org

---

## L4 — Maintenance & Vendor Ops MVP

**In**
- Create/list maintenance request
- Assign vendor (reuse vendor identity; FO AP stays for invoices)
- Status timeline on request
- Mission Control shows open maintenance count/queue item

**Out**
- Facility preventive maintenance / assets
- Full marketplace

**Exit**
- Ops loop demo: request → assign → visible on home

---

## L5 — SignWell & Purchase Hardening

**Branch A — Include in launch**
- SignWell app config + send lease + status
- SaaS purchase path assigning SKU without customer picker

**Branch B — Defer with honesty**
- Document “leases offline / wet ink OK for Customer #1”
- White-glove SKU assignment runbook; remove Settings SKU shopping
- SignWell listed Planned

**Exit**
- Written scope decision + matching product copy

---

## L6 — Unaided Certification

**In**
- Scripted walkthrough as brand-new PM (no staff help)
- Permissions/entitlements regression
- Accessibility of Setup + Mission Control first win
- Update launch readiness GO/NO-GO

**Out**
- New features

**Exit**
- Certification report Pass for Customer #1 Property Manager path

---

## Authorization protocol

```
APPROVE LAUNCH-001          ← package
AUTHORIZE LAUNCH-001 SLICE L0
… one slice at a time …
AUTHORIZE LAUNCH-001 SLICE L6
```

Do **not** batch-implement L0–L6 without slice auth.  
Do **not** treat this document as implementation authorization.

---

## Coordination with other workstreams

| Workstream | Rule |
|------------|------|
| FIN-OPS-001 | Remains paused at S3 unless separately authorized; L3 reuses FO |
| Facility Ops | No feature work from LAUNCH slices |
| CORE-004 | Do not reopen here |
| Commercial hardening | Preserve fail-closed entitlements |
