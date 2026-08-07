# Phase E.2 — Asset Workflow Verification

## WF-02 Asset intake & hierarchy

| Spec | Verification |
|------|----------------|
| Entry | Active site; single create path `/facility/assets?new=1` |
| States | `intake` → `active` → `in_repair` → `active` · or → `decommissioned` |
| Hierarchy | Optional `parent_asset_id` same site |
| Category / criticality | Categories seeded; criticality enforced |
| Location / manufacturer / model / serial / warranty | Captured on create/update |
| Site / property association | Site required; property via site link |
| Events / audit | `facility.asset.*` |
| Notifications | Critical decommission |
| Assistant | Status-aware recommendations |
| Exit | Active asset with category + criticality + site/location |

## WF-03 Building system register

| Spec | Verification |
|------|----------------|
| Entry | Active site; `/facility/building-systems` |
| States | `active` · `degraded` · `down` · `decommissioned` |
| MC | `system_down` attention when status = down |
| Notifications | System down |
| Asset links | M2M `facility_asset_systems` |
| Timeline / audit | `facility.system.*` |

## Result

| Workflow | Result |
|----------|--------|
| WF-02 | Pass / Fail |
| WF-03 | Pass / Fail |
