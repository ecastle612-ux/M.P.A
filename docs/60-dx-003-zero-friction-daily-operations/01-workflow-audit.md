# DX-003 — Workflow Audit (20 workflows)

**Status:** Draft — Ready for Approval  
**Method:** End-to-end walk of current routes/components as a 250-unit PM (08:00–17:00).  
**Sources:** Shell nav, Operations Center, Command Center, resident lifecycle, financials, communications, migration, setup.

Legend for findings: **P0** frustrates · **P1** wastes time · **P2** nice.

---

## Cross-cutting findings (apply to most workflows)

| Issue | Priority | Evidence |
| --- | --- | --- |
| Ops is attention-first but still deep-links to lists | P0 | Widgets → `/leases`, `/maintenance`, `/financials/charges` |
| Dual paths: guided lifecycle vs classic CRUD | P0 | `/residents/move-in` vs `/tenants/new` + `/leases/new` |
| Record Payment Quick Action lands on charges list | P0 | Ops header → `/financials/charges` |
| Command Center omits lifecycle / Inbox / Migration | P1 | Static providers favor `/properties/new` etc. |
| Nav sprawl: 4 resident items + Comms/Inbox | P1 | `navigation-config.ts` |
| Bulk only for residents | P1 | `/residents/bulk` only |
| Settings / staff / org management hidden | P1 | No standing Staff nav; invite only in setup |
| Inspections language without inspections product | P0 | Move-out checklist + context rail copy |
| Shortcut collision `G A` | P2 | Applicants vs AI Operations |

---

## 1. Dashboard morning review

| | |
| --- | --- |
| **Route** | `/dashboard` |
| **Entry** | Operations Center |
| **Happy path** | Login → Ops → skim Needs attention → open item → act → return |

**Friction**

| Finding | Priority |
| --- | --- |
| Long scroll of widgets dilutes “what do I do first?” | P1 |
| Attention items mostly navigate away instead of resolve | P0 |
| Vacant-ready tasks point at Create tenant, not Move in | P0 |
| Must remember which widget owns signatures vs billing vs screening | P1 |
| Loading: acceptable skeletons (DX-001); success return to Ops often loses place | P2 |

**Time opportunity:** Resolve-in-place for top 5 attentions (−8 clicks/morning).

---

## 2. New resident onboarding

| | |
| --- | --- |
| **Routes** | `/residents/move-in`, `/tenants/new`, `/applicants/[id]` → move-in |
| **Entry** | Ops Quick Action · Move in · Applicants |

**Friction**

| Finding | Priority |
| --- | --- |
| Three mental models: applicant convert, move-in wizard, manual tenant | P0 |
| Dense multi-step wizard with checklist items user must know are “real” vs placeholders | P1 |
| Success still offers Create tenant manually (undermines guided path) | P1 |
| Missing: prefilled “from applicant” as default when arriving from approved applicant | P0 |

---

## 3. Move-in

| | |
| --- | --- |
| **Route** | `/residents/move-in` |
| **Happy path** | Source → Unit → Details → Checklist → Activate |

**Friction**

| Finding | Priority |
| --- | --- |
| Checklist toggles for screening/lease/deposit are easy to fake-complete | P0 |
| Unit picker + property context can feel duplicate of earlier Ops vacancy card | P1 |
| No keyboard next/prev between steps | P2 |
| After activate, return path to Ops is optional — easy to wander into CRUD | P1 |

---

## 4. Move-out

| | |
| --- | --- |
| **Route** | `/residents/move-out` |

**Friction**

| Finding | Priority |
| --- | --- |
| “Final inspection…” checklist with **no inspections module** | P0 |
| Deposit / forwarding address fields force remembering offline process | P1 |
| Confirmation is good; post-success next jobs (make unit vacant-ready) under-linked | P1 |

---

## 5. Applicant screening

| | |
| --- | --- |
| **Routes** | `/applicants`, `/applicants/[id]`, public `/screening/consent/[token]` |
| **Entry** | Applicants · Ops screening widget |

**Friction**

| Finding | Priority |
| --- | --- |
| No screening queue page — only widget + detail panels | P1 |
| Approve → Move in requires leaving detail and re-selecting applicant | P0 |
| Screening + signatures + messaging stacked — cognitive overload | P1 |
| No bulk invite/remind for pending consents | P1 |
| Hidden: status filters via query help, but not taught | P2 |

---

## 6. Lease signing

| | |
| --- | --- |
| **Routes** | `/leases`, `/leases/[id]`, `/signing/progress/[token]` |

**Friction**

| Finding | Priority |
| --- | --- |
| Signature Ops metrics all dump to `/leases` (no pending-signature queue) | P0 |
| Signature panel duplicated on applicant + lease detail | P1 |
| Lease create parallel to move-in lease step (double entry risk) | P0 |
| Unnecessary: edit available only for some statuses (good) but error copy uneven | P2 |

---

## 7. Maintenance request

| | |
| --- | --- |
| **Routes** | `/maintenance`, `/maintenance/new`, `/maintenance/[id]` · tenant portal |

**Friction**

| Finding | Priority |
| --- | --- |
| Create from Ops is good; triage still list→detail | P1 |
| Priority/status changes often need Edit page | P0 |
| Resident portal path separate (correct) but PM lacks “from resident message” deep continuity | P2 |
| No bulk status change for overnight backlog | P1 |

---

## 8. Vendor assignment

| | |
| --- | --- |
| **Routes** | Maintenance detail `#vendor` · `/vendors` |

**Friction**

| Finding | Priority |
| --- | --- |
| Assign buried on detail; Ops vendor card rarely finishes the job | P0 |
| Must remember which vendors cover which trades | P1 |
| Creating vendor mid-assignment forces context switch | P1 |
| Missing Quick Action: “Assign vendor” from Ops WO attention | P0 |

---

## 9. Vendor completion

| | |
| --- | --- |
| **Routes** | Maintenance edit/detail · vendor portal |

**Friction**

| Finding | Priority |
| --- | --- |
| Complete WO commonly requires Edit | P0 |
| No single “close out” confirmation with resident notify toggle default | P1 |
| Vendor portal completion may not surface clearly on PM Ops | P1 |

---

## 10. Resident payments

| | |
| --- | --- |
| **Routes** | `/financials`, `/financials/charges`, charge detail payment form · portal payments |

**Friction**

| Finding | Priority |
| --- | --- |
| Ops “Record Payment” → charges list (2–3 more clicks) | P0 |
| Charges/expenses/statements not in sidebar (hub discovery tax) | P1 |
| No bulk record / import payments | P1 |
| Must remember charge vs payment vs statement vocabulary | P1 |
| Poor default: opening Financials shows overview, not “today’s unpaid” | P1 |

---

## 11. Resident communication

| | |
| --- | --- |
| **Routes** | `/communications`, `/communications/inbox`, threads, `/settings/notifications` |

**Friction**

| Finding | Priority |
| --- | --- |
| Announcements vs Inbox split without clear “when to use which” | P1 |
| Notification settings not in nav (banner/deep link only) | P1 |
| Messaging panels on entities hide Inbox as system of record | P1 |
| No bulk property announcement from Ops attention | P1 |
| Push enrollment still environment-blocked (LC track) — separate from DX-003 | — |

---

## 12. Property inspections

| | |
| --- | --- |
| **Routes** | **None** |
| **Nav** | None |

**Friction**

| Finding | Priority |
| --- | --- |
| Dead end: checklist/media/signature labels imply a product that does not exist | P0 |
| Training risk: new staff hunt for Inspections in nav | P0 |
| **DX-003 rule:** do not invent Inspections module here — remove or rewrite fiction | P0 |

---

## 13. Daily Operations Center

Covered in §1 with emphasis:

| Finding | Priority |
| --- | --- |
| Widget gallery > action console | P0 |
| Quick Actions mis-wired (payment, vacant→tenant) | P0 |
| Portfolio setup health competes with daily attention after go-live | P2 |

---

## 14. Command Center

| | |
| --- | --- |
| **Entry** | ⌘K / top nav |

**Friction**

| Finding | Priority |
| --- | --- |
| Creates point at CRUD `/new`, not guided Move in | P0 |
| Missing pinned: Move in/out, Transfer, Inbox, Migration | P1 |
| `G A` collision | P2 |
| Search is strong — “do today’s job” is weak | P1 |

---

## 15. Migration Center

| | |
| --- | --- |
| **Routes** | `/migration`, `/migration/new`, `/migration/[jobId]` |

**Friction**

| Finding | Priority |
| --- | --- |
| Capability-gated — easy to “lose” for some roles | P1 |
| Switching + jobs density on one page | P1 |
| Post-import first-week jumps still scatter across modules | P1 |
| Not in Command Center nav | P2 |

---

## 16. Organization settings

| | |
| --- | --- |
| **Routes** | Org switcher · setup invite · `/profile` |

**Friction**

| Finding | Priority |
| --- | --- |
| No standing Organization Settings page in nav | P0 |
| Staff invite only memorable during setup | P0 |
| Users must remember setup wizard to invite after go-live | P0 |
| Unnecessary confirmations: few; missing confirmations on org switch impact | P1 |

---

## 17. Property setup

| | |
| --- | --- |
| **Routes** | `/setup`, `/properties/new`, `/properties/[id]` |

**Friction**

| Finding | Priority |
| --- | --- |
| Setup gate blocks most of app (correct for empty orgs; harsh mid-flight) | P1 |
| Property QR enrollment easy to miss | P1 |
| Duplicate: create property from setup vs Ops vs Properties list | P2 |

---

## 18. Unit management

| | |
| --- | --- |
| **Routes** | `/units`, `/units/new`, `/units/[id]` |

**Friction**

| Finding | Priority |
| --- | --- |
| Vacancy → tenant create path inconsistency | P0 |
| Bulk unit create limited vs portfolio scale (250 units) | P1 |
| Transfer lives under Residents, not Units (discoverability) | P2 |

---

## 19. Resident management

| | |
| --- | --- |
| **Routes** | `/tenants`, lifecycle routes, bulk |

**Friction**

| Finding | Priority |
| --- | --- |
| Four sidebar entries for one domain | P1 |
| Table actions good (Move in/out/Transfer) but list vs wizard still dual | P1 |
| Bulk invites not in Ops Quick Actions | P1 |

---

## 20. Staff management

| | |
| --- | --- |
| **Routes** | Setup Invite Team · `/accept-invitation/[token]` |

**Friction**

| Finding | Priority |
| --- | --- |
| No Staff page after setup — dead end for “add leasing agent in month 3” | P0 |
| Role templates exist only in setup memory | P1 |
| **DX-003 approach:** surface Invite from Profile/Org menu reusing setup invite API — **not** a new HR module | P0 |

---

## Workflow scorecard (per workflow)

| # | Workflow | Score /10 | Top fix |
| --- | ---: | --- | --- |
| 1 | Dashboard morning review | 5 | Resolve-in-place |
| 2 | New resident onboarding | 5 | One path + applicant continuation |
| 3 | Move-in | 7 | Checklist honesty + keyboard |
| 4 | Move-out | 6 | Remove inspection fiction |
| 5 | Applicant screening | 5 | Approve → Move in |
| 6 | Lease signing | 6 | Pending signature queue |
| 7 | Maintenance request | 6 | Inline status |
| 8 | Vendor assignment | 4 | Inline assign from Ops/detail |
| 9 | Vendor completion | 5 | One-click close-out |
| 10 | Resident payments | 4 | One-shot record payment |
| 11 | Resident communication | 6 | Clarify Announcements vs Inbox |
| 12 | Property inspections | 1 | Remove fiction (no new module) |
| 13 | Daily Operations Center | 5 | Action console |
| 14 | Command Center | 5 | Lifecycle actions |
| 15 | Migration Center | 7 | Discoverability |
| 16 | Organization settings | 3 | Post-setup invite entry |
| 17 | Property setup | 7 | QR discoverability |
| 18 | Unit management | 6 | Vacancy→Move in |
| 19 | Resident management | 6 | Nav compression |
| 20 | Staff management | 2 | Reuse invite outside setup |

**Average:** ≈ **5.1 / 10** (aligns with overall Zero-Friction **5.2**).
