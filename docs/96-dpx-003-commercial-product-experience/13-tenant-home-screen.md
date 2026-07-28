# 13 — Tenant Home Screen (Design Spec)

**Package:** DPX-003 · Workstream 3 extension  
**Status:** ✅ **Implement authorized** — Commercial Freeze Exception (UI composition only)  
**Authorized:** 2026-07-23  
**Parent:** [04 — Tenant Experience](./04-tenant-experience.md) · [DPX-003 README](./README.md)  
**Freeze:** [Development Freeze Checkpoint](../00-governance/development-freeze-checkpoint.md)  
**Gate:** [Implementation Gate](../00-governance/implementation-gate.md)

> **Commercial Freeze Exception (Product):** DPX-003 tenant home UI composition only.  
> **Not authorized:** FIN-003 · schema · APIs · Stripe · RBAC · new business logic.  
> Reuse existing announcement, notification, messaging, maintenance, payment, and document services only.  
> Does **not** unlock FIN-003 Phase A.

---

## Objective

Make `/portal/tenant` a true **home screen**: personal, welcoming, action-oriented. Navigation is secondary. The first screen answers:

> **What does this tenant need to know today?**

Aligns with DPX-003 principle: **communication-first** (management contact → rent → maintenance).

---

## Current baseline (do not regress)

| Item | Today |
|------|--------|
| Component | `apps/web/src/components/portal/tenant-portal-home.tsx` |
| Pattern | Welcome + link grids (comms → account → more) |
| Page | `apps/web/src/app/(portals)/portal/tenant/page.tsx` |
| Nav | `TENANT_NAV` in `navigation.ts` (full module list) |

Existing routes and permissions stay. Home **composition** changes; modules remain reachable.

---

## Proposed layout (visual hierarchy)

```
1. Greeting + context
2. Primary card — Announcements & Notifications (merged attention feed)
3. Quick actions (≤ 6)
4. Today (contentful cards only)
5. Navigation (reduced visual weight — shell secondary)
```

### 1. Top — Greeting

| Element | Source (reuse only) |
|---------|---------------------|
| Time-based greeting | Client/local time → Good Morning / Afternoon / Evening + first name |
| Property name | Existing resident/lease/property reads used by tenant portal |
| Unit number | Same |
| Current date | Locale date string |
| Weather | **Placeholder only** — no API; omit or “Weather coming soon” copy |

### 2. Primary card — Announcements & Notifications

Merge into one attention feed (not three equal link tiles):

| Source system | Reuse |
|---------------|--------|
| Announcements | Existing announcement list/read services used by `/portal/tenant/announcements` |
| Notifications | Existing notification surfaces for tenant |
| Unread messages | Existing messaging inbox counts/previews |
| Lease reminders / maintenance updates | Derive from existing notification + maintenance list reads if already available to the page |

**Sort:** Critical → Unread → Everything else.

**Package notifications:** Future only — slot in sort order when product ships them; no new API now.

Hide empty feed with calm empty state (link to announcements still OK).

### 3. Quick actions (≤ 6)

Large touch-friendly buttons (not dense module grid):

| Action | Route (existing) |
|--------|------------------|
| Submit Maintenance Request | `/portal/tenant/maintenance/new` |
| Messages | `/portal/tenant/messages` |
| Pay Rent | `/portal/tenant/payments` |
| Documents | `/portal/tenant/documents` |
| Lease | Documents or lease-focused existing path (no new route) |
| Emergency Contact | Prefer existing community/preferences/org contact surface — **confirm target at unlock** |

Omit actions the resident cannot use (unlinked tenant) — same gating as today.

### 4. Today section

Show **only** cards with content:

- Upcoming inspections (if data exists today)  
- Rent due  
- Open maintenance  
- Recent messages  
- Lease renewal / move-out reminders (if signaled by existing data)

**Hide** empty cards. No fake placeholders.

### 5. Navigation

| Change | Intent |
|--------|--------|
| Reduce visual weight of shell nav on home | Support, don’t dominate |
| Avoid long module list as the hero | Home content is hero |
| Keep all existing `TENANT_NAV` destinations reachable | No functionality removal |

Exact shell treatment at unlock: quieter active styles / collapse secondary items into “More” on mobile if already patterned elsewhere — **no new nav IA inventing modules**.

---

## Mobile

- Greeting in first viewport  
- Primary attention card visible without deep scroll  
- Quick actions in thumb zone (lower mid-screen)  
- One-handed friendly targets (Canopy / UX-006 sizing)

---

## Explicit non-goals

| Forbidden |
|-----------|
| New backend services / APIs |
| Permission model changes |
| Removing announcements, notifications, messages, rent, maintenance, documents routes |
| Weather provider integration |
| Package notification product (future) |
| Violating development freeze without explicit exception |

---

## Services to reuse (implement later)

| Domain | Approach |
|--------|----------|
| Session / resident name | Existing tenant page loader props |
| Property / unit | Existing tenant linkage reads |
| Announcements | Existing announcement server modules |
| Notifications | Existing notification list/preferences stack |
| Messages | Existing messaging server |
| Rent | Existing payments/billing reads already used on payments page |
| Maintenance | Existing work-order list for tenant |
| Documents / lease | Existing vault/document tenant views |

Compose on the **server page** or thin loaders already used by child routes — **no new API routes**.

---

## Unlock checklist (before code)

| # | Gate |
|---|------|
| 1 | Development freeze lifted **or** written freeze exception for DPX-003 tenant home polish |
| 2 | Product sign-off on this spec (below) |
| 3 | Confirm Emergency Contact href |
| 4 | Confirm Lease quick-action target (documents vs dedicated) |
| 5 | Implement only UI composition; cite DPX-003 + this doc in PR |

---

## Sign-off (at unlock)

| Role | Name | Date | Decision |
|------|------|------|----------|
| Product | | | Approve home-screen spec / Amend / Defer |
| Lead Architect | | | Confirm reuse-only / Reject if APIs needed |

---

## Follow-up recommendations (post-implement)

1. Wire real weather only via a future approved integration package.  
2. Package delivery notifications when that product exists.  
3. Unify attention feed ranking rules with push (PUSH-001) so home and push don’t disagree.  
4. Consider bottom-nav “Home” emphasis for tenant (pattern from owner portal) — separate Approve if new chassis.  
5. A11y pass: greeting + feed heading order, focus after dismiss.
