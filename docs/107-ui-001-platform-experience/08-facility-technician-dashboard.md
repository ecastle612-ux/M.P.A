# 08 — Facility Technician Dashboard (Work Companion)

**Package:** UI-001 — Platform Experience Redesign  
**Surface:** Future Facility Technician home (job rail / work companion)  
**Status:** 🔮 **Future** · Design specification only · Implement 🔒 **locked**  
**Date:** 2026-07-24  
**Parent:** [README](./README.md) · [05 Premium vision](./05-premium-product-vision.md) · [06 PM dashboard](./06-property-manager-dashboard.md) · [07 Universal framework](./07-universal-dashboard-framework.md)

> **Documentation only.** No UI code. No implementation. No schema. No APIs.  
> This is **not** a traditional dashboard. It is a **field work companion**.  
> Role surface may await AUTH-001 Slice D unlock; this doc binds the experience so UI-001 does not invent a PM-console dialect for technicians.

---

## Objective

Design the Facility Technician home so that within **3 seconds** the technician knows:

| Question | Answered by |
|----------|-------------|
| **Where do I go next?** | Property (+ unit) on Greeting + Hero Job |
| **What do I do next?** | Hero Job primary CTA (**Begin Job** / Continue) |
| **What do I need?** | Parts, photos, access cues on Hero Job |
| **Is anything urgent?** | Critical alerts + priority on Hero Job |

**Emotional contract** ([05](./05-premium-product-vision.md)): *Focused* — “Here’s my next job — start, finish, prove.”

**Quality bar:** Best field-service experience in property management — phone-first, one-handed, interruption-tolerant. Closest live reference patterns: Vendor token job card + VENDOR-001 zero-friction — **specialize**, don’t copy PM Ops.

**Framework:** Must comply with [07 — Universal Dashboard Framework](./07-universal-dashboard-framework.md) (anatomy, R33–R35, anti-patterns, property name at top).

---

## Design law — work companion, not dashboard

| This product is | This product is not |
|-----------------|---------------------|
| A ranked job rail | An analytics dashboard |
| A companion through Travel → Finish | A module launcher |
| Large verbs in the thumb zone | Tiny icon chrome |
| Photo- and status-first | Form- and filter-first |
| Offline-tolerant | Desktop table ported to phone |

**PM contrast** ([06](./06-property-manager-dashboard.md)): Managers clear a multi-domain pile. Technicians execute **one next job**. Density stays ultra-low.

---

## Framework mapping

| Universal (07) | Technician label | Notes |
|----------------|------------------|-------|
| Greeting | Greeting | **Property name at top** (next/active job property) |
| Today’s mission | Today’s mission | One field sentence |
| Highest priority task | **Hero Job** | Dominant **Begin Job** / Continue |
| Critical alerts | Critical alerts | ≤ 5; omit if empty |
| Work queue | Today’s work queue | Remaining jobs today |
| Waiting on others | Waiting on others | Parts, approval, access, resident |
| Recently completed | Completed today | Loop closure |
| Quick actions | Quick actions | Context-aware one-taps (≤ 6 on home; more on job screen) |
| Insights | Insights | Below fold only; optional omit |
| Navigation | Minimal chrome | Job list + Profile/More — never Ops sidebar |

---

## Dashboard structure (canonical)

```
1. Greeting                 (+ property name at top)
2. Today’s mission
3. Hero Job                 ← 3-second answer
4. Critical alerts          (max 5; omit if empty)
5. Today’s work queue
6. Waiting on others        (omit if empty)
7. Completed today          (omit if empty)
8. Quick actions            (≤ 6 on home)
9. Insights                 (below fold only; prefer omit)
10. Navigation              (minimal — supportive)
```

### First viewport (no scroll)

```
┌─────────────────────────────────────────┐
│ Good morning, Jordan                     │
│ High Rise Apartments · Unit 12B          │
│ 4 jobs today · 1 urgent — start here.    │
├─────────────────────────────────────────┤
│ HERO JOB                                 │
│ Emergency · No hot water                 │
│ High Rise Apartments · Unit 12B          │
│ Resident: Maya Chen                      │
│ ~45 min · Parts: cartridge               │
│ Photos required: before / after          │
│ Travel: 12 min away                      │
│                                          │
│        [  Begin Job  ]                   │
└─────────────────────────────────────────┘
```

Critical alerts **or** first queue row may sit just below on taller phones; Hero Job CTA must remain the only filled primary.

---

## Section specifications

> **Data source** = logical field/job reads. Prefer reuse of maintenance / assignment / facility / messaging / media patterns when implement is Approved. **No new APIs authorized by this doc.**

---

### 1. Greeting

| Field | Spec |
|-------|------|
| **Purpose** | Orient: who + **where** (property for next/active job) |
| **Priority** | P0 |
| **Data source** | First name; time greeting; **property name** (required when associated); unit of next/active job; locale date |
| **Primary CTA** | None competing with Begin Job |
| **Mobile** | Greeting → **High Rise Apartments** (prominent) → unit |
| **Loading** | Greeting + property-line skeletons |
| **Empty** | No assignment: “No property for today’s jobs yet” / waiting copy — never fake property |
| **Hidden** | Never hide greeting; property line only if no association |

---

### 2. Today’s mission

| Field | Spec |
|-------|------|
| **Purpose** | One sentence: load + urgency |
| **Priority** | P0 |
| **Data source** | Counts: jobs today, urgent count, in-progress flag |
| **Primary CTA** | Soft jump to Hero Job |
| **Mobile** | Single plain line |
| **Loading** | Muted line skeleton (no false “all clear”) |
| **Empty / calm** | “No jobs assigned yet — you’re on standby.” / “Queue clear — nice work.” |
| **Hidden** | Never (wording changes) |

**Examples:** “4 jobs today · 1 urgent — start here.” · “Finish current job at High Rise, then 2 left.”

---

### 3. Hero Job (Highest priority task)

| Field | Spec |
|-------|------|
| **Purpose** | Answer where / what / what I need / urgency in one card |
| **Priority** | **P0 — flagship hero** |
| **Data source** | Rank #1 job (in-progress first, else next by priority + schedule) |
| **Primary CTA** | **Begin Job** (or **Continue Job** if already started) → job timeline screen |
| **Mobile** | Full-width; CTA ≥ 56px height; thumb-zone bottom of card |
| **Loading** | Large card skeleton |
| **Empty** | Calm standby card (see Empty states) — still occupies hero slot |
| **Hidden** | Never as a section |

#### Hero Job card — required fields

| Element | Required | Notes |
|---------|----------|-------|
| Property | **Yes** | e.g. High Rise Apartments |
| Unit | When applicable | e.g. Unit 12B |
| Priority | **Yes** | Emergency / High / Normal — calm label, not siren UI |
| Resident name | When appropriate | Show when access/contact needed; hide if privacy policy / vacant / not needed |
| Issue | **Yes** | Human title + one-line description |
| Estimated duration | When known | e.g. ~45 min; omit if unknown (don’t invent) |
| Travel status | When useful | Not started / En route / X min / Arrived |
| Required parts | When listed | Names/qty; “None listed” only if explicitly empty checklist |
| Required photos | When policy requires | e.g. Before / After / Serial |
| Primary CTA | **Yes** | **Begin Job** / **Continue Job** |

**Secondary (on card, quieter):** Open map · Call resident · Message manager — never equal visual weight to Begin Job.

**Ranking:** In-progress job wins → emergency/urgent scheduled next → soonest ETA → oldest open.

---

### 4. Critical alerts (max 5)

| Field | Spec |
|-------|------|
| **Purpose** | Only field-critical interrupts |
| **Priority** | P0 when present; omit when empty |
| **Data source** | Life-safety / emergency reassign, access window closing, cancel/scope change, parts failure on active job |
| **Primary CTA** | Open alert → job or instruction |
| **Mobile** | ≤ 5 vertical rows; no animation spam |
| **Loading** | Prefer fold into hero skeleton |
| **Empty** | **Hide section** |
| **Hidden** | Count = 0 |

**Exclude:** Portfolio KPIs, leasing, accounting, unrelated PM chatter.

---

### 5. Today’s work queue

| Field | Spec |
|-------|------|
| **Purpose** | Remaining jobs after the hero — still action rows, not a table |
| **Priority** | P0 |
| **Data source** | Today’s assigned jobs excluding hero (or including collapsed summary) |
| **Primary CTA** | Tap row → job screen (or promote to hero if allowed) |
| **Mobile** | Cards; cap **5–6** + “Later today”; **no tables** |
| **Loading** | 3 card skeletons |
| **Empty** | Hide if only hero exists; else calm “No more jobs after this one” |
| **Hidden** | No remaining jobs |

**Row anatomy:** Priority edge · Issue · Property · Unit · Time window · Parts ready? badge.

---

### 6. Waiting on others

| Field | Spec |
|-------|------|
| **Purpose** | Blocked work — don’t lose it; don’t pretend it’s actionable |
| **Priority** | P1 |
| **Data source** | Waiting: parts, PM approval, resident access, vendor specialty, inspection hold |
| **Primary CTA** | Message manager / Nudge / View status |
| **Mobile** | Cap ≤ 5 compact rows |
| **Loading** | Omit until ready |
| **Empty** | **Hide section** |
| **Hidden** | Empty |

---

### 7. Completed today

| Field | Spec |
|-------|------|
| **Purpose** | Close the loop; confidence at end of day |
| **Priority** | P2 |
| **Data source** | Jobs finished today by this technician |
| **Primary CTA** | Optional open receipt / photos |
| **Mobile** | Cap ≤ 3; quiet |
| **Loading** | Optional omit |
| **Empty** | **Hide section** |
| **Hidden** | Empty |

---

### 8. Quick actions (home)

| Field | Spec |
|-------|------|
| **Purpose** | One-tap field verbs — **secondary** to Hero Job CTA |
| **Priority** | P2 |
| **Data source** | Context of hero/active job + permissions |
| **Primary CTA** | None dominant among peers |
| **Mobile** | ≤ 6 on home; large targets; wrap — no horizontal-only mandatory scroll |
| **Loading** | Optional |
| **Empty** | Hide unavailable actions |
| **Hidden** | No job context and no useful globals |

#### One-tap action catalog

Home shows a **context-smart subset (≤ 6)**. Full set available on the **job screen** sticky bar / sheet.

| Action | When shown | Notes |
|--------|------------|-------|
| **Begin Job** / Continue | Hero / job screen | Home hero owns the filled primary; don’t duplicate equal weight in the grid |
| **Start route** | Job not yet en route | Sets travel status; opens map if available |
| **Call resident** | Resident phone present | One tap → dialer |
| **Message manager** | Always when assigned | Deep-link thread / compose |
| **Open map** | Address/geo available | System maps |
| **Take photo** | On job / after arrive | Prefer UX-010 when Approved |
| **Upload photo** | Local photos pending | Queue for poor reception |
| **Add note** | On job | Prefer short text or **voice note** when product allows |
| **Request parts** | Parts short / not listed | Message + structured request — minimize typing |
| **Complete job** | In repair/complete stage | Advances timeline; may require photos |

**Minimize typing:** defaults, chips, photos, voice notes, status taps over free-text forms.

---

### 9. Insights (below fold only)

| Field | Spec |
|-------|------|
| **Purpose** | Optional light pulse — jobs done / remaining |
| **Priority** | P3 — **prefer omit** on technician home |
| **Data source** | Today completed count, remaining count |
| **Primary CTA** | None required |
| **Mobile** | Tiny summary line max — **no charts** |
| **Loading** | Never block hero |
| **Empty** | Omit |
| **Hidden** | Default hide unless Product explicitly wants end-of-day stats |

---

### 10. Navigation relationship

| Field | Spec |
|-------|------|
| **Purpose** | Escape hatches only |
| **Priority** | Supportive chrome |
| **Allowed** | Home (companion) · Active job · Profile / More |
| **Forbidden** | Full PM Operations sidebar, Accounting, Leasing module grids |
| **Mobile** | Bottom nav ≤ 3–4 items if used; job screen may hide nav behind sticky actions |

---

## Field workflow — job timeline screen

Optimize for: **one hand · bright sun · poor reception · gloves · walking · interruptions · offline**.

```
Travel
  ↓
Arrive
  ↓
Inspect
  ↓
Take photos
  ↓
Complete repair
  ↓
Resident confirmation (if required)
  ↓
Finish
```

### Stage specs

| Stage | User intent | Primary CTA | Evidence / needs | Offline |
|-------|-------------|-------------|------------------|---------|
| **Travel** | Going to site | **Start route** / Open map | Address, ETA, access notes | Cache address + job packet |
| **Arrive** | On site | **I’ve arrived** | Timestamp; optional geo | Queue status patch |
| **Inspect** | Confirm issue | **Continue** | Notes (voice/text), safety flags | Local draft |
| **Take photos** | Proof before/during | **Take photo** | Required slots (before/after/serial) | Store locally; upload when online |
| **Complete repair** | Work done | **Mark repaired** | Parts used chips, short note | Queue |
| **Resident confirmation** | When policy requires | **Request confirm** / Skip if N/A | Signature/ack if product supports | Queue |
| **Finish** | Close job | **Finish job** | Completeness check (photos/parts) | Sync; show “Saved on device” if pending |

**Rules:**

- One stage primary at a time (R35 / Constitution one job per moment).  
- Back/forward allowed; never lose local drafts.  
- Interruptions: returning opens **Continue** on current stage — not restart.  
- Prefer photos over paragraphs; prefer status chips over dropdown mazes.  
- Compose with [UX-010](../105-ux-010-unified-image-acquisition/README.md) when Approved — do not invent a second capture system in this doc.

---

## Mobile strategy

| Rule | Spec |
|------|------|
| Layout | **Single column** always |
| Tap targets | Primary ≥ **56px**; secondary ≥ **48px**; glove-friendly spacing |
| Actions | **Bottom sticky** on job screen; home Hero CTA large and low on card |
| Tables | **Forbidden** |
| Horizontal scroll | **Forbidden** for primary content/actions |
| Contrast | High-contrast text for sunlight; avoid pale gray body copy |
| Offline-first | Job packet + media queue on device; honest “Waiting to sync” |
| Thumb zone | Primary verbs in bottom third |
| Nav | Minimal; never cover Finish / Begin |
| Typing | Last resort; chips, photos, voice, call/message |

---

## Empty & waiting states

| State | Hero / mission copy | CTA |
|-------|---------------------|-----|
| **No assigned jobs** | “No jobs assigned yet.” Mission: on standby. | Message manager · Pull to refresh |
| **Waiting for assignment** | “Waiting for your next assignment.” | Message manager |
| **Waiting for parts** | Hero may be waiting card: job named + “Blocked — parts.” | Request parts · Message manager |
| **Waiting for approval** | “Waiting on manager approval.” | Message manager · View status |
| **End of day** | “You’re clear — all jobs finished today.” Completed today visible. | Optional Insights line; rest |

**Never:** Empty widget grids, fake jobs, “No data” tables.

---

## Anti-patterns (technician-specific)

| Forbidden | Why |
|-----------|-----|
| ❌ Desktop tables | Unusable in field |
| ❌ Complex filters | Distracts from next job |
| ❌ Tiny buttons | Gloves / sun / motion fail |
| ❌ Multiple nested menus | Cognitive load + delay |
| ❌ Data-heavy widgets / KPI walls | Admires data; fails 3-second test |
| ❌ Chart-first home | Insights above jobs |
| ❌ PM Operations chrome | Wrong mental model |
| ❌ Equal-weight action grids vs Begin Job | No hero |
| ❌ Required essays to complete | Typing tax |
| ❌ Anything that distracts from the next job | Companion fails |

Also inherit all [07 anti-patterns](./07-universal-dashboard-framework.md).

---

## Compliance (framework checklist)

| # | Check | Pass? |
|---|-------|-------|
| C1 | Anatomy order preserved (Hero Job = Highest priority task) | ☐ |
| C2 | R33: property at top + attention + next action | ☐ |
| C3 | One dominant CTA: Begin / Continue Job | ☐ |
| C4 | Critical alerts ≤ 5; hidden when empty | ☐ |
| C5 | Queue = cards, not tables | ☐ |
| C6 | Insights below fold or omitted | ☐ |
| C7 | Nav minimal — not a module launcher | ☐ |
| C8 | Field mobile rules (targets, offline, no h-scroll) | ☐ |
| C9 | Job timeline Travel → Finish defined | ☐ |
| C10 | No new product modules invented; reuse maintenance/media/messaging patterns when Approved | ☐ |

---

## Sequencing / gate notes

| Item | Status |
|------|--------|
| Implement | **Locked** until UI-001 + role surface Approve |
| Membership role | May depend on AUTH-001 Slice D — design still binding |
| Scope law | Reshape assigned-job experience; do not invent Accounting/Leasing for techs |
| Related live patterns | Vendor `/v/[token]` secure-link density informs the technician companion — **internal field** specialization |

---

## Deliverable summary

### 1. Dashboard structure

Greeting (property on top) → Today’s mission → **Hero Job** → Critical alerts → Today’s work queue → Waiting on others → Completed today → Quick actions → Insights (below fold / omit) → Minimal nav.

### 2. Hero Job design

Card with Property, Unit, Priority, Resident (when appropriate), Issue, Estimated duration, Travel status, Required parts, Required photos, and primary **Begin Job** / **Continue Job**.

### 3. Field workflow

Travel → Arrive → Inspect → Take photos → Complete repair → Resident confirmation (if required) → Finish — offline-tolerant, photo-first, one primary per stage.

### 4. Quick actions

One-tap: Start route, Call resident, Message manager, Open map, Take/Upload photo, Add note (voice when available), Request parts, Complete job — home ≤ 6 context-smart; full set on job screen.

### 5. Mobile strategy

Single-column, large targets, bottom actions, no tables, no horizontal primary scroll, offline-first sync honesty, minimize typing, prefer photos.

---

## Related

- [05 — Premium product vision](./05-premium-product-vision.md)  
- [06 — Property Manager dashboard](./06-property-manager-dashboard.md)  
- [07 — Universal dashboard framework](./07-universal-dashboard-framework.md)  
- [03 — UI Constitution](./03-ui-constitution.md)  
- [VENDOR-001](../101-vendor-001-zero-friction-vendor-experience/README.md) (field friction reference)  
- [UX-010](../105-ux-010-unified-image-acquisition/README.md) (capture — when Approved)
