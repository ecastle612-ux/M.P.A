# Subscription Certification

**Parent:** [Commercial Experience Certification](./index.md)

Certifies Property Manager, Facility Operations, and Complete Platform subscriber experiences against the Phase 1 alignment surfaces.

Legend: **Pass** · **Conditional** · **Fail**

---

## Shared commercial logic (all SKUs)

| Check | Result | Evidence |
|-------|--------|----------|
| Three SKUs only | Pass | `PRODUCT_SKUS` |
| Entitlements derived from SKU | Pass | `entitlementsForSku` + tests |
| PM does not receive Facility entitlements | Pass | Unit test |
| Facility does not receive PM leasing/etc. | Pass | Unit test |
| Complete = union | Pass | Unit test |
| Org stores subscription | Pass | `organization_subscriptions` |
| Plan badge shows SKU label | Pass | `PlanBadge` |
| Billing lists three offerings + current plan | Pass | `/billing` |
| Upgrade cues for single-product SKUs | Pass | `upgradeCuesForSku` |
| Route/API entitlement enforcement | **Fail** | No middleware/page guard on `/pm/*` or `/facility/*` |
| Customer cannot self-upgrade by changing SKU | **Fail** | Guided Setup / settings allow PUT any SKU |

---

## 1. Property Manager subscriber

### Expected chrome

- Sidebar: Home · Property Manager · Shared Platform  
- No Facility Operations group  
- Default home: `/pm/mission-control` (via `/dashboard` redirect)

### Surface matrix

| Surface | Result | Notes |
|---------|--------|-------|
| Guided Setup | Conditional | Can select PM; checklist auto-marks steps without visiting Billing/home |
| Navigation / Sidebar | Pass | PM modules shown; Facility hidden |
| Workspace Launcher | Pass | PM Mission Control / Leasing / Maintenance; no Facility workspaces |
| Search (header) | Fail | Placeholder input; not entitlement-aware; does nothing |
| Quick Actions (⌘K) | Conditional | Entitlement-filtered nav + Setup/Billing/Launcher only |
| Billing | Pass | Current = Property Manager; Complete cues list Facility modules |
| Entitlements | Pass (model) / Fail (enforcement) | Model correct; deep link to `/facility/assets` still renders |
| Empty states | Fail | Module pages are architecture shells, not “first record” empty states |
| Upgrade prompts | Pass | Billing section “Requires Complete Platform” |
| Hidden capabilities | Conditional | Hidden in nav/launcher/⌘K; **not** hidden by URL |
| Feature gating | Fail | Planned FO page still reachable; Facility URLs reachable |

### Customer clarity (PM)

| Question | Certified? |
|----------|------------|
| What they purchased | Yes — badge + Billing |
| What they can do | Partial — sees module list; almost no real work yet |
| What requires another subscription | Yes — Billing upgrade cues |

**SKU verdict: Conditional Pass for chrome clarity; Fail for gating.**

---

## 2. Facility Operations subscriber

### Expected chrome

- Sidebar: Home · Facility Operations · Shared Platform  
- No Property Manager group  
- Default home: `/facility/mission-control`

### Surface matrix

| Surface | Result | Notes |
|---------|--------|-------|
| Guided Setup | Conditional | Same auto-complete / self-assign issues |
| Navigation / Sidebar | Pass | Facility group present; PM group absent |
| Workspace Launcher | Pass | Facility Mission Control + Planned Asset Registry |
| Search | Fail | Same non-functional header search |
| Quick Actions | Conditional | ⌘K filters to Facility-entitled routes |
| Billing | Pass | Current = Facility; cues list PM modules for Complete |
| Entitlements | Pass (model) / Fail (enforcement) | Deep link `/pm/leasing` still renders |
| Empty states | Fail | Planned shells dominate |
| Upgrade prompts | Pass | Billing cues for PM capabilities |
| Hidden capabilities | Conditional | Nav hides PM; URLs do not |
| Feature gating | Fail | No server-side SKU gate |
| Capital Projects in nav | Conditional | Shown as Planned without entitlement (intentional awareness) — can confuse “included now” |

### Customer clarity (Facility)

| Question | Certified? |
|----------|------------|
| What they purchased | Yes |
| What they can do | Weak — nearly all Facility modules Planned |
| What requires another subscription | Yes on Billing |

**SKU verdict: Conditional Pass for product identity; Fail for gating and actionable work clarity.**

---

## 3. Complete Platform subscriber

### Expected chrome

- Both product groups in sidebar  
- Launcher default home (`/launcher`)  
- No duplicate module trees (single href per module)

### Surface matrix

| Surface | Result | Notes |
|---------|--------|-------|
| Guided Setup | Conditional | Same journey gaps; labels Complete correctly |
| Navigation / Sidebar | Pass | Both groups; Shared once |
| Workspace Launcher | Pass | Grouped PM + Facility + Shared |
| Search | Fail | Non-functional |
| Quick Actions | Conditional | Union of both catalogs in ⌘K |
| Billing | Pass | Current = Complete; Capital Projects called out as future |
| Entitlements | Pass (model) | Union correct |
| Empty states | Fail | Dual product shells still “alignment” pages |
| Upgrade prompts | Pass | Future Capital Projects note |
| Hidden capabilities | Pass (N/A) | Both products entitled |
| Feature gating | Conditional | No cross-SKU issue; Planned still open |
| Duplicate Mission Control labels | Conditional | Two “Mission Control” items under different groups — readable in sidebar, easy to confuse in ⌘K |

### Customer clarity (Complete)

| Question | Certified? |
|----------|------------|
| What they purchased | Yes — both products |
| What they can do | Partial — structure clear; work not real |
| What requires another subscription | N/A / future modules only |

**SKU verdict: Conditional Pass for composition; Fail for search/empty states/gating hardening.**

---

## Cross-subscription failure summary

1. **Deep-link bypass** — highest severity commercial defect  
2. **Self-serve SKU mutation** — treats purchase as a dropdown  
3. **Search not implemented** — fails certification checklist item  
4. **Empty states not customer-grade**  
5. **Guided Setup does not force commercial comprehension steps**
