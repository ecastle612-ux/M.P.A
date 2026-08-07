# 3. Workflow Friction Report

**Parent:** [Launch Stabilization](./index.md)  
**Method:** Walk advertised daily work per role against current routes  

---

## Master Admin

| Task | Friction | Severity | Disposition |
|------|----------|----------|-------------|
| Reach Launch Readiness | Clear `/admin/launch-readiness` | — | OK |
| Verify J0–J8 | Panels complete | Procedural Pass still human | P1 procedural (DEF-003) |
| Operate on mobile | Sidebar was desktop-only | High for field ops | **Fixed** mobile Menu |
| Exit to customer app | Present | — | OK |
| Impersonation / matrix | Present under Testing | — | OK |

## Organization Admin / Property Manager

| Task | Friction | Severity | Disposition |
|------|----------|----------|-------------|
| Setup → Mission Control | Clear | — | OK |
| Add property → PCC | Clear | — | OK |
| Invite team | Was buried under Org panel / journey CTA only | Medium | **Fixed** — Team in nav |
| Add resident → lease → activate | Clear; portal provisioned | — | OK |
| Collect rent (FO) | Dense but operable | Low | P2 empty-state unify |
| Maintenance assign vendor | Requires vendor email | Low (honest) | Documented |
| Documents / Communications | Clear shared nav | — | OK |

## Leasing Agent

| Task | Friction | Notes |
|------|----------|-------|
| Land on Leasing | `defaultHomeForRole` → `/pm/leasing` | OK |
| Broader money/FO | May lack entitlement/habit | Role-correct; not a bug |

## Maintenance Technician

| Task | Friction | Notes |
|------|----------|-------|
| Home `/pm/maintenance` | OK | |
| Complete WO | MCC path | OK |

## Resident

| Task | Friction | Disposition |
|------|----------|-------------|
| Reach portal after activation | Was P0; remediated prior | OK |
| Billing / maintenance / documents | Clear nav | OK |
| First login if invite email missing | Config-dependent (Auth SMTP) | INT honesty |

## Vendor

| Task | Friction | Disposition |
|------|----------|-------------|
| Reach portal after assign | Was P0; remediated | OK |
| Thin workspace | By design | OK if assignment-driven |

## Owner

| Task | Friction | Disposition |
|------|----------|-------------|
| Portfolio → drill-down | Clear | OK |
| Document Vault copy | Confusion | **Fixed** |
| Financials | Present | OK |

## Dead ends / hesitation points

| Finding | Role | Fix |
|---------|------|-----|
| `/unauthorized` recovery weak | All | Stronger primary “Go to your workspace” |
| `/pm/vendors` honesty redirect | PM | P2 — clarify “manage vendors from Maintenance” |
| Launcher vs Mission Control duality | New users | Acceptable; Setup + MC next-action mitigate |
| `/dashboard` redirect-only | All | OK; placeholder copy cleaned if reached |

## Verdict

No Customer #1 **workflow blockers** remain in product code. Friction left is clarity/density polish and staging MA Pass recording.
