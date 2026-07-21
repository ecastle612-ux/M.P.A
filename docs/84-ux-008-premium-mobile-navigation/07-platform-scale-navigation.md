# UX-008 — Platform-Scale Navigation Requirements

**Status:** Approved amendment to UX-008 (2026-07-20)  
**Design rule:** Do not optimize navigation only for today’s module count. Optimize for 40–60 modules over 3–5 years (accounting, leasing, inspections, AI, vendors, owners, residents, analytics, compliance, communications, and more).

---

## 1) Search-first navigation

**Placement:** Top of the mobile drawer, below the brand lockup (or inline with collapsed brand).

**Control:**

```
Search M.P.A.
```

**Behavior:**

- Instant client-side filter over a navigation search index (labels, synonyms, route titles).
- Typing `resident`, `lease`, `inspection`, `work order`, `payment` jumps to matching screens when those destinations exist and are permitted.
- Results show within the drawer; selecting a result navigates and closes the drawer.
- Index is extensible: every future module registers searchable aliases without redesigning the drawer chrome.

**v1 source of truth:** Shared shell navigation metadata + synonym map. Prefer reuse of Command Center providers/registry where already available so mobile search and desktop ⌘K stay aligned over time.

**Non-goal for v1:** Full-text entity search across the database (that remains Command Center / future AI). Drawer search is **destination + synonym** jump navigation first; entity hits may appear when Command Center already returns them without new APIs.

---

## 2) Favorites

**Section:** `Favorites` near the top (after search / pin essentials).

**Behavior:**

- Managers pin/unpin destinations they use most.
- Persistence: client storage keyed by user id when available (`localStorage`), no schema change.
- Empty state: short hint — “Pin pages you use every day.”
- Favorites respect permissions (hidden if capability lost).

**Examples:** Work Orders, Properties, Applicants, Vendor Jobs — only if those routes exist in the nav index.

---

## 3) Recently visited

**Section:** `Recent`

**Behavior:**

- Show last N distinct destinations/entities the user opened (from existing Command Center tracker / local history when present).
- One tap resumes context (Apartment 204, Work Order #421, person, property).
- Omit duplicates of the current page; cap list (e.g. 5–8).
- No new backend tables for v1.

---

## 4) Company switcher

**Placement:** Reserved in the **drawer header band** (below brand or beside collapsed brand).

**Pattern:**

```
Acme Property Management ▼
```

**Rules:**

- Always reserve the control, even when only one organization exists.
- Reuse existing `OrganizationSwitcher` behavior/data; do not redesign later under a different pattern.
- Compact, premium, ≥44px target.

---

## 5) Notification badges

Unread / waiting counts on high-signal destinations when data is already available to the shell:

| Destination | Badge meaning |
| --- | --- |
| Messages / Inbox | Unread messages (existing messaging/notification counts if available) |
| Maintenance | Open / assigned work waiting (existing counts if available) |
| Approvals | Pending approvals when a count source exists; omit badge if none |
| Leases | Attention items when a count source exists; omit badge if none |

**Display:** Trailing count, e.g. `Maintenance    7`.

**Rules:**

- Never invent fake counts.
- If no reliable count is available without a new API, omit the badge (do not show `0` noise) unless product already treats zero as meaningful.
- Prefer existing notification/dashboard summary endpoints already used by the shell.

---

## 6) Floating quick actions (OS-style)

Replace plain sticky text links with a **＋ New** operating-system control:

```
＋ New
  → Property
  → Resident
  → Work Order
  → Announcement
```

**Behavior:**

- Sticky footer (or floating within drawer footer safe area).
- Opens a compact action sheet / menu (command-palette feel).
- Items permission-filtered to existing create routes:
  - Property → `/properties/new`
  - Resident → `/tenants/new`
  - Work Order → `/maintenance/new`
  - Announcement → existing communications create route (e.g. `/communications/new`)
- Feels like modern OS create, not a row of equal secondary buttons.

---

## 7) Operations Score (header health)

**Intent:** Drawer header becomes the company’s operational health glance.

**Target composition (when data exists):**

```
Operations Score
96%
4 Urgent · 18 Open Work Orders · 99.2% Occupancy
```

**v1 rule:**

- Reserve a **header health slot** in the layout.
- Populate from existing dashboard/ops summary data if already fetchable without new APIs.
- If data is incomplete, show a restrained placeholder state (label + “Health snapshot coming online”) — do not block UX-008 on a new scoring backend.
- Future modules feed the same slot; do not invent a one-off header redesign later.

---

## 8) Collapsible brand header

| State | Content |
| --- | --- |
| Expanded (drawer open, scroll top) | Mark + “M.P.A.” + “My Property Assistant” + “Property Operations OS” (centered, premium) |
| Collapsed (user scrolls drawer body) | Compact row: mark + “M.P.A.” |

Smooth, reduced-motion safe. Saves space without losing brand.

---

## 9) Universal command palette (desktop)

**Reserve and keep:** `⌘K` / `Ctrl+K` as the universal productivity entry.

- Existing `CommandCenter` remains the desktop implementation surface.
- UX-008 must not remove or regress the shortcut.
- Long-term queries (“Add tenant”, “Open Unit 104”, “John Smith”) continue to expand via Command Center providers — not via drawer-only search.
- Mobile search and desktop palette should share index/provider direction over time.

---

## 10) Design rule (binding)

> Navigation is a **platform chassis**, not a feature list for the current sprint.

Implications:

- Sections, search aliases, favorites, recent, badges, and health slot must accept new modules without IA rewrites.
- Prefer metadata-driven nav registration over hard-coded one-off drawers.
- Avoid patterns that only work for <15 destinations.
- Prefer progressive disclosure (search + favorites + recent + accordion) over an ever-longer flat list.
