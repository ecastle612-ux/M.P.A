# FO OPERATIONAL EFFICIENCY — PM / ASSETS / CHECKLISTS / MOBILE / ROUTING

**Title:** FO OPERATIONAL EFFICIENCY — Preventive Maintenance, Assets + QR, Checklists, Technician Mobile, Smart Assignment  
**Status:** DESIGN COMPLETE — APPROVAL REQUIRED  
**Date:** 2026-08-18  
**Program:** FO-EFF-001 (Facility Operations Operational Efficiency)  
**Related ADR:** [ADR-034](../18-decision-log/adr-034-fo-operational-efficiency-system.md) (**Proposed**)  
**Companion:** [docs/189 — M.P.A. App-Wide Simplicity + Navigation Audit](../189-mpa-app-wide-simplicity-navigation-audit/index.md)  
**Gate:** Design → Document → **Approve** → Implement (ADR-012)  
**Production:** No production change from this package  
**Billing / Stripe / SKUs / roles:** No changes  
**New commercial product:** None — Facility Operations / Complete capability only  

---

## Constraints honored

This package does **not**:

- Implement application code, UI, migrations, Edge Functions, or scaffolding
- Deploy Preview or Production
- Mutate Production Auth, Storage, data, or Stripe
- Activate tenant payments, change SaaS pricing, enable M5, or unfreeze July
- Implement docs/201 P2 or unrelated modules
- Invent a second work-order state machine
- Present Capital Projects or Enterprise as commercial products

Recommended slices are implementable **only after Approve**. They are not work orders from this record.

**Doc numbering note:** Owner direction referenced public-request architecture as docs/204–205. Those records are **not present on `main`** as of 2026-08-18 (latest sequential customer packages end at docs/187). This design defines QR / public-request **integration contracts** that must reconcile with docs/204–205 (or their successors) when those land. Until then, public requester behavior remains **restricted by default** (see §9).

---

## Product goal

Build the next Facility Operations **efficiency layer** as **one connected operational system**, not five disconnected modules:

```
Asset
  → preventive schedule OR incoming request
  → work order
  → automatic / suggested assignment
  → technician
  → checklist
  → evidence
  → complete
  → asset / service history updated
```

Users should **see → act → complete** with minimal module hopping. This record designs the destination experience **first**, coordinated with docs/189 so Assets, PM, and technician flows are not later bolted onto a deep sidebar UX.

### Goals (after Approve + implement packages)

1. Practical asset registry (extend FAC-003) with optional Asset QR  
2. Preventive maintenance schedules that generate facility work orders when due  
3. Reusable work templates / typed checklists on work orders  
4. Phone-first technician **My Work** experience on the canonical lifecycle  
5. Deterministic, subscriber-controlled assignment / routing rules (not autonomous AI)  
6. Evidence via MEDIA-001; history via shared `maintenance_work_orders`  
7. RBAC / surface isolation via ADR-026; no new roles or SKUs  

### Non-goals

- Autonomous AI assignment / routing  
- Second CMMS or second WO stack  
- WMS / purchasing ERP / full accounting (ADR-010)  
- Capital Projects productization  
- Cosmetic redesign of Canopy  
- Property Manager residential assets in Phase 1 (unless a later Approve extends)  

---

## 1. Existing architecture reuse

| Spine | Reuse decision |
|-------|----------------|
| `maintenance_work_orders` + `work_surface = facility` | **Only** maintenance system (ADR-020). PM generation creates rows here. |
| Canonical lifecycle | `submitted → triaged → assigned → in_progress → completed → closed \| cancelled`. Facility complete → **closed** directly (no resident confirm). |
| `assignee_type` | `unassigned \| technician \| vendor` — routing writes these; no parallel assignee model. |
| `facility_assets` (FAC-003 / ADR-028) | Canonical asset registry. Evolve additively; do not create a second asset table. |
| `scan_code` | Activate for Asset QR (FAC-003 reserved; scanner UX was deferred). |
| `facility_asset_id` on WOs | Required link for asset history and PM-generated work. Keep `facility_asset_label` for unlabeled work. |
| MEDIA-001 (ADR-023) | Job evidence = `maintenance`; asset photos = `facility_asset`. PDFs/manuals → OPS-001 / DOC path, not MEDIA. |
| FAC-002 (ADR-025) | Extend report registry later for PM due/overdue and checklist completion — not a new reporting stack. |
| Category queues | `/facility/preventive-maintenance` etc. remain **category-scoped WO queues**; true PM **schedules** are a new admin surface that **feeds** the shared WO spine. |
| OPS-001 documents/tables | Optional manuals / SOPs linked from assets/templates — **not** the structured checklist engine. |
| PLAT-002 / ADR-026 | Authorization pipeline; reuse entitlements where possible. |
| Lifecycle notify | Prefer existing `notifyLifecycle` / `maintenance_notifications` soft-fail pattern (ADR-029); do not invent a parallel notify table under this program. |
| Production `facility_pm_schedules` | Compatibility hook cited in ADR-028 / docs/102. Implement package must **inventory live columns** and evolve additively — do not abandon live rows if present. |

**Hard rule:** No second work-order state machine. Technician actions map onto existing statuses + events + notes / assignment changes.

---

## 2. Asset model

### 2.1 Purpose

Practical equipment registry so location, identity, and service history are known before work starts — enabling QR prefill and PM targeting.

### 2.2 Identity and fields (practical, not all required)

| Field | Required to create? | Notes |
|-------|---------------------|-------|
| Name | Yes | Human label (e.g., Chair #14) |
| Asset number / tag (`asset_code`) | Recommended | Unique per org (FAC-003) |
| Category / `asset_type` | Yes | Existing enum + `custom_type_label` / `other` |
| Building / site | Yes (site) | Via existing property / location_scope |
| Floor, room, department | No | Labels; department is **additive** if missing today |
| Manufacturer, model, serial | No | |
| Install / purchase / warranty dates | No | |
| Status | Default Active | `active \| maintenance \| retired \| replaced` |
| Vendor | No | `vendor_vendors` |
| Notes | No | |
| Documents / manuals | No | OPS-001 / DOC link — not MEDIA PDF |
| Images | No | MEDIA-001 `facility_asset` |
| `scan_code` | No | Optional QR token |

**Principle:** Subscribers may keep records simple (name + site + type). Advanced fields are progressive disclosure.

### 2.3 Categories (examples)

HVAC, boiler, generator, exam chair, elevator, pump, vehicle, appliance, furniture, fire extinguisher — map to existing `asset_type` values + `other` / custom label. Do not explode enums for every device name.

### 2.4 History

Asset service history = facility work orders with `facility_asset_id` (completed / cancelled / open). Do **not** write a second history store into `facility_records`.

### 2.5 Relationship to FAC-003

This program **extends** FAC-003 (Approved/Accepted), it does not replace it. New work is: QR experience, department label if needed, tighter contextual actions, and PM/template/routing integration.

---

## 3. Preventive maintenance model

### 3.1 Admin-configured schedule

| Field | Required | Notes |
|-------|----------|-------|
| Name | Yes | e.g., “Monthly emergency lighting” |
| Facility / building (site) | Yes | Org-scoped site |
| Asset **or** asset category | Optional | Prefer asset when known; category expands to matching active assets **or** creates site-level WOs without asset — Owner decision §18 |
| Recurrence | Yes | See §4 |
| Start date | Yes | First eligible generation anchor |
| Checklist / template | Recommended | FK to work template |
| Responsible team / technician | Optional | Default assignee seed for routing / assign |
| Priority | Yes | Maps to existing WO priority |
| Estimated duration | Optional | Minutes; surfaces on technician card |
| Required completion evidence | Optional | Photo/video required flags on template |

### 3.2 Schedule states (admin view)

| State | Meaning |
|-------|---------|
| Active | Eligible for generation |
| Paused | No new generation; history retained |
| Ended | Terminal; no generation |

### 3.3 Occurrence / due states

| State | Meaning |
|-------|---------|
| Upcoming | Next due within look-ahead window |
| Due | Due date reached; WO should exist or be generating |
| Overdue | Due date passed and linked WO not completed/closed |
| Completed | Linked WO completed/closed for that occurrence |
| Skipped | Explicit admin skip (audited) — does not create duplicate later for same period |

Each occurrence links **at most one** generated work order (dedupe key — §4).

---

## 4. Recurrence / generation behavior

### 4.1 Recurrence types (Phase 1)

- Every N days  
- Monthly on day-of-month (or last day)  
- Every N months  
- Annually on month/day  

Phase 1 does **not** require full RRULE complexity or “business days only” calendars. If Owner needs weekday-only later, restart Design for that increment.

### 4.2 Generation rules

1. A durable job (cron / scheduled Edge / queue) evaluates **Active** schedules whose next due ≤ now (+ small grace).  
2. For each due occurrence without an existing WO: create `maintenance_work_orders` with `work_surface = facility`, category/priority from schedule, `facility_asset_id` when applicable, template snapshot attached, optional default assignee.  
3. Status of new WO: **`submitted`** or **`assigned`** if default assignee / routing applied — Owner decision §18. Recommendation: create as `submitted`, then apply routing in the same transaction to `assigned` when a rule or schedule default resolves; otherwise leave `submitted`/`triaged` for manager attention.  
4. **Prevent duplicate generation:** unique constraint on `(pm_schedule_id, occurrence_key)` where `occurrence_key` is the period identity (e.g., `2026-08` or `2026-08-15` for daily). Generation is idempotent.  
5. **Preserve history:** never delete completed occurrences or WOs because a schedule is paused/edited; edits affect **future** occurrences only.  
6. Timezone: organization or site timezone stored on schedule (default org); generate in that zone.

### 4.3 Overdue behavior

- Occurrence remains Overdue until WO reaches completed/closed or admin Skips.  
- Mission Control / My Work surfaces Overdue PM-derived WOs as attention items (docs/189).  
- Do not auto-cancel overdue WOs.

### 4.4 What PM is not

- Not a separate work system  
- Not Capital Projects  
- Not autonomous rescheduling AI  

---

## 5. Checklist / template model

### 5.1 Purpose

Reusable **work templates** that provide defaults and a structured checklist for PM, internal work, and (where appropriate) public-request triage.

### 5.2 Template fields

| Field | Notes |
|-------|-------|
| Title | e.g., Quarterly HVAC Inspection |
| Category | Maps to FO category / WO category |
| Priority default | |
| Expected duration | |
| Checklist items | Ordered typed items |
| Required evidence | Template-level photo/video flags |
| Assignment / routing defaults | Optional category / building hints consumed by routing |

### 5.3 Checklist item types (Phase 1)

| Type | Justification |
|------|---------------|
| Checkbox | Standard pass/fail step |
| Text | Free notes / observations |
| Number / reading | Temperatures, pressures, hours |
| Yes / No | Binary inspection |
| Photo / evidence | MEDIA-001 capture bound to item |

**Additional types deferred** unless Approve expands: signature, select-from-list, barcode-of-part. Phase 1 types cover the Owner examples without overbuilding a form builder.

### 5.4 Instance behavior

- When a WO is created from a template (or PM schedule with template), **snapshot** checklist definition onto the WO (immutable copy). Later template edits do not rewrite in-flight jobs.  
- Completion rules: required items + required evidence must be satisfied before Complete is accepted (server-enforced).  
- Templates are **not** OPS-001 authored documents (those remain freeform). Optional link: template → SOP document.

### 5.5 Where templates apply

| Source | Use |
|--------|-----|
| Preventive maintenance | Default |
| Internally created facility work | Optional on create |
| Public-request triage | Optional: manager applies template when promoting request → WO |

---

## 6. Technician mobile workflow

### 6.1 Philosophy

Technicians need a **substantially simpler** experience than managers. Phone-first **My Work** is the home — not Mission Control statistics and not deep sidebar hunting.

### 6.2 Home: MY WORK

Lists (tabs or sections):

- **Today** — assigned, due today / started  
- **Overdue** — past due, still open  
- **Upcoming** — assigned, future due  

Tap job → single work-order execution screen.

### 6.3 Execution flow

```
Work Order
  → Start
  → location / asset (read-only, prefilled)
  → issue / description
  → checklist
  → photo / video (MEDIA-001)
  → notes
  → Complete
```

Minimize navigation: no requirement to visit Assets, Vendors, Reports, or manager dashboards to perform assigned work.

### 6.4 Actions mapped to canonical lifecycle (no second state machine)

| Technician action | Canonical effect |
|-------------------|------------------|
| Start | `assigned` → `in_progress` (actor must be assignee) |
| Pause | Remain `in_progress`; set `execution_note` / event `work_order.paused` (metadata only — **no new status**) |
| Blocked | Remain `in_progress` or return to `assigned` per Owner decision; require reason note; event `work_order.blocked` |
| Need Parts | Note + optional stock usage / comment; **not** a new status; surfaces on manager attention |
| Need Vendor / Escalate | Reassign `assignee_type = vendor` or clear assignee + priority bump + notify manager — still canonical assign/progress events |
| Complete | Facility path → `completed` then **closed** (existing FO behavior) |

**Recommendation:** Pause / Blocked / Need Parts are **execution signals** (events + flags + notes), not new `status` enum values.

### 6.5 Route recommendation

Primary technician home: `/facility/my-work` (FO / Complete with facility scope).  
Deep link from notifications → same WO execution view.  
Managers retain `/facility/operations` and Mission Control.

### 6.6 RBAC

Reuse technician assignment scope (FAC-003 / maintenance permissions): progress only if `technician_user_id === actor`; read linked asset; no vendor admin, no routing-rule admin, no schedule admin.

---

## 7. Routing-rule model

### 7.1 Phase 1: deterministic, subscriber-controlled

**Not** autonomous AI. Admins configure ordered rules.

Examples:

- Plumbing → Mike  
- HVAC → Engineering Team (represented as a primary technician user or leave unassigned + team label in Phase 1 — see Owner decisions)  
- Building B → Maintenance Team B  
- Safety issue → Facility Manager  
- Electrical + Main Clinic → John  

### 7.2 Rule fields

| Field | Notes |
|-------|-------|
| Name | |
| Priority / order | Lower number wins |
| Match: category | Optional |
| Match: building / site | Optional |
| Match: priority / safety flag | Optional |
| Match: asset type | Optional |
| Action: assign technician | Optional user id |
| Action: assign vendor | Optional |
| Action: suggest only vs auto-assign | Admin config |
| Enabled | |

### 7.3 Conflict behavior

1. Evaluate **enabled** rules in ascending order.  
2. First fully matching rule wins.  
3. If none match: leave unassigned (or schedule default assignee if present).  
4. Always write audit: rule id, match snapshot, actor (`system:routing` vs user override).  
5. Admins may override assignment at any time (existing assign API + audit).

### 7.4 Suggest vs auto

| Mode | Behavior |
|------|----------|
| Suggest | Show recommended assignee on triage; do not write assignee until confirm |
| Auto | Write assignee when WO created / triaged; notify assignee |

Default recommendation: **Suggest** for orgs until they opt into Auto per rule or org setting.

### 7.5 Teams

Phase 1 may assign a **single technician user** only (canonical model). “Engineering Team” is either (a) a designated lead user, or (b) leave unassigned with a visible team label field — Owner decision §18. Do not invent a parallel team-queue state machine in Phase 1.

---

## 8. QR integration

### 8.1 Optional Asset QR

- Each asset may receive a QR encoding a stable public token derived from `scan_code` (or minted into `scan_code`).  
- Printing / download from asset detail (manager).  
- Rotate / revoke token = audited regeneration; old codes fail closed.

### 8.2 Scan destinations

| Actor | Experience |
|-------|------------|
| Authorized staff (FO/Complete, entitled) | Mobile asset experience: identity, location, status, open work, history, upcoming PM, manuals; actions Report Problem, Create Work Order, View History |
| Public / unauthorized | Restricted request path only — **no** open work list, history, manuals, or staff PII |

### 8.3 Prefill principle (Wendy example)

Wendy scans Chair #14 → M.P.A. already knows Main Clinic, Floor 3, Cardiology, Chair #14 → she describes broken arm, takes photo, submits. **No repeated location/asset entry.**

Server resolves asset from token; browser context is never authorization.

### 8.4 Staff Report Problem / Create WO

From asset: create facility WO with `facility_asset_id`, location labels copied, optional template. Prefer ≤2 taps after scan.

---

## 9. Public-request integration

### 9.1 Coordination with docs/204–205

When public facility request architecture (Owner-referenced docs/204–205) is present and Approved, Asset QR public scan **must** reuse that request spine rather than inventing a second public intake.

Until those records exist / are Approved:

- Design contract: public scan opens a **token-scoped request** that creates or queues a facility work item with asset prefilled.  
- Public must not read other assets, org directories, or staff data.  
- Rate-limit + abuse controls required at implement.  
- MEDIA uploads for public follow MEDIA-001 public-parent rules only if Approve authorizes; otherwise photo held on request entity until staff promotion.

### 9.2 Existing surfaces today

No public FO QR request route on `main` as of this design (staff create via `/facility/operations`; residential tenant via `/portal/tenant/maintenance`). This program must not pretend a public FO intake already ships.

### 9.3 Triage bridge

Manager triages public request → applies template → routing rules → technician My Work. Same connected workflow as PM-generated work.

---

## 10. Notifications

| Event | Audience | Deep link |
|-------|----------|-----------|
| PM WO generated | Default assignee or managers (unassigned) | WO / My Work / Operations |
| Routing auto-assign | Assignee | Technician execution view |
| Assignment override | New + previous assignee | Same |
| Overdue PM / overdue assigned work | Assignee + managers | Filtered list |
| Blocked / Need Parts / Escalate signals | Managers | WO detail |
| Public request submitted | Managers | Triage queue |

Reuse lifecycle notify patterns; email only for critical per existing preference gates. Notifications **must** deep-link to the record (docs/189 §23) — never only Mission Control.

Do not create `maintenance_notifications` if absent solely under this program without Owner Approve (ADR-029 caution). Prefer durable path Owner already accepts, or a dedicated Approve for `comms_notifications` routing.

---

## 11. RBAC

| Capability | Manager (org admin / property_manager on FO/Complete) | Technician | Tenant / Public | PM-only SKU |
|------------|------------------------------------------------------|------------|-----------------|-------------|
| Assets CRUD | Yes | Read linked to assigned WOs (+ scan of entitled assets — Owner decision) | No (public token request only) | No |
| Print QR / rotate scan | Yes | No | No | No |
| PM schedules admin | Yes | No | No | No |
| Templates admin | Yes | No | No | No |
| Checklist execute on assigned WO | Yes (override) | Yes | No | No |
| Routing rules admin | Yes | No | No | No |
| My Work | Yes (optional) | **Primary home** | No | N/A |
| Reports (FAC-002) | Yes | No | No | Surface-appropriate PM reports only |

Reuse entitlements: `facility.assets`, maintenance permissions, existing FO module grants. **Prefer no new entitlement keys** in Phase 1; if implement needs `facility.pm` / `facility.templates` / `facility.routing`, require explicit Owner Approve (list in §18).

Complete members: effective-surface aware (ADR-033) — facility actions only when facility scope is active/entitled.

---

## 12. Schema (design-level)

Additive, Production-compatible. Exact DDL is Implement-after-Approve.

### 12.1 Evolve

- `facility_assets` — ensure `scan_code`, department label if approved, QR metadata (`scan_code_rotated_at`)  
- `maintenance_work_orders` — `template_id` / checklist snapshot JSONB; `pm_schedule_id`; `pm_occurrence_id`; optional execution flags (`blocked_reason`, `paused_at`) **without** new status enum  
- Existing `facility_pm_schedules` — evolve to match §3 fields; do not drop live rows  

### 12.2 New (names indicative)

| Object | Purpose |
|--------|---------|
| `facility_pm_occurrences` | Due periods, state, FK to generated WO, dedupe key |
| `facility_work_templates` | Template header |
| `facility_work_template_items` | Typed checklist definition |
| `facility_work_order_checklist_items` | Snapshot + completion values per WO |
| `facility_routing_rules` | Ordered deterministic rules |
| `facility_routing_rule_audits` or domain events | Assignment decision history |

### 12.3 RLS / authz

Org isolation; FO surface; manager vs technician policies consistent with FAC-003 / maintenance. Public token endpoints use service role + token proof — never broad anon SELECT on assets.

### 12.4 Indexes

- Unique `(pm_schedule_id, occurrence_key)`  
- `(organization_id, scan_code)` unique where not null  
- Routing rules `(organization_id, sort_order)`  
- WO `(technician_user_id, status, due_at)` for My Work  

---

## 13. Lifecycle examples

### 13.1 Preventive → complete

1. Admin creates schedule “Rooftop HVAC 90-day” + HVAC template + asset RTU-1.  
2. Generator creates occurrence + WO due; routing assigns Engineering lead.  
3. Tech opens My Work → Start → completes checklist + photo → Complete.  
4. Asset history shows WO; occurrence Completed; next occurrence Upcoming.

### 13.2 Asset QR staff

1. Tech scans Chair #14 QR → asset sheet.  
2. Report Problem → description + photo → WO created with asset/location prefilled → routing suggests Mike.  
3. Manager confirms → Mike’s My Work.

### 13.3 Public QR (when public intake Approved)

1. Visitor scans → restricted form prefilled with Chair #14 / clinic / floor.  
2. Submits → manager triage → template + assign → tech completes → history on asset.

### 13.4 Duplicate prevention

Schedule monthly lighting for August already has occurrence `2026-08` with WO → second cron tick no-ops.

---

## 14. Mobile UX

- Thumb-reach primary actions: Start, Complete, Add photo  
- Large checklist controls; avoid desktop tables on My Work  
- Camera-first evidence  
- Offline: Phase 1 **online-required** (document; offline sync is a later design)  
- Asset QR pages must work at phone width without manager chrome  
- Preserve Canopy identity — efficiency IA, not cosmetic redesign (docs/189)  

---

## 15. Tests (implement package)

| Layer | Cases |
|-------|-------|
| Unit | Recurrence next-due; occurrence key; checklist required validation; routing first-match; scan token resolve |
| Integration | Generate WO idempotent; pause schedule; template snapshot immutability; assign override audit |
| Authz | Technician cannot admin schedules/rules; public token cannot list assets; cross-org scan fails |
| RLS | Org isolation on templates, schedules, rules |
| Lifecycle | Start/Complete mapping; facility close path; no illegal status jumps |
| Media | Evidence required blocks Complete; `maintenance` vs `facility_asset` parents |
| UX / e2e | My Work Today/Overdue; QR staff report problem prefill; PM overdue attention |

---

## 16. Implementation slices (after Approve)

Ordered for **connected system** delivery — do not ship five silos. Coordinated with docs/189 sequence.

| Slice | Scope | Depends |
|-------|-------|---------|
| **FO-EFF-S0** | Schema + domain events + entitlements decision | Approve |
| **FO-EFF-S1** | Work templates + checklist execute on facility WOs | S0 |
| **FO-EFF-S2** | Technician My Work mobile home + execution actions | S1 |
| **FO-EFF-S3** | Asset QR staff experience + Report Problem / Create WO contextual | S0; SIM search optional |
| **FO-EFF-S4** | PM schedules admin + generation + occurrence states | S1 |
| **FO-EFF-S5** | Routing rules suggest/auto + audits | S2/S4 |
| **FO-EFF-S6** | Public QR request bridge | docs/204–205 (or successor) Approved |

Simplicity spine slices (global search, Quick Create, Mission Control attention) are specified in docs/189 and should land **around S2–S3** so new FO surfaces are discoverable without sidebar archaeology.

---

## 17. Risks

| Risk | Mitigation |
|------|------------|
| Second status machine creep (Pause/Blocked) | Events + flags only; ADR-034 binding |
| Duplicate PM WOs | Unique occurrence key; idempotent generator |
| Public QR data leak | Token scope; no history for public; rate limits |
| Template over-builder | Cap Phase 1 item types |
| Team assignment without team entity | Assign lead user or unassigned + label |
| Category queues confused with PM schedules | Clear IA: Schedules admin vs Preventive **work** queue |
| Notification table ambiguity | Follow ADR-029; separate Approve for comms routing |
| Building FO deep then bolting search | docs/189 influences routes before implement |
| Scope explosion vs live product | Slice sequencing; measurable effort reduction |

---

## 18. Owner decisions

Exact decisions required before Implement:

1. **Approve** this design (docs/188) + **Accept** ADR-034?  
2. Public QR: wait for docs/204–205 Approve before any public intake implement (recommended **yes**)?  
3. PM-generated WO initial status: `submitted` then route, or direct `assigned`?  
4. Category-only PM (no asset): allowed to create site-level WOs?  
5. New entitlement keys (`facility.pm`, `facility.templates`, `facility.routing`) vs reuse only?  
6. Technician scan of any org asset vs only assigned-linked assets?  
7. “Team” assignment: lead user only in Phase 1?  
8. Suggest vs Auto default for routing?  
9. Blocked action: stay `in_progress` or return to `assigned`?  
10. Offline technician Mode in Phase 1? (Design says **no**)  
11. Department field on assets in Phase 1?  
12. Should `/facility/preventive-maintenance` remain category queue **and** add `/facility/pm-schedules` (recommended), or replace queue meaning?  

---

## Final recommendation (FO package)

**Smallest high-impact FO sequence after both Approves:**

1. Templates/checklists (structured work quality)  
2. Technician My Work (daily click reduction)  
3. Asset QR + contextual create (kill duplicate entry)  
4. PM generation (proactive work)  
5. Routing rules (assignment speed)  
6. Public QR bridge only when public-request architecture is Approved  

Do **not** implement all slices simultaneously.

---

## Status line

**FO OPERATIONAL EFFICIENCY DESIGN COMPLETE — APPROVAL REQUIRED**
