# 04 — Layout System

**Package:** UX-012  
**Status:** Draft — Awaiting Approval

---

## Regions (product shell)

```
┌─────────────────────────────────────────────┐
│ Top bar (context, search, AI, account)      │
├──────────┬──────────────────────────────────┤
│ Nav      │ Main                             │
│ (role)   │  Page header                     │
│          │  Primary content                 │
│          │  Optional aside / AI panel       │
├──────────┴──────────────────────────────────┤
│ Mobile: bottom nav / sheets                 │
└─────────────────────────────────────────────┘
```

Portal shells (PM / Owner / Tenant / Vendor / Tech) share regions; content density and nav items differ by role ([08](./08-role-based-experiences.md)).

---

## Page anatomy

| Zone | Content |
|------|---------|
| **Header** | Title (H1), optional subtitle, primary CTA, secondary actions |
| **Context bar** | Property/org switcher crumbs when nested |
| **Body** | One primary composition |
| **Aside** | AI / help / summary — collapsible |
| **Footer** | Rare in app; prefer sticky action bars on mobile |

---

## Density modes

| Mode | Use |
|------|-----|
| **Comfortable** | Tenant / Owner marketing-calm surfaces |
| **Compact** | PM ops tables, Master Admin |
| **Touch** | Technician / Vendor mobile field |

Density is role-defaulted; not a user theme chaos switch in MVP.

---

## Breakpoints (design)

| Name | Min width | Behavior |
|------|-----------|----------|
| Mobile | 0 | Single column; bottom nav |
| Tablet | ~768 | Optional rail; sheets |
| Desktop | ~1024 | Side nav + main + optional aside |
| Wide | ~1440 | Max content measure; avoid endless stretch |

Exact px align to existing Tailwind/Canopy breakpoints at Implement.

---

## Command Center layout

See [09](./09-command-center-ux.md) — priority column + feed + AI/insights — one composition, not a widget junkyard.

---

## Acceptance

| ID | Criterion |
|----|-----------|
| LY-01 | Shared shell regions across portals |
| LY-02 | Page anatomy standardized |
| LY-03 | Density role-defaulted |
| LY-04 | Breakpoints defined |
