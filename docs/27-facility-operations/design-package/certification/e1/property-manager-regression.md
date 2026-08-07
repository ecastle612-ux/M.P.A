# Phase E.1 — Property Manager Regression Verification

**Constraint:** Property Manager remains under feature freeze. Customer #1 production path protected.

## Changes touching PM surfaces

| Change | Risk | Mitigation |
|--------|------|------------|
| Property Command Center optional `facilitySite` link | Low | Additive; only renders when a site is linked |
| Global search / command palette fetch facility sites | Low | Non-OK FO responses ignored; PM search unchanged |
| Guided Setup SKU-aware copy | Low | PM-only path keeps property-first wording and `/pm/mission-control` home |

## Regression checks

| Check | Result |
|-------|--------|
| PM Mission Control still loads for PM SKU | ☐ |
| Property create / Command Center J1 path intact | ☐ |
| Facility routes denied for PM-only SKU | ☐ |
| No Assets/Inventory/etc. FO features shipped | ☐ |
| CI green on shared + web packages | ☐ |

## Verdict

PM regression: Pass / Fail — _record at cert time_
