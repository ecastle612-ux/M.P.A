# 5. Visual Consistency Report

**Parent:** [Launch Stabilization](./index.md)  

---

## Token & type

| Element | Consistency |
|---------|-------------|
| Brand green `--mpa-color-brand-primary` | Consistent |
| Display / sans fonts | Consistent via ThemeProvider + globals |
| Dark mode | Disabled (`darkModeEnabled={false}`) — intentional |
| Radius / borders | Mostly `rounded-md` + Canopy borders |

## Patterns in use

| Pattern | Where consistent | Where divergent |
|---------|------------------|-----------------|
| Breadcrumbs → H1 → one-line support | PM directories, command centers | Some FO subsections denser |
| `EmptyState` | Docs, Comms, MCC, owner error | FO/owner sublists still `<p>` |
| `Skeleton` loading | Major CCs | Sparse route-level loading |
| Cards | Reduced on portal intro | Still common on directories (acceptable) |
| Tables | FO/admin raw HTML | Not `@mpa/ui` Table |

## Copy voice

| Anti-pattern | Status |
|--------------|--------|
| “Foundation / scaffold / shell foundation” | **Removed** from customer-facing chrome |
| “Document Vault” | **Removed** from owner drill-down honesty |
| “Planned” Facility labels | Keep |

## Remediated this pass

- App metadata title/description  
- Portal subtitles  
- Dashboard placeholder language  
- Portal shell structure (less card chrome)  
- Master Admin subtitle “Platform headquarters”  

## Remaining visual debt

| ID | Item | Priority |
|----|------|----------|
| V-01 | Unify FO/owner empty microcopy onto `EmptyState` | P2 |
| V-02 | Adopt `@mpa/ui` Table on FO desks | P3 |
| V-03 | Notification / profile popover focus trap | P2 |
| V-04 | Vendors page visual weight vs other PM modules | P2 |

---

## Verdict

Visual system is **Canopy-aligned and launch-ready**. Divergence is localized density/empty-state vocabulary, not brand chaos.
