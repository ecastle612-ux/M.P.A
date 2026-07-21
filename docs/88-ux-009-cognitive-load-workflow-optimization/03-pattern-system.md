# 03 — Pattern System

**Package:** UX-009  
**Rule:** Reuse Canopy tokens and existing presentation/shell components. Prefer extending `components/presentation/*` and shell patterns over one-off layouts. Absorbs UX-006 Patterns A–G.  
**Binding:** Amendments A–J in [10-usability-amendments.md](./10-usability-amendments.md) — especially 80/20 (A), one glance (B), progressive disclosure (F), mobile first (G), adaptive slots (H), command first (E).

---

## P1 — Context-first page header (Priority 2)

Every major page opens with a single composition band:

1. **Title** (what)  
2. **Status** (state chip / health)  
3. **Primary actions** (1–2)  
4. **Critical information** (3–5 facts max)

Everything else is below. No competing hero widgets above this band.

## P2 — Entity action toolbelt (Priority 4)

Sticky or header-adjacent contextual action bar on entity detail:

| Entity | Default slots (permission-filtered) |
| --- | --- |
| Resident | Message · Collect Rent · Maintenance · Lease · **More** |
| Property | Add Unit · Add Resident · Inspection/WO · Report · **More** |
| Work Order | Assign Vendor · Complete · Timeline · Photos · **More** |
| Unit | Add/Move Resident · Maintenance · Lease · **More** |
| Applicant | Advance · Screening · Message · **More** |
| Vendor | Assign / Message · View WOs · **More** |
| Lease | Renew/status actions · Documents · Resident · **More** |

**More** holds existing secondary actions already on the page (never new product capabilities).

Desktop: toolbelt under header.  
Mobile: toolbelt sticky above safe-area (coordinate with UX-008 ＋ New — toolbelt is **entity-scoped**; ＋ New remains **global create**).

## P3 — Progressive disclosure / scroll reduction (Priorities 3, 10)

Default **collapsed** on mobile (and desktop when density is high):

- Full timeline / activity  
- Documents vault  
- Facility / repair history  
- QR / enrollment  
- Duplicate metrics already in header  
- Advanced / audit blocks  

Use accordions or “Show …” expanders. Target **≥40% reduction** in average mobile scroll height on audited detail pages where practical (measure before/after; document exceptions).

Also absorb UX-006: section nav chips on heavy detail pages; tighten vertical spacing without harming a11y hit targets.

## P4 — Adaptive dashboard (Priority 7)

Above the fold:

- Today’s priorities  
- Urgent work  
- Outstanding approvals  
- Overdue maintenance  
- Unread messages  

Secondary analytics, provider strips, and non-urgent widgets **below the fold** or behind “More insights”.

**Remove / relocate embedded AI page occupation** from dashboard body → floating assistant (see 04). Keep a compact “Needs attention” affordance if needed; no full AI sidebar in the main column.

## P5 — Empty states (Priority 8)

Every empty list/detail region must include:

1. Why empty (one sentence)  
2. What to do next (one sentence)  
3. Primary action (button → existing create/route)

No dead-end blank cards.

## P6 — Search-first destinations (Priority 6)

See [05-search-expansion.md](./05-search-expansion.md). Pages should not be the only way to reach entities when Search M.P.A. / ⌘K can jump.

## P7 — Loading without cognitive noise

Prefer inline skeletons inside the context-first header + list region. Avoid replacing the entire shell with a logo-only full-route flash when soft-navigating (align with EP-018 lesson; full fix may share work with paused EP-019).

## Anti-patterns (forbidden in this package)

- New cards purely for decoration  
- Equal-weight button rows of 8+ actions in the header  
- AI panels that push primary content down  
- Hiding a 90% action inside overflow without toolbelt placement  
- Inventing unread counts or backends when data is unavailable (same rule as UX-008)
