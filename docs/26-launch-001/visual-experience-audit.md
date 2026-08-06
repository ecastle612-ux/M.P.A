# LAUNCH-001 — Visual Experience Audit

**Status:** Draft — recommendations only (**do not implement** under this doc)  
**Scope:** Authenticated experiences on product candidate (`release/rc1`) + shell patterns on identity baseline  
**Standards:** Canopy (06) · UX Principles (07) · Experience Architecture (21) · STD-001 / UDF

---

## 1. Summary

The product candidate has a real Canopy shell and many production-shaped surfaces. Launch risk is less “no UI” and more **density, duplication, and beta residue** that make the product feel like an internal tool during the first week.

| Theme | Severity | Launch class |
|-------|----------|--------------|
| Duplicate homes (Command Center / Inbox / portal manager / dashboards) | High | Fix only if blocks LB-22; else Known Limitations + IA note |
| Facility breadth in nav for first customers | High | 🔵 Freeze expansion; consider module entitlement default off for #1 |
| Missing Privacy/Terms | High | 🔴 LB-11/12 |
| Placeholder notifications on older baseline | Medium | 🔴 LB-07 on prod candidate |
| Empty/loading inconsistency across modules | Medium | B (ST-04) |
| Marketing/acquire vs in-app visual continuity | Medium | B if sales path suffers |
| Internal-tool feel (flags, migration, AI ops visible early) | Medium | Hide/entitlement for Customer #1 cohort |

---

## 2. Findings by theme

### Confusing navigation

- PM shell groups: Portfolio, Maintenance, Leasing, Accounting, Communications, Intelligence, Workspace, Master Admin — **too many first-week choices**.
- Parallel nouns: **Tenants** vs **Residents** vs **Move in/out/transfer/bulk**.
- **Manager Portal** (`/portal/manager`) vs **Command Center** (`/dashboard`) — two “homes.”
- Facility sibling routes (inventory, PM, inspections, calendar, reports) compete with Maintenance for attention.

**Recommend (design only):** Default Customer #1 nav to Command Center + Properties + Leases + Maintenance + Financials + Communications + Settings. Facility behind entitlement or “Advanced.” Single home: Command Center.

### Duplicate pages / dashboards

- Command Center, Ops Inbox, Communications inbox, Notification Center, Master Admin dashboards.
- Owner financials vs PM owner-statements.
- Facility reports vs Financial reports vs AI operations.

**Recommend:** One attention system (Command Center + Ops Inbox). Reports stay under one Reports entry later (🔵). No new dashboard widgets during LAUNCH-001.

### Duplicate workflows

- Create resident/tenant from multiple entry points.
- Maintenance request from tenant portal vs PM create vs Facility inspection finding → WO (OK if event-driven; confusing if three UIs feel primary).
- Document upload in settings vs lease vs property.

**Recommend:** Publish “canonical create path” per object in Known Limitations / in-app empty states (B: ST-06).

### Inconsistent layouts

- UDF/STD-001 remount improved Facility presentation; other modules vary in table vs canvas density.
- Portal shells (owner/tenant) cleaner than PM ops density — expected, but PM needs calm hierarchy (06 Operations Console).

**Recommend:** Visual hierarchy pass on Command Center + Maintenance + Financials only (B) — not a design-system rewrite.

### Missing empty / loading states

- rc1 has shared empty-state components; coverage uneven across newer routes.
- Identity baseline still uses skeleton/placeholder copy in places.

**Recommend:** ST-04 — critical paths only (setup, properties, leases, WO, rent, inbox).

### Poor visual hierarchy

- Intelligence / AI Operations / Migration / Facility Reports can outrank today’s WO/rent pain.
- Financials subnav depth risks chart-first anti-pattern (07 Action Before Analytics).

**Recommend:** Pin attention: overdue rent, open WOs, signatures waiting, team invites — not analytics.

### Internal-tool feel

- Design-partner chrome / beta version strings acceptable if intentional.
- Master Admin and Migration visible to wrong personas = unfinished feel.
- Dev/cert routes must never appear for Customer #1 users.

**Recommend:** Entitlement + role filters audit (LB-18).

---

## 3. Role-surface notes

| Surface | Verdict |
|---------|---------|
| PM Ops (`/(app)/*`) | Powerful; over-broad for week one |
| Tenant portal | Strong consumer chrome; keep focused |
| Owner portal | Adequate MVP; avoid new cards |
| Vendor token | Minimal — good |
| Setup / acquire | Must feel commercial, not lab |
| Master Admin | Internal OK |

---

## 4. Implementation rule

These recommendations become work items **only** when:

1. They map to a 🔴 Launch Blocker, or  
2. Role journey dry-run (LB-22) **FAILS** on UX grounds, or  
3. Promoted from B with explicit capacity after 🔴 trend improves  

Do **not** open a visual redesign initiative during LAUNCH-001.
