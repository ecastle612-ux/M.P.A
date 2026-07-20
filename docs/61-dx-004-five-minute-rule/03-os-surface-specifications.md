# DX-004 — OS Surface Specifications

**Status:** Draft — Ready for Approval  
**Gate:** Design ✔ · Document ✔ · Approve Pending · Implement Blocked

Surfaces below are **product specifications**, not implementation tickets. Ship only after Approve + slice planning.

---

## 9. Universal Command Palette (⌘K)

### Purpose

Search everything. Navigate anywhere. Run actions. One muscle memory for interrupted operators.

### Triggers

- ⌘K / Ctrl+K  
- Search affordance in shell (Operations Center / Command Center entry)  
- Mobile: full-screen sheet from shell search icon  

### Modes (tabs or segmented results)

| Mode | Returns |
| --- | --- |
| **All** | Mixed ranked results |
| **Go to** | Routes / modules |
| **Records** | Properties, units, residents, applicants, leases, WOs, vendors, threads |
| **Actions** | Quick Add jobs, lifecycle starts, bulk entry points |
| **Help** | Shortcuts, “how do I…” → guided job or docs link |

### Result types

| Type | Preview | Primary action | Secondary |
| --- | --- | --- | --- |
| Record | Name, property, status | Open Inspector | Open full page |
| Route | Module name | Navigate | — |
| Action | Job name + one-line why | Run / open Quick Add draft | — |
| Attention | Due item summary | Resolve / Context Action | Open Inspector |

### Ranking (normative)

1. Exact match on name / unit / WO number  
2. Open attentions involving the entity  
3. Recent (session + last 7 days)  
4. Capability-filtered actions  
5. Static navigation  

### Actions catalog (minimum)

- + Resident / Applicant / Work Order / Property / Vendor / Payment / Announcement  
- Start Move in / Move out / Transfer  
- Open Inbox / Migration / Notification settings / Invite teammate  
- Jump to Today’s Work filters (Overdue, Unsigned, Unpaid, Open WOs)

### Guardrails

- Destructive actions require confirmation step inside Palette or Inspector  
- Financial create actions never auto-post  
- Results respect org + capability + RLS  

### Acceptance

- From cold keyboard: find resident by last name and open Inspector in ≤3 keystrokes after query  
- Create payment draft without visiting `/financials`  

---

## 10. Right-side Quick Inspector

### Purpose

Click any record → preview and act **without leaving the list / Today’s Work**.

### Layout

| Region | Content |
| --- | --- |
| Header | Title, status badge, close |
| Identity | Key fields (unit, property, contact) |
| Context Actions | 1 primary + ≤3 secondary |
| Details | Collapsible sections (timeline, notes, money snapshot) |
| Footer | “Open full page” |

### Desktop

- Width ~360–420px, overlays content, does not replace route  
- Esc / click outside (configurable) closes  
- URL optional: `?inspect=<type>:<id>` for share/back  

### Mobile

- Bottom sheet ≥90% height  
- Same sections; sticky Context Actions  

### Editable in-place (v1)

| Entity | Inline edits allowed |
| --- | --- |
| Resident | Phone, email, notes |
| Work order | Priority, status (safe transitions), assign vendor |
| Applicant | Status (capability-gated), notes |
| Charge | Record payment (opens Payment Quick Add prefilled) |
| Announcement | Publish / archive (if draft) |

Complex lease edits, migration review, statement generate → **Open full page**.

### Acceptance

- Assign vendor to WO from Maintenance list without `/edit`  
- Approve applicant decision from Applicants list with confirmation  

---

## 11. Universal Quick Add

### Purpose

Always-accessible create entry. Never hunt a module for a daily create.

### Triggers

- Persistent **+** in shell (desktop top bar / mobile FAB)  
- ⌘N / Ctrl+N  
- Palette “Actions”  
- Context “Create related…” from Inspector  

### Menu items (v1)

| Item | Opens |
| --- | --- |
| + Resident | Guided create / transfer-aware path ([WF-003](../55-wf-003-resident-lifecycle/00-executive-summary.md)) |
| + Applicant | Applicant form (minimal fields first) |
| + Work Order | WO draft: property → unit → title → priority |
| + Property | Property create (short) |
| + Vendor | Vendor create (short) |
| + Payment | One-shot: resident/charge → amount → method → confirm |
| + Announcement | Compose draft targeting current property context if known |

### Behavior

- Modal or drawer; **never** full navigation away until Save  
- Prefill from page context (property filter, selected unit)  
- On success: toast + optional “Open Inspector” / “Add another”  
- Failures stay in place with field errors  

### Acceptance

- From any authenticated app page, create WO in ≤2 minutes without sidebar hunting  

---

## 12. Today’s Work

### Purpose

Everything due **today** (and overdue). The OS home.

### Placement

Primary surface of Operations Center (`/dashboard`). Metrics / pulse secondary below or collapsed.

### Buckets (default)

| Bucket | Includes |
| --- | --- |
| Overdue | Past-due attentions |
| Due today | Signatures, move-in steps, unpaid, open high-priority WOs, unread urgent messages |
| Waiting on others | Screening external, vendor response, resident signature |
| Suggested | AI Next Best Action (distinct styling) |

### Row anatomy

1. Why it matters (one line)  
2. Entity chip (resident / unit / WO)  
3. **Context Action** (primary button)  
4. Open Inspector  
5. Snooze / dismiss (capability-gated; audit)  

### Filters

- Mine / Team / All  
- Property  
- Type (Maintenance, Money, Lifecycle, Comms)  

### Acceptance

- Morning clear of top 5 due items ≤5 minutes without training  
- No mandatory scroll past promotional widgets to see due work  

---

## 13. AI recommendation opportunities (Next Best Action)

### Principle

AI **suggests**; humans **commit**. Especially money, access, lease activation.

### Surfaces

| Surface | Recommendation examples |
| --- | --- |
| Today’s Work | “3 unpaid >7 days — send reminder batch?” |
| Inspector | “WO open 4 days — assign Vendor X (nearest)?” |
| Palette | “Continue incomplete move-in for Unit 12B” |
| Post-create | “Payment recorded — message resident receipt?” |

### Allowed suggestion classes

- Prioritize / order Today’s Work  
- Prefill assignees, templates, amounts already on charge  
- Draft message / announcement copy for edit  
- Surface incomplete guided jobs  

### Forbidden without explicit confirm

- Auto-approve applicants  
- Auto-post payments or write-offs  
- Auto-activate leases  
- Auto-delete / mass archive  

### Telemetry (post-Approve)

- Suggestion shown / accepted / dismissed  
- Time-to-complete for jobs with vs without suggestion  

---

## Context Actions (cross-cutting)

Every card / list row / Inspector answers: **“What is the next thing I should do?”**

| Entity | Example primary |
| --- | --- |
| Vacant unit | Start Move in |
| Applicant ready | Approve / Decline |
| Unsigned lease | Send / remind signature |
| Open WO | Assign / Complete |
| Unpaid charge | Record payment |
| Draft announcement | Publish |
| Incomplete move-in | Resume checklist |

One primary. ≤3 secondary. No kebab of 12 equals.
