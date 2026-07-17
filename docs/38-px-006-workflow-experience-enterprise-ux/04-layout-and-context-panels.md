# PX-006.04 — Layout Density & Context Panels

**Status:** Proposed  
**Priority:** P0 (fill empty space), P1 (context rails), P2 (responsive desktop)

---

## P0 — Fill empty desktop space

### Target

Desktop layouts should use **90–95%** of available workspace. No large blank white areas beside narrow forms.

### Layout pattern

Standard create/detail page grid:

```
┌─────────────────────────────┬──────────────────┐
│  Primary content (2fr)      │  Context (1fr)   │
│  Form / Detail hero         │  Checklist       │
│                             │  Tips            │
│                             │  Next steps      │
│                             │  Related items   │
└─────────────────────────────┴──────────────────┘
```

Use existing `lg:grid-cols-[2fr_1fr]` pattern from lease and maintenance detail pages.

### Create page context rails

| Page | Right rail content (existing data) |
|------|-------------------------------------|
| Create Property | Setup checklist, required fields summary, recent properties, property tips |
| Create Unit | Parent property summary, unit count, setup progress |
| Create Tenant | Vacant units list, setup progress |
| Create Lease | Tenant + unit summary, rent template hints |

All rail content derived from **existing API responses** — no new endpoints.

---

## P1 — Contextual side panels (detail pages)

Extend 2fr/1fr pattern to all core detail pages.

| Entity | Right rail sections |
|--------|---------------------|
| **Property** | Recent activity, occupancy, revenue summary, maintenance open count, upcoming inspections placeholder |
| **Unit** | Lease status, tenant link, maintenance history, vacancy state |
| **Tenant** | Lease status, balance/payments, maintenance, communications, upcoming tasks |
| **Vendor** | Assigned jobs, completion %, avg response, invoices, rating placeholder |
| **Lease** | Documents, renewal countdown, payments, activity timeline |

### Shared wrapper: `ContextRail`

```typescript
type ContextRailSection = {
  title: string;
  children: ReactNode;
};

type ContextRailProps = {
  sections: ContextRailSection[];
};
```

Migrate detail pages incrementally — start with property and unit (weakest today).

---

## P2 — Responsive desktop scaling

### Breakpoints

Support natural scaling at: **1280px, 1440px, 1600px, 1920px, ultra-wide**.

### CSS changes (presentation only)

- Differentiate `.mpa-page-wide` from `.mpa-page` in `globals.css` — wider max-width, adjusted padding
- Avoid centered narrow columns on create forms at 1440px+
- Dashboard KPI grids already multi-column — tune column counts per breakpoint

### Non-goals

- No density toggle (compact/comfortable) in PX-006 — defer if needed post-approval

---

## Dashboard density

Reference products: Linear, Monday, Notion, ClickUp, AppFolio.

**Current:** `operations-center-view.tsx` uses `space-y-8` with multiple sections — generally dense but onboarding empty state leaves whitespace.

**Required:**

- No large blank areas when org has partial data
- Fill lower viewport with domain cards, activity, or setup progress when KPIs are sparse
- Use existing snapshot data from `lib/dashboard/server.ts`
