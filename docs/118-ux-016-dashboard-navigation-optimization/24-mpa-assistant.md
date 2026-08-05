# 24 — M.P.A. Assistant (Slice D)

**Package:** UX-016  
**Slice:** D  
**Status:** ✅ **Authorized** (see [23](./23-slice-d-authorization.md))  
**Date:** 2026-08-05  
**Constraint:** Presentation and prioritization only — no business logic, routing, permissions, APIs, schema, security, or external AI.

---

## Purpose

Transform dashboards into intelligent operational command centers.

The M.P.A. Assistant proactively organizes each user’s workday using **existing** platform data so every home answers:

1. What changed?  
2. What is urgent?  
3. What needs my attention?  
4. What am I waiting on?  
5. What should I do next?

**Philosophy:** M.P.A. should never greet users with a blank dashboard. Every dashboard begins with a personalized operational briefing.

This is **embedded intelligence** (ADR-006): deterministic rules over already-composed signals — not a chatbot and not a new AI provider.

---

## Placement in Universal Dashboard Framework

```
1. Greeting
2. M.P.A. Assistant Card          ← Slice D (immediately below Greeting)
3. Waiting on Me                  ← Slice D
4. Waiting on Others              ← Slice D
5. Immediate Attention            ← Slice A (unchanged role)
6. Today’s Mission                ← Slice A
7. Recommended Actions + Quick Wins ← Slice D
8. Quick Actions                  ← Slice A
9. Operational Timeline           ← Slice D (replaces generic Recent Activity presentation)
10. Insights                      ← Slice A (below the fold)
```

Insights remain below the fold. Navigation remains shell chrome — never a dashboard section.

---

## 1. Universal Assistant Card

### Must display

| Block | Content |
|-------|---------|
| Intro | “Here’s your operational briefing.” (calm; never louder than Greeting) |
| **Today** | Role-scoped work counts with deep links (omit zero rows) |
| **Highest Priority** | Single plain-language item requiring action |
| **Recommended Next Action** | One deterministic next step with deep link |

### Example

```
Good Morning, Erick
Here’s your operational briefing.

Today
8 work orders assigned
2 lease renewals due
1 inspection overdue
3 vendor approvals pending

Highest Priority
Emergency plumbing repair at Oakwood Apartments requires assignment.

Recommended Next Action
Assign the emergency repair before reviewing lease renewals.
```

### Rules

| Rule | Binding |
|------|---------|
| Dynamic per role | Ops / Mission Control / portals map from their existing signals |
| Cap Today rows | 4–8 |
| Empty urgent work | Switch to positive empty (see §8) |
| Data source | Dashboard snapshot · Command Center home · Mission Control snapshot · existing OPS AI recommendations already on home composition |

---

## 2. Waiting on Me

Dedicated section — **not** the Notification Center dump.

| Examples |
|----------|
| Items requiring my approval |
| Items requiring my signature |
| Items requiring my assignment |
| Items requiring my response |

Each row: label · why · deep link. Cap ≈ 6; overflow → Inbox / My Work.

---

## 3. Waiting on Others

Dedicated section that removes uncertainty.

| Examples |
|----------|
| Vendor response |
| Resident signature |
| Owner approval |
| Payment confirmation |
| Inspection completion |

Each row: who/what we’re waiting on · context · deep link. Cap ≈ 6.

---

## 4. Smart Notifications

Notification Center presentation groups:

| Group | Meaning |
|-------|---------|
| **Critical** | Act now — safety, money failure, emergency ops |
| **Today** | Actionable within the current workday |
| **Later** | Informational / deferrable (collapsed by default after Critical/Today) |

Empty groups omitted. Mapping is design-only over existing `priority` + `category` + recency ([06](./06-notifications-priority-grouping.md)). No schema change.

---

## 5. Operational Timeline

Replace generic activity-feed presentation with **meaningful** events only.

| Include examples | Exclude |
|------------------|---------|
| Lease signed | Routine reads |
| Inspection completed | Heartbeats / low-value automations |
| Vendor accepted assignment | Noise without work-state change |
| Resident submitted maintenance request | |
| Invoice approved | |
| Document uploaded | |

Density ≈ 5–10 with “View all activity”. Omit section when empty/low value.

---

## 6. Recommended Actions

Deterministic rules from existing queues / attention / mission / OPS recommendations.

Examples: Review overdue work order · Send lease for signature · Approve invoice · Schedule inspection · Contact resident.

Surface the highest-value next actions (cap ≈ 5). Primary CTA deep-links to finish.

---

## 7. Cross-module context

When showing a primary task, attach related signals already available in the snapshot — presentation only.

**Example — Lease Renewal** also show when present:

- Outstanding maintenance  
- Pending balance  
- Unsigned documents  
- Upcoming inspection  

Users understand the full situation from one location without new APIs.

---

## 8. Quick Wins

Section for actions that take **less than two minutes**.

Examples: Approve invoice · Assign vendor · Send reminder · Archive document · Mark inspection complete.

Source: high-confidence short deep links already entitled. Cap ≈ 5. Encourage momentum — not a second Quick Actions inventing creates.

---

## 9. Positive empty states

When no urgent work exists:

```
You’re caught up.
No critical operational issues require attention today.

Suggested improvements:
· Review occupancy trends
· Archive completed work
· Check resident satisfaction
```

Never blank. Calm tone. One optional CTA group to Insights / Activity / role-fit calm work.

---

## 10. Mobile

| Rule | Binding |
|------|---------|
| Position | Immediately below Greeting |
| First visit | Expanded by default |
| Later visits | Collapsed by default; expandable |
| Targets | Thumb-friendly (≥ Canopy / UX-012) |
| Motion | Expand/collapse respects `prefers-reduced-motion` |

Preference key (client-only): `mpa.ux016.assistant.collapsedAfterVisit`.

---

## 11. Accessibility

| Requirement | Binding |
|-------------|---------|
| Headings | Assistant / Waiting / Timeline as labeled sections under Greeting `h1` |
| Keyboard | All expand/collapse and actions operable |
| Screen readers | Groups named; severity not color-only |
| Reduced motion | No essential info only in motion |
| WCAG | AA contrast for text and controls |

---

## 12. Performance

| Constraint | Binding |
|------------|---------|
| External AI | **None** |
| Data | Existing dashboard snapshot, activity, notification list, Command Center / Mission Control composition |
| Load | No material increase beyond acceptable production thresholds — pure view-model mapping on data already fetched for the home |

---

## Non-goals

- New priority engines or parallel queues  
- Chatbot UI  
- Schema/API changes for notification taxonomy  
- Changing AUTH homes or entitlement matrices  
- Marketing / acquisition surfaces  
