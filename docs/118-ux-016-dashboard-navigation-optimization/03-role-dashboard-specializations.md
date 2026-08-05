# 03 — Role Dashboard Specializations

**Package:** UX-016  
**Status:** Draft — Ready for Approval  
**Date:** 2026-08-05  
**Constraint:** AUTH-001 dashboard assignment — surfaces are assigned, never user-picked.

---

## Rule

Every surface uses the **same six-section hierarchy**. Only content, density, and quick actions change.

Surfaces below map to AUTH / portal shells already in product. Vendor interactive work remains tokenized job access where AUTH/VENDOR packages require it; the **hierarchy still applies** to whatever home that surface exposes.

---

## Organization Admin

| Section | Specialization |
|---------|----------------|
| Greeting | Name · org · portfolio/place signal · org health one-liner |
| Immediate Attention | Billing risk · failed SaaS payment · security/compliance · critical cross-module emergencies · stalled invitations |
| Today’s Mission | Team actions pending · properties needing setup · subscription/usage warnings · open escalations |
| Quick Actions | Invite teammate · Add property · Open billing · View team · Open settings |
| Recent Activity | Membership, billing, and high-signal org events |
| Insights | Org health / commercial snapshot (below fold) |

---

## Property Manager

| Section | Specialization |
|---------|----------------|
| Greeting | Name · org · active property scope · ops status line |
| Immediate Attention | Emergency WO · lease ending today · payment failure · unread resident threads · vendor awaiting approval |
| Today’s Mission | Maintenance · leases awaiting signature · inspections · vendor approvals · resident moves |
| Quick Actions | Create work order · Invite resident · Add property/unit · Schedule inspection · Message resident |
| Recent Activity | Completions, assignments, resident replies |
| Insights | Ops KPIs / portfolio pulse (below fold) |

Flagship proof of Command Center intent (UX-012 / OPS-001 / UI-001 PM docs).

---

## Maintenance Technician / Facility Technician

| Section | Specialization |
|---------|----------------|
| Greeting | Name · org · property for next/active job |
| Immediate Attention | **Hero job** / emergency / overdue assigned job |
| Today’s Mission | Today’s job list counts · parts waits · inspections due |
| Quick Actions | Start next job · Update status · Add photo · Log time/materials (entitled) |
| Recent Activity | Jobs completed / status changes |
| Insights | Usually omit or minimal |

Mobile-first density; field companion tone (UI-001 technician dashboard intent).

---

## Leasing Agent

| Section | Specialization |
|---------|----------------|
| Greeting | Name · org · property/leasing context |
| Immediate Attention | Applications stuck · leases awaiting signature · tours today · screening blockers |
| Today’s Mission | Applicants · leases · move-ins · document gaps |
| Quick Actions | New applicant · Send lease · Schedule tour · Request documents |
| Recent Activity | Application/lease state changes |
| Insights | Pipeline snapshot (below fold, light) |

---

## Resident (Tenant)

| Section | Specialization |
|---------|----------------|
| Greeting | Name · property · unit · calm welcome |
| Immediate Attention | Rent due/overdue · open maintenance needing input · unread PM message · signature needed |
| Today’s Mission | Pay rent · open requests · documents to review (only non-zero) |
| Quick Actions | Pay · Request maintenance · Message office · View lease |
| Recent Activity | Payments, request updates, announcements (meaningful only) |
| Insights | Omit by default |

Preserve Tenant Home calm from DPX-003 — never dump PM queues.

---

## Vendor

| Section | Specialization |
|---------|----------------|
| Greeting | Name / company · property for next job (token or portal home) |
| Immediate Attention | Job to accept/start · changes needing ack · invoice rejected |
| Today’s Mission | Assigned jobs · awaiting parts · invoices pending |
| Quick Actions | Accept/start job · Upload photo · Submit invoice |
| Recent Activity | Job completions / payments |
| Insights | Omit |

No PM portfolio chrome. Tokenized `/v/[token]` flows keep the same attention → mission → action order on their landing surface.

---

## Owner

| Section | Specialization |
|---------|----------------|
| Greeting | Name · PM branding subtle · focus property or named portfolio |
| Immediate Attention | Approvals waiting · statements ready · critical property alerts owners must see |
| Today’s Mission | Approvals · reports · messages needing response |
| Quick Actions | Review approval · View statement · Message PM · Open property |
| Recent Activity | Payouts, statements, approvals |
| Insights | Performance snapshot **below fold** (OWNER-001 calm executive tone) |

---

## Support / Master Admin (Level 0)

| Section | Specialization |
|---------|----------------|
| Greeting | Operator identity · support context (not customer vanity) |
| Immediate Attention | Sev incidents · failed provision · stuck impersonation / recovery · payout/billing fires |
| Today’s Mission | Open recovery queues · commercial health exceptions · notification diagnostics |
| Quick Actions | Search org · Start guided recovery · Open commercial dashboard · Notification test (entitled) |
| Recent Activity | Audit / recovery events |
| Insights | Platform health (below fold) |

Impersonation remains ADMIN-001 tooling — not an end-user portal picker.

---

## Consistency checklist (all roles)

| Check | Pass |
|-------|------|
| Same section order | ✔ |
| ≤ 5 Immediate Attention items | ✔ |
| Insights not in first viewport | ✔ |
| Quick actions role-fit + entitled only | ✔ |
| Place/org signal in Greeting | ✔ |
| Deep links to existing routes | ✔ |
