# 04 — Platform Experience Audit (Phase 0)

**Package:** UI-001 — Platform Experience Redesign  
**Phase:** **0 — Experience audit** (workflow & usability; not visual redesign)  
**Status:** 🔮 **Future** · Audit only · Implement 🔒 **locked**  
**Date:** 2026-07-24  
**Parent:** [README](./README.md) · [00 Principles](./00-platform-design-principles.md) · [01 Roadmap](./01-ui-master-roadmap.md) · [02 Workflow research](./02-workflow-research.md) · [03 Constitution](./03-ui-constitution.md)

> **Documentation only.** No redesign. No implementation. No schema. No APIs. No UI code.  
> This audit records **current platform experience reality** so Phases 1–6 redesign against evidence, not taste.

---

## Purpose

Perform a complete **platform experience audit** across every portal and major workflow.

This is **not** a visual design exercise. It evaluates:

- Jobs each screen solves  
- First impression and primary-action clarity (≤ 3 seconds)  
- Information hierarchy  
- Navigation help vs distraction  
- Whether the UI reduces or creates work  
- One-handed mobile fitness  
- Commercial / premium feel for a paying customer  

**Lens:** [UI Constitution](./03-ui-constitution.md) · [Experience Architecture](../21-experience-architecture/index.md) · [Phase 0 workflow research](./02-workflow-research.md) · [UX-012](../112-ux-012-platform-experience-design-system/README.md) (inherited SoT)

---

## Audit method

| Step | What was done |
|------|----------------|
| 1 | Inventoriated live routes under `(portals)`, `(app)`, Master Admin, vendor token surface |
| 2 | Mapped role → home → primary nav → secondary workflows |
| 3 | Evaluated each major screen against the 8 criteria below |
| 4 | Scored major areas on a 1–10 scale (equal-weight categories) |
| 5 | Extracted Top-20 friction, opportunities, unnecessary clicks, workflow & nav improvements |

**Evidence sources:** current app routes/components, OWNER-001 / DPX-003 / VENDOR-001 / ADMIN-003 / PM-001 docs, prior Tenant first-impression audit, Operations Center composition.

**Not done (by design):** interviews, analytics instrumentation, click-timing studies, redesign comps. Mark findings **Observed** (code/docs) unless noted **Hypothesis**.

**Role model note:** Membership roles today are `property_manager`, `property_owner`, `tenant`, `vendor`. **Facility Technician** and **Organization Administrator** have no dedicated surfaces (AUTH-001 Slice D deferred). This audit still evaluates them as product expectations from UX-012 / CORE-003 reconciliation — scored as gaps.

---

## Evaluation criteria (every screen)

| # | Criterion | Question |
|---|-----------|----------|
| 1 | Purpose | What job is this screen solving? |
| 2 | First impression | What does a first-time user see? |
| 3 | Primary action | Can the user identify what to do within 3 seconds? |
| 4 | Information hierarchy | Is important information above secondary information? |
| 5 | Navigation | Is navigation helping or distracting? |
| 6 | Workflow | Does the screen reduce work or create work? |
| 7 | Mobile | Can it comfortably be used one-handed? |
| 8 | Commercial quality | Would this feel premium to a paying customer? |

---

## Platform map (current reality)

| Role (audit label) | Actual home | Surface type | Maturity |
|--------------------|-------------|--------------|----------|
| Tenant | `/portal/tenant` | Consumer portal + mobile bottom nav | Strong reference (DPX-003) |
| Owner | `/portal/owner` | Consumer portal + mobile bottom nav | Certified MVP (OWNER-001) |
| Property Manager | `/dashboard` (Ops Center) | Ops shell + dense sidebar | Capable; module-heavy |
| Facility Technician | — | **Missing** | Deferred |
| Administrator | `/master-admin` | Mission Control | Capable HQ tools |
| Vendor *(field adjacent)* | `/v/[token]` only (Vendor Portal retired) | Token job card | Secure-link primary; no authenticated portal |

**Manager Portal** (`/portal/manager`) is an explicit **future-release notice** — day-to-day PM work is Operations Center, not a dedicated manager consumer portal.

```
Consumer chrome          Ops chrome                 HQ chrome
─────────────────        ─────────────────          ─────────────────
Tenant Home              Operations Center          Mission Control
Owner Dashboard          Properties / Units         Impersonation / Flags
Vendor work queue        Maintenance / Leasing      Health / Providers
                         Accounting / Inbox
```

---

## Scorecard legend

| Band | Meaning |
|-----:|---------|
| 9–10 | Premium; job-clear; commercial showcase |
| 7–8 | Solid; usable; polish / consistency gaps |
| 5–6 | Functional; friction or density hurts |
| 3–4 | Confusing, incomplete, or wrong mental model |
| 1–2 | Broken / missing for the job |
| N/A | Surface does not exist |

Categories scored: Visual appeal · Workflow · Simplicity · Discoverability · Professional appearance · Mobile usability · Speed perception · Trust · Overall experience.

---

# Part A — Role & screen evaluations

## A1. Tenant

### Navigation

| Item | Assessment |
|------|------------|
| Desktop primary | Home, Messages, Rent, Maintenance, Documents, More — job-shaped, slim |
| Mobile bottom | Home, Rent, Messages, Maintenance, More — consumer chrome present |
| More | Announcements, Notifications, Community, Documents, New maintenance, Preferences, Profile |
| Shell | `consumerChrome` quiets role badge; org/role switchers still available — can distract single-context residents |

### Screen evaluations

#### `/portal/tenant` — Home

| Criterion | Finding |
|-----------|---------|
| Purpose | Answer “what do I need to know or do today?” |
| First impression | Greeting + place context + “For you” feed + quick actions (icons) |
| Primary action | Strong when rent/attention present; calm empty when quiet |
| Hierarchy | Greeting → For you → Quick actions → Today (progressive; empty Today suppressed when For you already calm) |
| Navigation | Supportive; bottom tabs help mobile |
| Workflow | Reduces hunting across Announcements / Messages / Notifications |
| Mobile | One-handed friendly; max-width content |
| Commercial | Closest to premium consumer; still some portal-chrome residue |

**Verdict:** Reference decision page. Protect in UI-001; do not regress.

#### `/portal/tenant/payments` — Rent

| Criterion | Finding |
|-----------|---------|
| Purpose | See balance / pay rent |
| First impression | Billing/payments view (functional commercial path) |
| Primary action | Pay path generally clear when balance exists |
| Hierarchy | Money job is primary; depth depends on billing panel density |
| Navigation | “Rent” label in nav matches mental model |
| Workflow | Core money job — high trust sensitivity |
| Mobile | Usable; forms need continued thumb-safe actions |
| Commercial | Money UX must feel bank-grade calm |

#### `/portal/tenant/messages` · announcements · notifications

| Criterion | Finding |
|-----------|---------|
| Purpose | Read/reply; learn updates |
| First impression | Separate inboxes under Home feed + More |
| Primary action | Open thread / announcement — clear inside each screen |
| Hierarchy | Home aggregates kinds; “View all” still leans announcements |
| Navigation | Messages in primary; Announcements/Notifications under More — discoverability split remains |
| Workflow | Home reduces hunt; full “unified inbox” mental model incomplete |
| Mobile | Bottom tab for Messages helps |
| Commercial | Good foundation; channel split can feel like admin software |

#### `/portal/tenant/maintenance` (+ new / detail)

| Criterion | Finding |
|-----------|---------|
| Purpose | Submit and track work orders |
| First impression | List + empty CTA to submit |
| Primary action | “Submit first request” / New — clear |
| Hierarchy | List → detail → activity; photo on create |
| Navigation | Primary nav + More shortcut for new |
| Workflow | Solid resident loop; status story must stay calm |
| Mobile | Form + photo capture sensitive; compose with UX-010 later |
| Commercial | Acceptable; status anxiety is the trust risk |

#### `/portal/tenant/documents` · community · preferences · more

| Criterion | Finding |
|-----------|---------|
| Purpose | Vault find; local updates; prefs; overflow |
| First impression | List/hub/settings patterns |
| Primary action | Open / download / toggle — adequate |
| Hierarchy | Secondary by design |
| Navigation | More pattern works |
| Workflow | Documents infrequent but high trust |
| Mobile | Lists OK; More page is link list (acceptable overflow) |
| Commercial | Quiet competence; not showcase surfaces |

### Tenant area score

| Category | Score | Notes |
|----------|------:|-------|
| Visual appeal | 7.5 | Canopy + icons; still light on atmosphere |
| Workflow | 8.0 | Home job canvas leads |
| Simplicity | 8.0 | Slim IA + progressive disclosure |
| Discoverability | 7.5 | Core jobs clear; View-all / channel split |
| Professional appearance | 8.0 | Consumer-leaning |
| Mobile usability | 8.0 | Bottom nav + content width |
| Speed perception | 7.0 | Loading/skeleton improved vs early audit; multi-fetch still a risk |
| Trust | 7.5 | Calm empties; partial-load honesty still uneven |
| **Overall experience** | **7.8** | Platform reference |

---

## A2. Owner

### Navigation

| Item | Assessment |
|------|------------|
| Desktop primary | Dashboard, Properties, Financials, Documents, Messages, Reports, Settings — **7 items** (heavy for daily jobs) |
| Mobile bottom | Home, Properties, Financials, Messages, More |
| More | Documents, Reports, Settings |
| Shell | Owner portal chrome; read-only portfolio framing |

### Screen evaluations

#### `/portal/owner` — Dashboard

| Criterion | Finding |
|-----------|---------|
| Purpose | Portfolio pulse + what needs attention |
| First impression | Welcome + optional Needs attention + **KPI grid** + latest statement + 5 activity widgets |
| Primary action | Attention items help when present; otherwise metrics compete — **3-second primary often unclear** |
| Hierarchy | Attention before metrics is correct; metrics + five widgets still dense below |
| Navigation | “Dashboard” label is ops-ish vs “Home” |
| Workflow | Good scan for money/docs/messages; can become a widget wall |
| Mobile | Bottom nav helps; KPI grid stacks — long scroll |
| Commercial | Certified and competent; more “investor report” than calm owner home |

#### `/portal/owner/properties` · `[propertyId]`

| Criterion | Finding |
|-----------|---------|
| Purpose | Read-only property list / detail |
| First impression | Cards + foundation notes; detail sections (residents, docs, activity) |
| Primary action | Open a property — clear |
| Hierarchy | Summary → sections |
| Navigation | Primary destination |
| Workflow | Reduces “am I looking at the right asset?”; intentionally no edit |
| Mobile | Cards OK |
| Commercial | Solid read-only portfolio feel |

#### `/portal/owner/financials` · reports · documents

| Criterion | Finding |
|-----------|---------|
| Purpose | Money clarity; statement/report library; doc find |
| First impression | KPIs, statements, Connect/onboarding cues; searchable browsers |
| Primary action | Open latest statement / Connect action when flagged — usually clear |
| Hierarchy | Money above archives — generally good |
| Navigation | Financials vs Reports vs Documents overlap in mental model (“where is my statement?”) |
| Workflow | Search/filter browsers reduce hunting inside libraries |
| Mobile | Browsers usable; dense financial pages need restraint |
| Commercial | Trust-critical; honest empties matter more than charts |

#### `/portal/owner/messages` · settings · more

| Criterion | Finding |
|-----------|---------|
| Purpose | PM conversation; prefs; overflow |
| First impression | Inbox/reply; settings sections |
| Primary action | Reply / save — clear |
| Hierarchy | Settings sectioned; not org-admin |
| Navigation | Messages primary on mobile; Settings in More |
| Workflow | Messaging reduces email chase |
| Mobile | Inbox reply path OK |
| Commercial | Relationship surface — keep calm |

### Owner area score

| Category | Score | Notes |
|----------|------:|-------|
| Visual appeal | 7.0 | Elevated cards; KPI-forward |
| Workflow | 7.0 | Jobs exist; home not yet single-primary |
| Simplicity | 6.5 | Desktop 7-nav + widget wall |
| Discoverability | 7.0 | Sections findable; Financials/Reports/Docs overlap |
| Professional appearance | 7.5 | OWNER-001 commercial bar met |
| Mobile usability | 7.5 | Bottom nav + More |
| Speed perception | 7.0 | Route loading present; widget fan-out |
| Trust | 7.5 | Scoped access + honest widget states |
| **Overall experience** | **7.1** | Strong MVP; home still report-page shaped |

---

## A3. Property Manager (Operations Center)

### Navigation

| Item | Assessment |
|------|------------|
| Sidebar | Long **Operations** list: Ops Center, Properties, Units, Applicants, Tenants, Move in/out, Transfer, Bulk, Leases, Maintenance, Vendors, Communications, Inbox, Accounting, Reports, AI — plus Workspace |
| Mobile | Accordion sections (Portfolio, Maintenance, Leasing, Accounting, Communications, Intelligence, Workspace) — better than flat dump, still module catalog |
| Quick create | Property, Resident, Work Order, Announcement — helpful |
| Manager Portal | Placeholder → redirects mentally to Ops |

**Navigation verdict:** Helps discoverability of modules; **distracts** from “clear my day.” Violates Constitution Rule 2 when users treat the sidebar as the product.

### Screen evaluations

#### `/dashboard` — Operations Center

| Criterion | Finding |
|-----------|---------|
| Purpose | “What should I do today?” ops command |
| First impression | Greeting + attention line + glance metrics + Needs attention today + more ops cards below |
| Primary action | Top task / Needs attention — **intended** primary; page length still competes |
| Hierarchy | Attention-first is correct; many secondary widgets below fold |
| Navigation | Sidebar remains the loudest chrome on desktop |
| Workflow | Reduces hunting when tasks resolve deep-link; still creates scroll work |
| Mobile | Usable with effort; not one-thumb command |
| Commercial | Stronger than a module grid; not yet premium “command home” |

#### Portfolio — `/properties`, `/units`, detail/edit

| Criterion | Finding |
|-----------|---------|
| Purpose | Find/manage portfolio entities |
| First impression | Tables + create CTAs |
| Primary action | Create / open row — clear on empty; table-dense when full |
| Hierarchy | List → detail tabs/sections |
| Navigation | Properties pinned; Units secondary |
| Workflow | CRUD competent; context switching cost high across entities |
| Mobile | Tables → poor one-handed; need card/list alternatives later |
| Commercial | Enterprise-competent, not consumer-premium |

#### Leasing / residents — applicants, tenants, leases, move-in/out/transfer/bulk

| Criterion | Finding |
|-----------|---------|
| Purpose | Pipeline + lifecycle jobs |
| First impression | Tables + wizards |
| Primary action | Wizards have clear steps; lists need “next applicant” clarity |
| Hierarchy | Lifecycle wizards good; directory screens are catalogs |
| Navigation | Many peer leasing items inflate nav |
| Workflow | Wizards **reduce** work; separate list modules **create** hops |
| Mobile | Wizards better than tables; sticky actions help |
| Commercial | Move-in/out feel productized; inspections called incomplete on move-out |

#### Maintenance / vendors / facility

| Criterion | Finding |
|-----------|---------|
| Purpose | Clear WO queue; assign vendors; asset/record truth |
| First impression | Work-order table + filters; vendor directory |
| Primary action | Create / open WO — clear; assign lives in detail depth |
| Hierarchy | Board → detail → workflow panel |
| Navigation | Maintenance pinned; Facility **not** top-level (by design — property-centric) |
| Workflow | Detail panels powerful but click-heavy; facility preventive planning still future-notice |
| Mobile | Field PM struggle — table-first |
| Commercial | Core ops value; friction is click count + density |

#### Communications / inbox

| Criterion | Finding |
|-----------|---------|
| Purpose | Announce + staff messaging |
| First impression | Announcement list vs Inbox — two homes for “talk to people” |
| Primary action | Compose / open thread — clear inside each |
| Hierarchy | Inbox should win daily; announcements secondary |
| Navigation | Both in primary ops list — equal weight noise |
| Workflow | Thread view reduces email; dual entry creates decision tax |
| Mobile | Inbox usable; compose forms denser |
| Commercial | Relationship-critical; unify mental model later |

#### Accounting / financials

| Criterion | Finding |
|-----------|---------|
| Purpose | Charges, payments, expenses, statements, reports |
| First impression | Accounting dashboard + deep subnav |
| Primary action | Depends on sub-page; overview can be metric-forward |
| Hierarchy | Subnav helps experts; overwhelms new PMs |
| Navigation | Accounting + Reports as peers |
| Workflow | Powerful; high cognitive load; “collections queue” widgets help |
| Mobile | Weak — spreadsheet mental model |
| Commercial | Capability strong; experience density is the gap |

#### Settings / migration / AI / profile

| Criterion | Finding |
|-----------|---------|
| Purpose | Org/team/billing/integrations; import; AI assist |
| First impression | Settings subnav; migration wizard; AI console |
| Primary action | Task-dependent |
| Hierarchy | Workspace correctly secondary |
| Navigation | Appropriate overflow |
| Workflow | Migration wizard reduces import chaos |
| Mobile | Settings OK; migration better on desktop |
| Commercial | Expected SaaS depth |

### Property Manager area score

| Category | Score | Notes |
|----------|------:|-------|
| Visual appeal | 6.5 | Canopy present; ops density |
| Workflow | 6.5 | Ops Center intent strong; module hops remain |
| Simplicity | 5.5 | Nav + tables + multi-widget home |
| Discoverability | 7.5 | Almost everything findable — at cost of calm |
| Professional appearance | 7.0 | Enterprise PM software feel |
| Mobile usability | 5.5 | Drawer sections help; tables hurt |
| Speed perception | 6.5 | Refresh/polling on dashboard; heavy pages |
| Trust | 7.0 | Capability + scoped permissions |
| **Overall experience** | **6.4** | Capable ops product; not yet “clear my day” premium |

---

## A4. Facility Technician

| Criterion | Finding |
|-----------|---------|
| Purpose | Assigned jobs → arrive → complete → proof |
| First impression | **No dedicated surface** |
| Primary action | N/A — role not in membership model |
| Hierarchy | N/A |
| Navigation | N/A |
| Workflow | Interim maps “Maintenance Manager” invite → full PM Ops (wrong density for field tech) |
| Mobile | Closest live pattern is **Vendor** token card `/v/[token]` — different role |
| Commercial | Gap vs UX-012 role playbooks; buyers expecting tech app will not find one |

### Facility Technician area score

| Category | Score |
|----------|------:|
| Visual appeal | N/A |
| Workflow | **2.0** (missing; wrong interim) |
| Simplicity | N/A |
| Discoverability | **1.5** |
| Professional appearance | N/A |
| Mobile usability | **2.0** |
| Speed perception | N/A |
| Trust | **3.0** (ops dump as interim is risky) |
| **Overall experience** | **2.0** |

---

## A5. Administrator (Master Admin)

### Navigation

Mission Control sidebar: home, impersonation, providers, testing, health, flags, dashboards, notifications (+ shared settings/migration as applicable). Portal hub supports Portal Test Mode.

### Screen evaluations

#### `/master-admin` — Mission Control

| Criterion | Finding |
|-----------|---------|
| Purpose | What’s on fire / platform health |
| First impression | Snapshot + search + ops tools |
| Primary action | Highest-severity item — generally intended |
| Hierarchy | Severity-first when alerts exist; tool catalog temptation remains |
| Navigation | HQ-appropriate |
| Workflow | Impersonation / portal test reduce support time |
| Mobile | Secondary (desktop HQ assumed) |
| Commercial | Internal premium; not customer-facing |

#### Supporting HQ tools

Impersonation, providers, health, flags, testing, notifications — **purpose clear for platform ops**. Risk is kitchen-sink settings feel if severity home regresses.

### Organization Administrator

No dedicated org-admin membership UI. Interim = PM Ops. Product expectation exists in trust/role docs — treat as **gap** similar to technician (lower urgency than field tech for GA if PM covers).

### Administrator area score

| Category | Score | Notes |
|----------|------:|-------|
| Visual appeal | 7.0 | Mission Control composition |
| Workflow | 7.0 | Severity → investigate path |
| Simplicity | 6.5 | Tool breadth |
| Discoverability | 7.5 | Explicit HQ nav |
| Professional appearance | 7.5 | Ops HQ |
| Mobile usability | 5.0 | Not primary |
| Speed perception | 7.0 | Search + snapshot |
| Trust | 8.0 | Access gating critical |
| **Overall experience** | **7.0** | Solid HQ; protect severity-first |

---

## A6. Vendor (field-adjacent — audited for completeness)

Not in the five-role ask as “Facility Technician,” but it is the live field work-queue experience.

| Surface | Verdict |
|---------|---------|
| `/v/[token]` | Zero-friction job card — strong mobile primary (VENDOR-001) |
| `/portal/vendor` | **Retired** — redirects to `/vendor-access`; vendors use `/v/[token]` |

| Category | Score | Notes |
|----------|------:|-------|
| Visual appeal | 6.0 | Functional cards |
| Workflow | 8.0 | Token path excellent; portal status updates direct |
| Simplicity | 8.0 | Tiny nav |
| Discoverability | 7.0 | Queue is the product |
| Professional appearance | 6.5 | Field-utilitarian |
| Mobile usability | 8.5 | Token-first |
| Speed perception | 8.0 | Short path |
| Trust | 7.5 | Status truth for PM/resident |
| **Overall experience** | **7.4** | Best “few clicks” field pattern on platform |

---

# Part B — Cross-cutting area scores

Scores blend role surfaces that own the area. Missing role coverage pulls Trust / Workflow down where relevant.

| Area | Visual | Workflow | Simplicity | Discoverability | Professional | Mobile | Speed | Trust | Overall |
|------|------:|---------:|-----------:|----------------:|-------------:|-------:|------:|------:|--------:|
| **Dashboards / homes** | 7.0 | 7.0 | 6.5 | 7.0 | 7.5 | 6.5 | 6.5 | 7.5 | **7.0** |
| **Navigation** | 6.5 | 6.0 | 5.5 | 8.0 | 7.0 | 6.5 | 7.0 | 7.0 | **6.6** |
| **Major workflows (create → done)** | 6.5 | 6.5 | 6.0 | 7.0 | 7.0 | 5.5 | 6.0 | 7.0 | **6.4** |
| **Settings** | 6.5 | 6.5 | 6.0 | 7.5 | 7.0 | 6.0 | 6.5 | 7.5 | **6.7** |
| **Forms** | 6.5 | 6.5 | 6.0 | 7.0 | 7.0 | 5.5 | 6.0 | 7.0 | **6.4** |
| **Tables** | 6.0 | 6.0 | 5.0 | 7.5 | 7.0 | 4.0 | 6.0 | 7.0 | **5.8** |
| **Cards / widgets** | 7.0 | 6.5 | 6.0 | 7.0 | 7.0 | 6.5 | 6.5 | 7.0 | **6.7** |
| **Notifications** | 6.5 | 6.0 | 5.5 | 6.0 | 7.0 | 6.5 | 6.5 | 6.5 | **6.2** |
| **Messaging** | 7.0 | 7.0 | 6.5 | 7.0 | 7.5 | 7.0 | 7.0 | 7.5 | **7.1** |
| **Financials** | 6.5 | 6.5 | 5.5 | 7.0 | 7.5 | 5.0 | 6.0 | 7.5 | **6.4** |
| **Maintenance** | 6.5 | 7.0 | 6.0 | 7.5 | 7.0 | 5.5 | 6.5 | 7.0 | **6.6** |
| **Documents** | 7.0 | 7.0 | 7.0 | 7.0 | 7.5 | 7.0 | 7.0 | 8.0 | **7.2** |
| **Leasing** | 6.5 | 7.0 | 6.0 | 7.5 | 7.0 | 5.5 | 6.0 | 7.0 | **6.6** |
| **Inspections** | 4.0 | 3.5 | 4.0 | 3.0 | 5.0 | 3.5 | 4.0 | 4.5 | **3.9** |
| **Accounting** | 6.5 | 6.5 | 5.5 | 7.0 | 7.5 | 4.5 | 6.0 | 7.5 | **6.3** |

**Inspections note:** No first-class PM inspections product route. Appear as WO suggestions, facility timeline filters, owner doc categories, and move-out “future update” notes — hence low score (workflow gap, not visual failure).

---

# Part C — Role score summary

| Role | Overall | Band |
|------|--------:|------|
| Tenant | **7.8** | Strong reference |
| Vendor (field) | **7.4** | Strong job rail |
| Owner | **7.1** | Solid commercial MVP |
| Administrator (Master Admin) | **7.0** | Solid HQ |
| Property Manager | **6.4** | Capable; dense |
| Facility Technician | **2.0** | Missing |
| Org Administrator | **3.0** | Deferred / interim Ops |

---

# Part D — Overall platform score

### Method

Equal-weight average of **implemented customer-facing / ops roles** (Tenant, Owner, PM, Vendor, Master Admin). Facility Technician and Org Admin gaps are reported separately and pull a **coverage penalty** into the platform score (−0.3).

| Input | Value |
|-------|------:|
| Tenant | 7.8 |
| Owner | 7.1 |
| Property Manager | 6.4 |
| Vendor | 7.4 |
| Master Admin | 7.0 |
| Mean (5 roles) | 7.14 |
| Coverage penalty (missing tech + org-admin surfaces) | −0.3 |
| **Overall platform experience score** | **6.8 / 10** |

### Interpretation

| Question | Answer |
|----------|--------|
| Feature-capable commercial platform? | Largely yes for Tenant / Owner / PM / Vendor / HQ |
| Premium, job-first experience platform? | **Not yet** — Tenant leads; PM density and missing tech surface hold the score down |
| Ready for UI-001 Phase 6 certification bar (suggested ≥ 8.5)? | **No** — this Phase 0 audit is the baseline to beat |

**Overall platform score: 6.8 / 10**

---

# Part E — Identification lists

## E1. Top 20 friction points

1. PM sidebar is a **module catalog**, not a job map — cognitive load on every login.  
2. PM **tables on mobile** force pinch/scroll ops; poor one-handed use.  
3. **Facility Technician surface missing** — field work forced into PM Ops or Vendor patterns.  
4. Owner home is a **KPI + widget wall** — primary action often unclear in 3 seconds.  
5. Owner desktop nav has **7 primaries** (Financials / Documents / Reports overlap).  
6. Tenant **communications split** (Messages vs Announcements vs Notifications) still requires learning.  
7. Tenant Home **“View all” → announcements** under-serves messages/notifications.  
8. Portal shell **org/role switchers** compete with consumer first impression for single-context users.  
9. `/portal/manager` is a **dead-end notice** while Ops is the real product — dual mental models.  
10. PM **Communications vs Inbox** equal-weight nav — decision tax.  
11. Accounting **depth without progressive disclosure** for new PMs.  
12. Maintenance **assign/complete click depth** on WO detail.  
13. **Inspections** not a first-class workflow — buried / incomplete.  
14. Notifications lack a cross-role **severity-ranked** “do this next” story.  
15. Vendor **authenticated portal** feels utilitarian vs token card polish.  
16. Forms vary in **sticky primary actions** and density across modules.  
17. Empty/error honesty uneven — some soft-fails hide urgency (e.g. money/attention).  
18. Ops Center can still **scroll into widget sprawl** after the attention block.  
19. Documents/settings vault patterns differ slightly across Tenant / Owner / PM entity pages.  
20. Org Administrator deferred — admin jobs bleed into PM Ops chrome.

## E2. Top 20 opportunities

1. Make **every role home** pass Constitution Rules 1–3 (Tenant already closest).  
2. Re-express PM nav as **daily jobs + More** (Phase 2).  
3. Promote Ops Center **top task** to unavoidable primary CTA.  
4. Owner home: **attention + one money CTA** above KPI grid.  
5. Unify Tenant attention destinations into a clearer **inbox story**.  
6. Mobile **card/list alternatives** for PM tables (Phase 1 + 4).  
7. One-handed **maintenance triage** for PM in field.  
8. Cross-role **messaging** polish (highest frequency × urgency from research).  
9. Calm **rent payment** confidence path (receipt / failure honesty).  
10. Owner **statement findability** — collapse Financials/Reports/Documents confusion.  
11. Vendor portal visual parity with token card (without adding modules).  
12. Dedicated **technician job rail** when AUTH-001 Slice D opens (reshape, don’t invent scope early).  
13. Notification center → **actionable severity**, not badge noise.  
14. Shared **loading skeletons** matching final composition on all homes.  
15. Shared **empty/error** copy language (trust UX).  
16. Progressive disclosure for Accounting (queues first, ledger later).  
17. Leasing **pipeline “next action”** on applicants home.  
18. Inspections composed as a **job** when product scope allows (with UX-010).  
19. Quiet chrome defaults for single-org / single-role sessions.  
20. Phase 6 scorecard instrumentation: time-to-primary-action per role home.

## E3. Top 20 unnecessary clicks

1. PM: Sidebar → module → row → action (vs home queue Continue).  
2. PM: Jump Communications then realize work was in Inbox (or reverse).  
3. PM: Open WO → scroll → find assign/status controls.  
4. PM: Property → Units → Unit for a resident context that could deep-link.  
5. PM: Accounting overview → subnav → target register.  
6. Owner: Dashboard widget → section → document (vs attention deep-link).  
7. Owner: Decide Financials vs Reports vs Documents for “latest statement.”  
8. Owner: Mobile More → Documents (acceptable, but Documents often daily for statements).  
9. Tenant: Home → View all → wrong channel → back → Messages.  
10. Tenant: More → New maintenance when Maintenance tab already one hop (minor).  
11. Tenant: Profile via More → `/profile` may hit ACL/redirect friction for portal-only users.  
12. Vendor portal: Status via select + confirm patterns vs large Start/Finish buttons (token path better).  
13. Manager Portal notice → Operations Center (extra hop if linked from hub).  
14. Portal hub card picking for users who already have one assigned home.  
15. Settings: multi-subnav hops for simple notification toggles.  
16. Announcement create → publish → verify readership as separate mental loops.  
17. Move-out wizard → discovery that inspections are incomplete (dead-end feel).  
18. Facility asset page → future-release notice for preventive planning.  
19. Master Admin: tool browsing when a severity alert should be one click.  
20. Re-finding filters on maintenance/applicant tables after each navigation.

## E4. Top 20 workflow improvements

1. Messaging: inbox → thread → reply in ≤ 2 hops from home for all roles.  
2. Maintenance: create → assign → complete with visible **next step** on every state.  
3. Tenant rent: due → pay → receipt without detours.  
4. Tenant maintenance: submit + photo → calm status timeline.  
5. Owner: attention item → statement/message resolution without widget tour.  
6. Owner: payout/Connect action when flagged (slot ready; product-gated).  
7. PM: Ops top task **Continue** always jumps to resolvable UI.  
8. PM: Delinquency / collections queue → action, not report-only.  
9. PM: Applicant **next screening step** from list row.  
10. Move-in/out: keep wizard strength; remove dead-end inspection promises or complete the job.  
11. Vendor token: preserve zero-friction; mirror Start/Finish language in portal.  
12. Documents: search → open → download with identical empty honesty.  
13. Notifications: tap → do the thing (deep link completeness).  
14. Announcements: resident acknowledgment path without admin jargon.  
15. Accounting: “needs posting / needs review” queue before full ledger.  
16. Owner reports: period pack find in one search language.  
17. Facility records: stay property-centric; shorten path from WO → record.  
18. Migration: exception queue → fix → resume (already strong — keep as pattern).  
19. AI Operations: suggest next ops action tied to queues (assist, don’t invent modules).  
20. Technician (future): assigned job rail only — no PM sidebar.

## E5. Top 20 navigation improvements

1. PM: Cap primary destinations to **daily jobs**; overflow to More / search.  
2. PM: Demote peer lifecycle items (Transfer, Bulk) from equal primary weight.  
3. PM: Make **Inbox** the communications primary; Announcements secondary.  
4. PM: Keep Facility off top-level (confirm) — ensure Property deep-links are obvious.  
5. Owner: Rename Dashboard → **Home**; align desktop with mobile job set.  
6. Owner: Collapse or clarify Financials / Reports / Documents IA.  
7. Owner: Keep mobile bottom at 5; avoid growing primaries.  
8. Tenant: Keep bottom tabs; refine More labels for channel clarity.  
9. Tenant: Fix View-all destination to match “For you” aggregation story.  
10. Quiet org/role switchers when single context (`consumerChrome` completion).  
11. Remove or hide Manager Portal from mental model until real — or make hub CTA = Ops only.  
12. Portal hub: auto-route single-role users (already partly true) — never teach modules first.  
13. Vendor: Keep nav minimal (queue + profile).  
14. Master Admin: severity alerts pinned above tool list.  
15. Settings: role-appropriate subsets (owner settings ≠ org settings).  
16. Consistent **Home** label language across consumer portals.  
17. Mobile PM: pin Maintenance + Inbox + Ops; accordion the rest.  
18. Breadcrumbs: remove low-value “Home” chrome on consumer portals.  
19. Search/command palette: job synonyms already started — lean on them instead of nav growth.  
20. Do not add new top-level modules for redesign (scope law).

---

# Part F — Deliverable summary

## 1. Overall platform score

### **6.8 / 10**

Baseline for UI-001. Above “broken,” below “premium commercial experience.” Tenant and Vendor token paths pull up; PM density, inspections gap, and missing technician surface pull down.

## 2. Top strengths

1. **Tenant Home** is a real decision page (greeting → attention → actions) — platform reference.  
2. **Consumer mobile bottom nav** on Tenant and Owner — correct chrome direction.  
3. **Owner portal certified MVP** with scoped read-only trust and honest widget states.  
4. **Operations Center** aims at “Needs attention today,” not a blank module grid.  
5. **Vendor token job card** is best-in-class few-click field UX.  
6. **Canopy + shared portal shell** give a coherent visual foundation.  
7. **Lifecycle wizards** (move-in/out) reduce leasing chaos vs raw forms.  
8. **Documents browsers** (especially Owner) support find/search well.  
9. **Master Admin Mission Control** supports severity + support impersonation/test paths.  
10. **Constitution / principles already written** — redesign has a lawbook.

## 3. Top weaknesses

1. **PM experience is module-dense** — navigation and tables create work.  
2. **Facility Technician (and org-admin) surfaces missing.**  
3. **Owner home primary action** often loses to KPI/widget density.  
4. **Inspections** are not a first-class workflow.  
5. **Cross-channel communication** still fragmented (especially Tenant + PM).  
6. **Mobile ops** (tables/accounting) not one-handed commercial quality.  
7. **Manager Portal placeholder** vs real Ops — dual story.  
8. **Notifications** not consistently severity → action.  
9. **Inconsistent speed/trust states** (loading/error honesty) across homes.  
10. **Platform score below UI-001 Phase 6 bar** — expected; must not pretend otherwise.

## 4. Highest-priority UX improvements

Ordered by impact × frequency × constitutional severity (documentation priority only — **no implement now**):

| P | Improvement | Why first |
|---|-------------|-----------|
| P0 | Protect Tenant Home; close remaining chrome / View-all / trust-state gaps | Reference must not regress; cheapest commercial win |
| P0 | PM navigation → job map (primary vs More) | Highest daily cognitive load |
| P0 | Ops Center: one unavoidable next action | Constitution Rules 1–2 for the largest paying role |
| P1 | Owner home: attention + money primary above widget wall | Owner commercial demos |
| P1 | Cross-role messaging path simplification | Research #1 job by frequency × urgency |
| P1 | Mobile alternatives to PM tables for top queues | Mobile usability floor |
| P1 | Notification → deep-link action completeness | Stops hunting |
| P2 | Financials/Reports/Documents IA clarity (Owner + PM accounting disclosure) | Trust + money |
| P2 | Maintenance click reduction (PM + Tenant status calm) | Core ops loop |
| P2 | Vendor portal Start/Finish parity with token card | Field consistency |
| P3 | Inspections job completeness when product scope allows | Current gap score 3.9 |
| P3 | Technician rail when AUTH-001 Slice D unlocks | Role coverage |

## 5. Recommended implementation order

Aligns with [01 — Master roadmap](./01-ui-master-roadmap.md) and [02 — Workflow research](./02-workflow-research.md). **Implement remains locked** until post-GA Approve.

```
0. Validate this audit + Phase 0 research with Design Partners (interviews/analytics)
1. Phase 1 — Design system primitives sized to jobs (queues, feed rows, big CTAs, table→card)
2. Phase 2 — Navigation redesign (PM job map; Owner/Tenant chrome quieting; label Home)
3. Phase 3 — Dashboard redesign (PM → Owner → Vendor portal → Admin; protect Tenant)
4. Phase 4 — Workflows by research order:
      Messaging → Maintenance → Rent payment → Documents → Owner money → Vendor polish
      → Leasing / Inspections / Accounting as capacity allows
5. Phase 5 — Visual polish + a11y + loading/empty/error consistency
6. Phase 6 — Commercial UX certification (target ≥ 8.5; no portal < 7.5 commercial readiness)
```

**Do not** open technician/org-admin product invention under UI-001 before AUTH-001 role surfaces are Approved. UI-001 may **reserve IA slots** only.

---

## Explicit non-actions (this document)

| Forbidden here | Status |
|----------------|--------|
| Redesign comps | Not created |
| Component moves | None |
| New modules | None invented |
| Schema / APIs / UI code | None |
| Implementation authorization | **Still locked** |

---

## Related

- [README](./README.md)  
- [00 — Platform design principles](./00-platform-design-principles.md)  
- [01 — UI master roadmap](./01-ui-master-roadmap.md)  
- [02 — Workflow research](./02-workflow-research.md)  
- [03 — UI Constitution](./03-ui-constitution.md)  
- [DPX-003 Tenant first-impression audit](../96-dpx-003-commercial-product-experience/14-tenant-first-impression-audit.md)  
- [OWNER-001](../104-owner-001-commercial-owner-portal/README.md)  
- [VENDOR-001](../101-vendor-001-zero-friction-vendor-experience/README.md)  
- [ADMIN-003](../95-admin-003-master-admin-operations-center/README.md)  
- [PM-001 certification audit](../75-pm-001-property-manager-certification/01-certification-audit.md)  
- [UX-012](../112-ux-012-platform-experience-design-system/README.md) · [Experience Architecture](../21-experience-architecture/index.md)
