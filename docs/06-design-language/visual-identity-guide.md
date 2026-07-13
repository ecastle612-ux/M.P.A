# Visual Identity Guide — Canopy

**Status:** Draft for approval  
**Purpose:** Define what makes M.P.A. recognizable without relying on a logo.

---

## Brand Character

M.P.A. looks like a **calm operations instrument** for property professionals — closer to a precision tool than a marketing website, closer to a control room than an analytics board.

| Trait | Visual expression |
|-------|-------------------|
| Confident | Ink sidebar, strong type hierarchy, one primary action |
| Calm | Mist canvas, muted wells, restrained motion |
| Professional | Plex body text, tabular finance, quiet borders |
| Trustworthy | Clear status language, sourced AI, no dark UI tricks |
| Efficient | Dense queues, keyboard paths, master-detail |
| Modern | Canopy accent, embedded AI chips, command palette |

**Emotional target:** Opening M.P.A. should feel like clearing a desk — not like opening a casino of widgets.

---

## Name of the System

**Canopy** — the visual language of M.P.A.

- **Ink** = structure, navigation, focus
- **Canopy green** = growth, property, primary action
- **Mist** = workspace calm

Do not rename tokens per feature. Features inherit Canopy; they do not invent skins.

---

## Recognizability Without a Logo

A screenshot should still read as M.P.A. if these are present together:

1. Dark ink navigation rail
2. Canopy green active state / primary button
3. Satoshi page title + Plex body
4. Operations Console split (queue | detail) — not a KPI card grid
5. Subtle borders instead of floating card stacks
6. Workflow Rail or AI Insight Chip in context

If any screenshot could be mistaken for Linear (purple), Stripe (purple blurple), or a Bootstrap admin theme, it fails the identity test.

---

## Layout Identity

### Desktop (PM)

```
┌────────┬──────────────────────────────────────────────┐
│  INK   │  TOP BAR (search · org · notifications · ⌘K) │
│  NAV   ├───────────────────┬──────────────────────────┤
│        │  ATTENTION QUEUE  │  DETAIL / WORK PLANE     │
│        │  (priority list)  │  (context + actions)     │
│        │                   │                          │
└────────┴───────────────────┴──────────────────────────┘
```

- No equal-weight widget dashboard on landing
- Charts live behind intentional navigation (Reports), never as home chrome

### Content Structure

| Pattern | Use |
|---------|-----|
| Full-bleed work plane | Console, tables, timelines |
| Section + divider | Forms and settings |
| Muted well | Nested groups, filters |
| Rare card | Discrete interactive offers (bids, plans) |

---

## Illustration Style

| Allowed | Forbidden |
|---------|-----------|
| Abstract architectural line motifs (thin, single-weight) | Stock “happy tenants” illustrations |
| Empty-state line icons in Canopy green / ink | 3D bloated heroes |
| Real property photography (when relevant) | Cartoon mascots |
| Subtle geometric patterns in marketing only | Confetti / celebration spam in product |

**Product empty states prefer typography + one action**, not large illustrations.

---

## Icon Style

- Stroke icons (Lucide), optical size 16–20px in chrome
- Corner radius of icon containers matches `radius.sm`
- Active nav icons use sidebar accent; inactive use muted sidebar text
- Never mix filled cute icons with stroke sets in the same toolbar

---

## Photography & Media

When property images appear:

- Full-bleed only in intentional media contexts (property gallery)
- Rounded with `radius.md`, not floating polaroids
- Never overlay detached promo badges on photos inside the app shell

---

## Voice in UI Copy (Visual Partner)

Design and words share identity:

| Tone | Example |
|------|---------|
| Direct | “3 work orders need assignment” |
| Calm | “Rent overdue — send reminder” |
| Specific | “Vendor insurance expired Mar 12” |

Avoid: “Oops!”, “Welcome back!!!”, empty enthusiasm.

---

## Marketing vs Product

| Surface | Freedom |
|---------|---------|
| Marketing site | More expressive motion/photography; still Canopy colors/type |
| Product app | Strict tokens; zero decorative gradients on chrome |

Marketing may use a fuller hero treatment. The **authenticated product must never** look like a landing page.

---

## Competitive Differentiation

| Generic SaaS | M.P.A. Canopy |
|--------------|---------------|
| Blue primary | Canopy green |
| Inter everywhere | Satoshi + Plex |
| Card grid dashboard | Operations Console |
| Purple AI glow | Soft green AI tint + labels |
| Pill buttons | `radius.md` buttons |
| Heavy shadows | Borders first |
| Chart-first home | Attention-first home |

---

## Dark Mode Identity

If/when dark mode ships for product:

- Surfaces stay near-ink, not pure black voids with neon
- Canopy accent brightens slightly (`#1FA87A`) for contrast
- Do not invent a second personality for dark mode

---

## The Daily Enjoyment Standard

Design passes only if a property manager can say:

> “I can see what matters, act quickly, and the software stays out of my way.”

Beauty without speed is decoration. Speed without calm is stress. Canopy requires both.

---

## Related Documents

- [Design Token System](./design-token-system.md)
- [Operations Console](./operations-console.md)
- [Role Experiences](./role-experiences.md)
- [Improvements Before Implementation](./improvements-before-implementation.md)
