# 02 — Phase 0: Workflow Research

**Package:** UI-001 — Platform Experience Redesign  
**Phase:** **0 — Research** (before Phases 1–6 implement)  
**Status:** 🔮 **Future** · Research brief · Implement 🔒 **locked**  
**Date:** 2026-07-23  
**Parent:** [README](./README.md) · [00 Principles](./00-platform-design-principles.md) · [01 Master roadmap](./01-ui-master-roadmap.md)

> **Documentation only.** No UI changes. No implementation.  
> This phase captures **real-user workflow intent** so redesign follows jobs, not module catalogs.

---

## Purpose of Phase 0

Before redesigning pixels (Phases 1–6), document how each role actually works:

- What they do every day  
- Which workflows dominate time  
- What is time-critical  
- What traditional PM software gets wrong  
- What “home” should feel like  
- What they do in the first seconds after login  
- How they define success  

**Method note:** Content below is a **structured research brief** synthesized from:

- M.P.A. product packages (OWNER-001, VENDOR-001, DPX-003 Tenant Home, ADMIN-003, commercial spine)  
- Industry-typical property operations pain (AppFolio / Buildium / Yardi / Entrata / Propertyware class tools)  
- Design Partner / commercial readiness goals  

**Before UI-001 Approve for implement:** validate with interviews, ride-alongs, and analytics against Design Partner orgs. Mark findings **Validated** vs **Hypothesis** in a living appendix.

---

## Phase 0 placement

```
Phase 0  Workflow research          ← this document
    ↓
Phase 1  Platform Design System
    ↓
Phase 2  Navigation Redesign
    ↓
Phase 3  Dashboard Redesign
    ↓
Phase 4  Workflow Redesign
    ↓
Phase 5  Visual Polish
    ↓
Phase 6  Commercial UX Certification
```

Phase 0 **gates** Phases 1–6 prioritization. It does not redesign screens.

---

## Tenant

### 1. Top daily tasks

| Task | Notes |
|------|--------|
| Check if management said anything | Announcements, alerts, messages |
| See whether rent is due / pay rent | Money stress drives login |
| Track open maintenance | Status anxiety (“is someone coming?”) |
| Open lease / documents when needed | Infrequent but high trust |
| Community / local updates | Optional, lower frequency |

### 2. Most frequent workflows

1. Login → see attention → open message or announcement  
2. Login → Pay Rent → confirm / receipt  
3. Submit maintenance → attach photo → track status  
4. Open Messages → reply  
5. Find a document (lease, notice)

### 3. Most time-sensitive actions

- Emergency / urgent announcements  
- Rent due / failed payment  
- Vendor or tech “on the way” / access needed  
- Unread message from management requiring a reply  

### 4. Biggest frustrations with traditional PM software

| Frustration | Why it hurts |
|-------------|--------------|
| Module menus (“Resident Portal”) | Feels like corporate software, not “my home” |
| Can’t tell if anything needs me | Must hunt Notifications / Messages / Announcements separately |
| Pay rent buried | Extra clicks when stressed |
| Maintenance black hole | Submitted with no calm status story |
| Desktop-first layouts on phone | One-handed use fails  
| Jargon and empty “no data” tables | Anxiety, not reassurance |

### 5. Ideal dashboard experience

A **personal home screen**: greeted by name, shown property/unit, told what needs attention, offered a few big actions (Pay Rent, Maintenance, Messages), calm when nothing is wrong.

### 6. Primary action immediately after login

**Default:** Scan “For you” / attention.  
**If money due:** **Pay Rent** within 3 seconds.  
**If quiet:** Confirm “everything looks good” and leave.

### 7. Success definition

“I knew in seconds whether I owed money, whether management needed me, and what to tap next — without hunting menus.”

---

## Owner

### 1. Top daily tasks

| Task | Notes |
|------|--------|
| Check portfolio / property health | Occupancy, issues, “is my asset okay?” |
| Review money in / statements | Trust and cash clarity |
| See owner documents / reports | Statements, tax packs later |
| Read messages from PM | Relationship + decisions |
| (Future) Payout / Connect status | After FIN-003 |

### 2. Most frequent workflows

1. Open dashboard → scan financial snapshot / alerts  
2. Open Financials or statement → download / understand  
3. Messages with PM  
4. Drill into a property  
5. Documents / reports library  

### 3. Most time-sensitive actions

- Large unexpected expense or vacancy signal  
- Statement / report ready  
- Message needing approval or decision  
- Payout failed / action required (post–FIN-003)  

### 4. Biggest frustrations with traditional PM software

| Frustration | Why it hurts |
|-------------|--------------|
| PM console dumped on owners | Too many ops modules, wrong mental model |
| Opaque “where did my money go?” | No calm remittance story |
| Stale PDFs only | No living attention feed |
| No mobile-friendly owner home | Check portfolio on the go fails |
| Fake zeros / silent empties | Breaks trust |

### 5. Ideal dashboard experience

An **investor / owner home**: portfolio pulse, money and docs that need eyes, messages, clear next step — never a maintenance dispatch board.

### 6. Primary action immediately after login

**Scan attention** (money, docs, messages).  
**Primary CTA** often: open latest statement / financials, or reply to PM.  
When payouts live: resolve Connect / payout action if flagged.

### 7. Success definition

“I understood my properties’ money and messages today without pretending to be a property manager.”

---

## Property Manager

### 1. Top daily tasks

| Task | Notes |
|------|--------|
| Clear maintenance queue | Assign, chase vendors, close loops |
| Handle resident communications | Messages, announcements, complaints |
| Collections / rent exceptions | Delinquency, failed payments |
| Leasing pipeline touchpoints | Showings, apps, move-ins (cadence varies) |
| Owner updates | Proactive trust |
| Inspections / turnovers | Seasonal spikes |

### 2. Most frequent workflows

1. Triage inbox / notifications → reply or create WO  
2. Work-order board → assign vendor → follow up  
3. Resident issue → message or announcement  
4. Delinquency list → call / notice / payment plan  
5. Owner message or statement prep  
6. Lease / applicant step (when active)

### 3. Most time-sensitive actions

- Emergency maintenance / life safety  
- Access / entry coordination  
- Angry or escalated resident thread  
- Payment failures affecting many units  
- Owner-critical financial exception  

### 4. Biggest frustrations with traditional PM software

| Frustration | Why it hurts |
|-------------|--------------|
| Everything is a module | No “clear my day” queue |
| Too many clicks to assign / close WO | Death by forms |
| Notifications without prioritization | Alarm fatigue |
| Context switching (resident ↔ property ↔ vendor) | Lost time |
| Mobile is a crippled desktop | Field / couch work fails |
| Reports ≠ action | Data without next step |

### 5. Ideal dashboard experience

An **ops command home**: severity-ordered work, next best action, queues for maintenance / messages / money — drill into workflows, don’t duplicate every module on the home canvas.

### 6. Primary action immediately after login

**Clear the top queue item** (often emergency WO or unread escalated message).  
Primary CTA: **Continue / Assign / Reply** on the highest-severity card.

### 7. Success definition

“I emptied the urgent pile faster than yesterday, without opening seven modules to find the pile.”

---

## Vendor

### 1. Top daily tasks

| Task | Notes |
|------|--------|
| See today’s assigned jobs | Where / when / what |
| Start / finish jobs | Status truth for PM |
| Capture photos / notes | Proof of work |
| Invoice / payment status (as product allows) | Get paid |
| Message PM on blockers | Access, parts, scope |

### 2. Most frequent workflows

1. Open job → navigate / arrive → Start  
2. Complete work → photos → Finish  
3. Update blocked / need access  
4. Check next job on the list  
5. Submit invoice artifacts (where enabled)

### 3. Most time-sensitive actions

- Job starting soon / overdue  
- Access window  
- Scope change from PM  
- Payment / invoice rejection  

### 4. Biggest frustrations with traditional PM software

| Frustration | Why it hurts |
|-------------|--------------|
| Heavy portals for simple job status | Friction in the truck |
| Email / text chaos instead of one job rail | Lost updates |
| No offline-tolerant field UX | Parking-lot failure |
| Photo upload friction | Skipped evidence |
| Unclear “am I done / paid?” | Trust and cashflow stress |

### 5. Ideal dashboard experience

A **job rail home**: today list, one obvious Start/Continue/Finish, minimal chrome, phone-first (align VENDOR-001 zero-friction).

### 6. Primary action immediately after login

**Open / Start the next job** (or Continue in-progress).  
Everything else is secondary.

### 7. Success definition

“I started or finished the right job in under a minute, with proof uploaded, without desktop software.”

---

## Administrator (Master Admin / platform ops)

### 1. Top daily tasks

| Task | Notes |
|------|--------|
| Monitor platform health | Providers, jobs, errors |
| Investigate incidents | Logs, failed webhooks, push, payments |
| Support impersonation / portal test | Reproduce resident/PM issues |
| Config / flags / org oversight | Controlled changes |
| Security / access reviews | Periodic |

### 2. Most frequent workflows

1. Open Mission Control → top severity alert → drill  
2. Impersonate / portal test → verify fix  
3. Check provider / integration status  
4. Review failed background jobs  
5. Adjust flag or route to eng  

### 3. Most time-sensitive actions

- Payment / webhook failure affecting money  
- Auth / outage  
- Push or notification delivery collapse  
- Data isolation / RBAC incident  

### 4. Biggest frustrations with traditional PM / admin tools

| Frustration | Why it hurts |
|-------------|--------------|
| Admin = kitchen sink settings | No “what’s on fire” |
| Alerts without severity | Noise |
| Impersonation hidden or unsafe | Support slow or risky |
| No single ops home | Tab sprawl across vendors (Stripe, OneSignal, etc.) |
| Pretty dashboards that aren’t actionable | Vanity metrics |

### 5. Ideal dashboard experience

**Mission Control:** severity-ordered incidents, clear Investigate/Resolve primary, search/jump to workspace — aligned with ADMIN-003, still answering “what should I do now?”

### 6. Primary action immediately after login

**Investigate the highest-severity open alert** (or confirm green / all clear).

### 7. Success definition

“I saw the worst problem first, opened the right tool, and knew whether the platform was healthy — without hunting settings.”

---

## Cross-role synthesis

| Theme | All roles |
|-------|-----------|
| Login intent | Attention + next action — not module tour |
| Time pressure | Money, emergencies, access, reputation |
| Mobile | First-class, not a shrunk desktop |
| Trust | Honest empties; no fake success |
| Frustration root | Software organized by **vendor modules**, users organized by **jobs** |

---

## Design implications

1. **Homes must be job canvases** — queues and attention beats, not IA sitemaps.  
2. **One primary CTA per role state** — Pay Rent / Start Job / Clear Top Alert / Open Statement.  
3. **Progressive disclosure is mandatory** — depth lives in workflows (Phase 4), not on home.  
4. **Consumer chrome for Tenant/Owner/Vendor**; **ops chrome for PM/Admin** — but both still use the same hierarchy shape.  
5. **Mobile-first for Tenant, Vendor, Owner check-ins**; PM benefits too for field/escalations.  
6. **Trust UX** (empties, errors, loading) is part of workflow success — not Phase 5 afterthought only.  
7. **Do not optimize rare admin settings paths** at the expense of daily queues.  
8. **FIN-003 / payouts** become Owner time-sensitive jobs when live — plan dashboard slots now, implement when product ready.  
9. **Photo/capture friction** (maintenance, vendor, inspections) is a workflow research finding → compose with UX-010 when Approved.  
10. **Validate hypotheses** with Design Partners before locking Phase 3–4 scope.

---

## How workflow research changes UI-001 priorities

| Prior roadmap bias | Phase 0 correction |
|--------------------|-------------------|
| Start with visual system polish in isolation | Keep Phase 1, but **size tokens to job UIs** discovered here (queues, feed rows, big CTAs) |
| Equal dashboard effort for all roles | **Sequence Phase 3 by commercial pain:** Tenant (done → protect) → PM → Owner → Vendor → Admin |
| Phase 4 alphabetical workflows | **Reorder jobs by frequency × urgency:**  
  1) Messaging (all roles)  
  2) Maintenance (PM + Tenant + Vendor)  
  3) Rent payment (Tenant)  
  4) Documents (Tenant/Owner)  
  5) Owner money/statements  
  6) Vendor start/finish rail  
  7) Leasing / inspections / accounting as capacity allows |
| Navigation redesign as taste | Nav must encode **daily jobs** from this research (primary vs More maps per role) |
| Certification as beauty contest | Phase 6 scores **workflow efficiency + time-to-primary-action** using Phase 0 success definitions |
| Build features users “might want” | UI-001 stays **reshape existing** — research forbids new module sprawl |

### Updated phase priority (research-informed)

```
Phase 0  Workflow research (validate with users)   ← required before implement
    ↓
Phase 1  Design system (job-shaped components)
    ↓
Phase 2  Navigation (job maps from Phase 0)
    ↓
Phase 3  Dashboards (PM & Owner next after Tenant reference)
    ↓
Phase 4  Workflows (message → maintenance → rent → …)
    ↓
Phase 5  Polish (trust states elevated)
    ↓
Phase 6  Commercial UX certification (job success metrics)
```

---

## Research validation checklist (pre-Approve)

| # | Activity | Owner |
|---|----------|--------|
| V1 | 5+ Tenant interviews / session replays | Product |
| V2 | 5+ PM day-in-the-life or diary | Product |
| V3 | 3+ Owner interviews | Product |
| V4 | 3+ Vendor field interviews | Product |
| V5 | Admin / ops incident shadowing | Architect + Product |
| V6 | Analytics: top entry routes + time-to-CTA | Eng |
| V7 | Update this doc: Hypothesis → Validated | Product |

---

## Related

- [00 — Platform design principles](./00-platform-design-principles.md)  
- [01 — UI master roadmap](./01-ui-master-roadmap.md)  
- [03 — UI Constitution](./03-ui-constitution.md)  
- [DPX-003 Tenant home](../96-dpx-003-commercial-product-experience/13-tenant-home-screen.md)  
- [OWNER-001](../104-owner-001-commercial-owner-portal/README.md) · [VENDOR-001](../101-vendor-001-zero-friction-vendor-experience/README.md) · [ADMIN-003](../95-admin-003-master-admin-operations-center/README.md)
