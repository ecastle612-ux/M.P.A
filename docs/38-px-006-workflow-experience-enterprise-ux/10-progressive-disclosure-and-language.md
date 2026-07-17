# PX-006.10 — Progressive Disclosure & Human Language

**Status:** Approved  
**Priority:** P1

---

## P1 — Progressive disclosure

Do not overwhelm new users. Show advanced tools only when they become relevant.

### Rules

| Condition | Show | Hide |
|-----------|------|------|
| Zero vendors | "Create your first vendor" CTA | Vendor analytics, performance charts |
| Zero leases | Lease setup guidance | Renewal analytics, rent roll summaries |
| Zero financial records | "Record your first payment" guidance | Revenue dashboards, owner statement tools |
| Partial portfolio | Setup health + next step | Full domain analytics for empty modules |

### Implementation

- Wrap advanced dashboard sections in `usePortfolioMaturity()` checks (derived from existing snapshot counts)
- Detail page rails show placeholder guidance until prerequisite data exists
- No feature flags or permissions changes — presentation gating only

---

## P1 — Human language

Replace technical and database-oriented messaging with property-manager language.

### Forbidden patterns

| Never show | Show instead |
|------------|--------------|
| "No data available" | "You're almost ready." |
| "No records found" | "Let's create your first property." |
| "Empty result set" | "Nothing here yet — here's how to get started." |
| Internal IDs in UI copy | Display names only |
| API error codes | Plain-language recovery steps |

### Copy principles

1. **Action-oriented** — tell the user what to do
2. **Encouraging** — "You're almost ready" not "Failed"
3. **Domain language** — property, tenant, lease — not entity, record, row
4. **Time estimates** where helpful — "About 30 seconds"

### Audit scope

All `EmptyState`, `Card`, toast, banner, and table zero-state copy across `apps/web/src/components/**`.

---

## Acceptance

- [ ] Advanced analytics hidden until prerequisite entities exist
- [ ] No "No data available" strings remain in user-facing copy
- [ ] All empty states use human, action-oriented language
- [ ] Internal terminology audit complete before PX-006 closeout
