# 152 — FIN-OPS Production Reconciliation M2D — Owner Unit Map

**Title:** FIN-OPS PRODUCTION RECONCILIATION — M2D OWNER UNIT MAP  
**Status:** **BLOCKED — OWNER CHOICE REQUIRED**  
**Date:** 2026-08-16  
**Program:** Financial Operations Production lineage cutover — Development identity-only unit map  
**Authority:** Owner decision to proceed with identity-only repair under [docs/151](../151-fin-ops-production-reconciliation-m2d-development-identity-repair/index.md) · [docs/140](../140-fin-ops-production-reconciliation-remediation/index.md) **Approved** · [ADR-034](../18-decision-log/adr-034-fin-ops-production-lineage-cutover.md) **Accepted** · [docs/146](../146-fin-ops-production-reconciliation-m2-compatibility-amendment/index.md) **Approved** · [ADR-035](../18-decision-log/adr-035-fin-ops-m2-identity-and-per-org-backfill.md) **Accepted** · [docs/150](../150-fin-ops-production-reconciliation-m2-controlled-backfill-certification/index.md)  
**Target:** `mpa-prod` / `vahnmcrpnuggxkivynvo`  
**This package:** Design of the Owner unit map only. **No July mutation. No unit creation. No Cameron Option B materialization. No Development M2 execute. No Canopy/PMX change. No M3–M5. No deploy.**

---

## Verdict

**BLOCKED — OWNER CHOICE REQUIRED**

Owner confirmed:

- these are synthetic Development seed/demo identities
- the crossed field is `unit_id`
- authoritative property is charge = lease = tenant
- repair is identity-only (`unit_id` on July charge / lease / tenant / payment)
- do not guess from unit number alone
- do not change `property_id`, organization, or money

That decision is sufficient to **exclude** wrong-property units and to **name collision-free candidate pools**. It is not sufficient to name one replacement UUID per resident.

Production cannot distinguish the leftover same-property units without an Owner pick. This record does not arbitrarily choose.

Cameron Lopez remains **OPTION_B_PROVEN** and is not in the eight. That unit was not created.

---

## What this package did not do

- Did not update July rows
- Did not create units or Cameron’s Option B row
- Did not call `finance_m2_run(false)`
- Did not modify Canopy or PMX
- Did not freeze July or implement M3 / M4 / M5
- Did not deploy
- Did not change `property_id` or money
- Did not create a new ADR

---

## 1. Owner decision applied

| Rule | Application |
|------|-------------|
| Authoritative property | charge `property_id` = lease `property_id` = tenant `property_id` |
| Incorrect field | `unit_id` only |
| Organization | unchanged (`f8232926-149d-46b3-829f-c84b55378718`) |
| Money | unchanged (12 / `18240.00` / `8960.00` / 8 / `9280.00`) |
| Unit-number matching | **not** used as the assignment rule |
| Unused-unit preference | used to **filter** candidates, not to rank equals |
| Unrelated residents | not modified (tenants 13–18 stay put) |

Governance: this remains under **ADR-035**. No `property_id` change is required or proposed. If a later choice required a property rewrite: **STOP** and open a new ADR. That path is not taken here.

---

## 2. Collision rules (proven from Production)

| Rule | Evidence |
|------|----------|
| One active lease per unit | Unique index `leases_one_active_per_unit_idx` on `(organization_id, unit_id)` where `status = 'active'` and `deleted_at is null` |
| Tenants are not uniquely constrained to a unit | `tenants_org_unit_idx` is non-unique |
| Dataset does **not** use multi-resident units | 0 Development units have more than one tenant |
| Unused tenants are still active | All 18 Development tenants are `status=active`, `lifecycle_status=awaiting_move_in`, not archived, not deleted, no `move_out_date` |
| Canonical Development residents | 0 `pm_residents` / `lease_residents` / `lease_agreements` |

The demo schema *could* allow two tenant rows on one unit. The live dataset never does. This package will **not** introduce silent double occupancy to unblock M2. Harbor `005–008` and Summit `001–002` are therefore **excluded** — they already have active unused tenants (Skyler Nguyen, Emerson Owens, Finley Patel, Harper Reed, Logan Singh, Sage Turner). Those residents are out of M2 money scope and are not modified.

Avery Brooks, Morgan Ellis, and Quinn Hayes stay on Maple `001` / `004` / `007`. Those units are excluded from the candidate pools.

Cameron Lopez stays on Harbor `003` `2649465e-…`. That unit is excluded.

---

## 3. Collision-free candidate pools

After a simultaneous eight-row `unit_id` retarget, the only collision-free same-org + same-property leftover units are:

### Maple Court — Reese only (1 resident, 5 units)

Units vacated by Jordan / Taylor / Riley / Casey / Hayden when those four leave Maple:

| UUID | Number / label | Canonical? | Why available after remap |
|------|----------------|------------|---------------------------|
| `a8259856-39aa-42f4-9db3-43870243f790` | `002` / Unit 2 | Yes — Maple | currently Jordan |
| `93033440-87eb-4919-93b8-c8b4b09b6f69` | `003` / Unit 3 | Yes — Maple | currently Taylor |
| `9e345d47-1d11-4d5c-b4ff-164cfaf81eb0` | `005` / Unit 5 | Yes — Maple | currently Riley |
| `8f02b5b5-1935-4a84-8d28-237dcbabd38e` | `006` / Unit 6 | Yes — Maple | currently Casey |
| `61ddf528-832d-4730-b788-249344f4c9fb` | `008` / Unit 8 | Yes — Maple | currently Hayden |

No Maple unit is unused today. Reese’s only legal targets are units the other mismatches vacate. Production cannot distinguish these five (unit rent ≠ charge amount even on READY rows; unit-number matching forbidden).

### Harbor View — Riley, Jordan, Hayden (3 residents, 3 units)

Units vacated by Parker / Reese / Dakota. Harbor `003` reserved for Cameron. Harbor `005–008` excluded (active unused tenants).

| UUID | Number / label | Canonical? | Why available after remap |
|------|----------------|------------|---------------------------|
| `6c1cb9e3-fb36-474a-b600-ba13f7258dc2` | `001` / Unit 1 | No | currently Parker |
| `03dc55de-6395-41cf-b187-e36e18e2d307` | `002` / Unit 2 | No | currently Reese |
| `e24d173b-bd7b-4b20-97f2-cc83d146d34e` | `004` / Unit 4 | No | currently Dakota |

The **pool** is uniquely determined (3 collision-free Harbor units for 3 Harbor finance identities). The **pairing** is not. Reese↔Jordan reciprocal swap is a candidate the Owner may confirm; it is not proven.

### Summit — Dakota, Taylor, Parker, Casey (4 residents, 6 units)

Currently unused, zero tenant / lease / charge refs. Summit `001–002` excluded (Logan Singh, Sage Turner).

| UUID | Number / label | Canonical? |
|------|----------------|------------|
| `261524d5-c2d6-4d4b-9149-8b86ac3b5633` | `003` / Unit 3 | No |
| `a87fb591-d655-4a85-9b65-e9788337417f` | `004` / Unit 4 | No |
| `d2c1a9ed-a555-437b-90c5-032a0e2da3de` | `005` / Unit 5 | No |
| `ef390c04-4586-430c-96fe-25b3df117f04` | `006` / Unit 6 | No |
| `6724c270-ad9b-430c-8585-2b83e1d181de` | `007` / Unit 7 | No |
| `3940ba85-f1c4-474b-8309-3a118c94d40e` | `008` / Unit 8 | No |

These six are the unused valid Summit units. Four residents cannot be assigned without an Owner pick. Preferring “unused” does not rank `003` above `008`.

---

## 4. Eight-row proposed map

Every proposed replacement, once Owner-named, must: same org, authoritative property, exist in `units`, create no unexplained occupancy collision, and not rely solely on unit number.

| Resident | Charge | Lease | Tenant | Payment | Authoritative property | Current unit | Current unit home | Proposed unit | Collision if Owner stays in pool |
|----------|--------|-------|--------|---------|------------------------|--------------|-------------------|---------------|----------------------------------|
| Reese Kim | `de460536-d3c9-45c6-bfcd-4f14c42f3991` | `0c4f5b19-7d0b-41e2-ae23-bb692273a4f0` | `c88f5430-3dfb-4712-8731-47f43f315950` | `73ad0ce3-8ef0-4984-965a-a07e1db83fba` | Maple Court `737977ae-…` | `03dc55de-…` Harbor `002` | Harbor View | **OWNER CHOICE** among Maple `002/003/005/006/008` | None inside that pool after the other seven leave; collision if Maple `001/004/007` (Avery/Morgan/Quinn) |
| Riley Foster | `888c5d4b-d3e1-4e30-9d7b-397baa6f8e7e` | `e0596f95-99ca-48c8-be94-16b19eb329b4` | `fc9b6cec-3f1f-4f17-9d31-ca07061899ac` | `7237c52c-d84b-4798-812d-4780e6e03b70` | Harbor View `d22cb503-…` | `9e345d47-…` Maple `005` | Maple Court | **OWNER CHOICE** among Harbor `001/002/004` | Collision if Harbor `003` (Cameron) or `005–008` (unused active tenants); collision if two Harbor finance identities share one unit |
| Jordan Chen | `c38053b1-621f-49bb-a2fb-33d621279ff5` | `dcf2faa2-16bc-4bad-83da-5b05d84aba90` | `b17e92f9-52ee-4a15-bb58-2a2da488decd` | `c7e30693-c735-4ff4-a695-e06e51c1b741` | Harbor View `d22cb503-…` | `a8259856-…` Maple `002` | Maple Court | **OWNER CHOICE** among Harbor `001/002/004` | Same Harbor rules |
| Hayden Ibrahim | `daa44657-291b-4e76-a7c5-a1a312ad647a` | `78af7e29-629b-478a-bd3f-e249b8ba865e` | `7ffbf72c-0c65-4c6c-aa32-e21fd8de8d7a` | `ba15d07c-b12e-486a-a91e-50b4ccd300b3` | Harbor View `d22cb503-…` | `61ddf528-…` Maple `008` | Maple Court | **OWNER CHOICE** among Harbor `001/002/004` | Same Harbor rules |
| Dakota Martin | `5fada492-d95f-492c-b612-8126fcf63cc9` | `085aff65-15dc-4753-b560-5eec2b1fd10e` | `3153d61e-5784-4fe8-b962-c70a4149e7be` | none | Summit `5ea87ad9-…` | `e24d173b-…` Harbor `004` | Harbor View | **OWNER CHOICE** among Summit `003–008` | Collision if Summit `001/002` (Logan/Sage) or if two Summit finance identities share one unit |
| Taylor Diaz | `6405eeca-afba-42e7-a077-ceccec85b6bd` | `35e5bda1-a404-4823-9b16-aa84c92a35c5` | `ce8d6c0b-5128-44e9-bb8e-b5dc0772c68c` | none | Summit `5ea87ad9-…` | `93033440-…` Maple `003` | Maple Court | **OWNER CHOICE** among Summit `003–008` | Same Summit rules |
| Parker Johnson | `ca4288cb-ebe9-4a8d-b7e3-5a8ba6f96fdc` | `ff4e7e91-b26d-407a-a94e-e7b71c4c8fad` | `51b047bb-3d55-4516-ad82-399c027dda03` | none | Summit `5ea87ad9-…` | `6c1cb9e3-…` Harbor `001` | Harbor View | **OWNER CHOICE** among Summit `003–008` | Same Summit rules |
| Casey Garcia | `d4fadeac-adf8-4ba0-a84a-76c9a9b41633` | `e348d409-be75-465e-bdba-8d1168a0de74` | `281486d5-cfed-4ce9-bba4-4667401fd559` | none | Summit `5ea87ad9-…` | `8f02b5b5-…` Maple `006` | Maple Court | **OWNER CHOICE** among Summit `003–008` | Same Summit rules |

Repair surface once approved: `unit_id` only on that charge, lease, tenant, and payment (if any). Not `property_id`. Not amounts, dates, statuses, charge type, vendor AP, receipts, or Stripe metadata.

---

## 5. Cameron / Option B

| Test | Live |
|------|------|
| UUID | `2649465e-1894-4c19-b699-457c8570a7f3` |
| Org / property | Development / Harbor View |
| Label | `003` / Unit 3 / `occupied` / `active` / not deleted / not archived |
| Canonical `property_units` | **absent**; 0 Harbor View canonical units; 0 same-label conflict |

**OPTION_B_PROVEN.** Do not create it in this package. Safe to materialize only in a later authorized Development M2 execute, and only if Owner does not reassign that UUID.

---

## 6. Money-preservation

Development live, unchanged:

| Measure | Required / live |
|---------|-----------------|
| Charges | 12 |
| Gross | `18240.00` |
| Paid | `8960.00` |
| Payments | 8 |
| Outstanding | `9280.00` |

A later `unit_id`-only write must leave these totals and all protected money fields unchanged. No money-change case exists in this map.

---

## 7. Modeled post-repair M2 (conditional)

This model assumes Owner later names a complete collision-free map from the pools above. It is **not** a READY declaration.

| Identity | Modeled class after a valid Owner map |
|----------|----------------------------------------|
| Avery, Morgan, Quinn | `CANONICAL_READY` (unchanged Maple canonical units) |
| Reese | `CANONICAL_READY` (any Maple `002/003/005/006/008` already has `property_units`) |
| Cameron | `OPTION_B_PROVEN` (Harbor `003`) |
| Riley, Jordan, Hayden | `OPTION_B_PROVEN` (Harbor `001/002/004` have no canonical row) |
| Dakota, Taylor, Parker, Casey | `OPTION_B_PROVEN` (Summit `003–008` have no canonical row) |

Expected blockers after a complete valid map: `unit_property_mismatch = 0`, missing identity = 0, other blockers = 0.

Expected money: 12 / `18240.00` / `8960.00` / 8 / `9280.00`.

Expected later M2 materializations (not executed here): 12 charges, 8 payments, 8 allocations, reconstructed ledger, 12 leases, 12 residents, Cameron Option B plus 3 Harbor + 4 Summit Option B units (7 new `property_units` if those pools are used), Maple’s 8 canonical units retained.

**Development is not READY.** Identity ambiguity remains until Owner names eight distinct UUIDs from the pools, with no two Harbor or Summit assignees sharing a unit.

---

## 8. Implementation plan (unauthorized until the eight UUIDs are named)

Section 7 of the Owner decision asked for an exact repair package only if every replacement is deterministically supported. They are not. The package shape below is recorded so a later implement slice can start immediately after Owner picks. It is **not** authorized now.

Do not combine repair and M2 execute into one authorization.

| Step | Action |
|------|--------|
| 1 | Assert current charge / lease / tenant / payment ids and current `unit_id` values |
| 2 | Assert charge = lease = tenant `property_id` on each of the eight |
| 3 | Assert Development money 12 / `18240.00` / `8960.00` / 8 / `9280.00` and July ID hashes |
| 4 | Update **only** approved `unit_id` fields on those July rows |
| 5 | Write auditable before/after mappings |
| 6 | Verify money and hashes unchanged |
| 7 | `finance_m2_run(true, Development)` |
| 8 | STOP and inspect the real dry-run |
| 9 | Separate Owner authorization before `finance_m2_run(false, Development)` |

---

## 9. Owner review table

| Resident | Property | Current Wrong Unit | Proposed Unit | Collision | Confidence |
|----------|----------|--------------------|---------------|-----------|------------|
| Reese Kim | Maple Court | Harbor `002` `03dc55de-…` | Choose one Maple `002/003/005/006/008` | None in that pool after the other seven leave | **OWNER CHOICE REQUIRED** |
| Riley Foster | Harbor View | Maple `005` `9e345d47-…` | Choose one Harbor `001/002/004` | Do not use Cameron `003` or unused-tenant `005–008`; do not share with Jordan/Hayden | **OWNER CHOICE REQUIRED** |
| Jordan Chen | Harbor View | Maple `002` `a8259856-…` | Choose one Harbor `001/002/004` | Same Harbor rules | **OWNER CHOICE REQUIRED** |
| Hayden Ibrahim | Harbor View | Maple `008` `61ddf528-…` | Choose one Harbor `001/002/004` | Same Harbor rules | **OWNER CHOICE REQUIRED** |
| Dakota Martin | Summit | Harbor `004` `e24d173b-…` | Choose one Summit `003–008` | Do not use Logan/Sage `001–002`; do not share with Taylor/Parker/Casey | **OWNER CHOICE REQUIRED** |
| Taylor Diaz | Summit | Maple `003` `93033440-…` | Choose one Summit `003–008` | Same Summit rules | **OWNER CHOICE REQUIRED** |
| Parker Johnson | Summit | Harbor `001` `6c1cb9e3-…` | Choose one Summit `003–008` | Same Summit rules | **OWNER CHOICE REQUIRED** |
| Casey Garcia | Summit | Maple `006` `8f02b5b5-…` | Choose one Summit `003–008` | Same Summit rules | **OWNER CHOICE REQUIRED** |

No row is `PROVEN` or `STRONG` as a single UUID. Pool membership is strong; assignment is not.

Owner must return eight distinct UUIDs:

1. Reese → one of Maple `a8259856-…` / `93033440-…` / `9e345d47-…` / `8f02b5b5-…` / `61ddf528-…`
2. Riley, Jordan, Hayden → a permutation of Harbor `6c1cb9e3-…` / `03dc55de-…` / `e24d173b-…`
3. Dakota, Taylor, Parker, Casey → four distinct ids from Summit `261524d5-…` / `a87fb591-…` / `d2c1a9ed-…` / `ef390c04-…` / `6724c270-…` / `3940ba85-…`

Optional Owner confirmations (not agent inferences): Reese↔Jordan reciprocal; any same-number pairing.

---

## FINAL VERDICT

**BLOCKED — OWNER CHOICE REQUIRED**
