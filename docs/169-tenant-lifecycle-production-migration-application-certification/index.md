# 169 — Tenant Lifecycle Production Migration Application Certification

**Title:** TENANT LIFECYCLE PRODUCTION MIGRATION APPLICATION CERTIFICATION  
**Status:** **BLOCKED**  
**Date:** 2026-08-16  
**Program:** Customer-facing tenant lifecycle — Production schema apply  
**Authority:** [docs/165](../165-phase-4-pwa-install-device-experience/index.md) **Approved** · [docs/166](../166-tenant-lifecycle-onboarding-portal-move-out/index.md) **Approved** · [docs/167](../167-tenant-lifecycle-implementation-certification/index.md) · [docs/168](../168-tenant-lifecycle-production-migration-certification/index.md) **READY FOR TENANT LIFECYCLE PRODUCTION MIGRATION APPLICATION**  
**Target:** `mpa-prod` / `vahnmcrpnuggxkivynvo` (us-west-2, Postgres 17.6.1.141, `ACTIVE_HEALTHY`)  
**Certified source:** `supabase/migrations/20260816120000_docs_166_tenant_lifecycle.sql`  
**Certified SHA-256:** `4b1edb1f6150f70160577e2e1fba759bf4e15f92d7d6f6f3ca64bfd06f09a0c2`  
**This package:** One apply attempt of the exact certified SQL. **No substitute SQL. No deploy. No invitation. No binding. No move-out. No FIN-OPS money mutation. No July reopen. No Stripe execution. No M5. No SKU/pricing change. No native apps. No Web Push.**

Identifier collision: **COM-002** means Tenant Communication Center (ADR-024 / docs/80).

---

## Verdict

**BLOCKED**

The exact certified SQL was submitted to Production and **did not land**. Supabase aborted the transaction:

```
ERROR: 42703: column "created_at" does not exist
```

Live `public.financial_receipts` has `issued_at`, not `created_at`. The certified `financial_receipts_select_resident` policy references `created_at`. That incompatibility was not caught in docs/168.

No Production stamp was registered. Occupancy columns, helpers, and `organization_invitation_tenant_bindings` remain absent. Counts, money hashes, July freeze, FIN-OPS writes, Stripe flags, and the live application SHA are unchanged. The existing Tenant Portal was not placed on the new RLS.

This package did **not** patch the SQL, add a compatibility migration, or replay a modified stamp.

---

## What this package did not do

- Did not leave a partial occupancy schema
- Did not register `20260816120000` or any platform-assigned successor
- Did not create substitute SQL or a compatibility patch
- Did not deploy the tenant-lifecycle application
- Did not create or send a tenant invitation
- Did not create a tenant binding
- Did not move out a resident
- Did not mutate FIN-OPS money, reopen July, disable writes, or enable Stripe execution
- Did not implement M5, change SKUs/subscriptions/pricing, implement native apps, or implement Web Push

---

## 1. Pre-apply Production recheck

Read-only immediately before the apply attempt. Matched docs/168.

| Item | Live | Gate |
|------|------|------|
| Project | `mpa-prod` / `vahnmcrpnuggxkivynvo` | match |
| Health | `ACTIVE_HEALTHY` | match |
| Application SHA | `867c579bad30a5417c4cc682e90790627a55052d` (GitHub Production 2026-08-16T07:42:07Z; `origin/main`) | match — no unauthorized deploy |
| Ledger tip | `20260816074525` / `docs_161_fin_ops_reconciliation_m4_write_rls` | match |
| `20260816120000` / occupancy objects | absent | match |
| July | `july_freeze_enabled = true` | match |
| FIN-OPS writes | `finance_ops_writes_enabled() = true` | match |
| Stripe execution | all 6 `financial_module_settings` rows `false`; `late_fees_enabled = false` | match |

### 1.1 Pre-apply counts (docs/168 expected)

| Table | Expected | Live |
|-------|---------:|-----:|
| organizations | 21 | 21 |
| memberships | 36 | 36 |
| invitations | 14 | 14 |
| lease_agreements | 15 | 15 |
| lease_residents | 15 | 15 |
| pm_residents | 15 | 15 |
| property_units | 22 | 22 |
| financial_charges | 18 | 18 |
| financial_payments | 11 | 11 |
| financial_receipts | 1 | 1 |
| financial_payment_allocations | 11 | 11 |
| COM-002 conversations | 2 | 2 |
| COM-002 messages | 8 | 8 |
| work orders | 33 | 33 |
| documents | 1 | 1 |

### 1.2 Pre-apply fingerprints (docs/168)

| Fingerprint | Expected | Live |
|-------------|----------|------|
| organizations ID | `58621de89e48a4bcd3b0514f654be1ba` | match |
| memberships ID | `606d49c2dc34bf6cab12b10dd74cc8bc` | match |
| invitations ID | `f697f696f1abb3bfb8414446f2913e63` | match |
| leases ID | `bb5e82194aaf26237737b35289d1a93b` | match |
| lease_residents ID | `df7ee4bfb2dd96f45be9dc4358b89f5b` | match |
| pm_residents ID | `a3935a800b50525690edeb25e0b812ee` | match |
| units ID | `38aeed10d772980d2525f8d66d52ecd7` | match |
| charges ID | `a5a2e3ad6d56fd23d8fa0413f7362d02` | match |
| payments ID | `2e0152700616760386f3dfae332312a1` | match |
| receipts ID | `c1a92f1f39a2c544c6385e411b8e0e2a` | match |
| allocations ID | `a0a83f939a56bb185570430d12981a01` | match |
| comms conversations ID | `aa96e90236d5b898992850dbfe022ece` | match |
| comms messages ID | `b92903b2f6a90ebe6b63c0e702f9f4ff` | match |
| documents ID | `5ac5efc787017318707479f64b188ba9` | match |
| saas_subscriptions ID | `ac31d51669142b22e3433031b1c67ad2` | match |
| charges money | `e86487062cba4aeacef245b49c720335` | match |
| payments money | `1427d3aace128cd565802ee21a0da698` | match |
| receipts money | `27e1b44a8d042d3c428737ae15c796c3` | match |
| allocations money | `f4b217d66fb431497125aed8bf048b3c` | match |
| work-order id+status | `ebaeae04c257973913db8b67aa89448c` | match |

No unexplained drift. Pre-apply gate: **PASS**.

---

## 2. Source artifact

| Field | Value |
|-------|--------|
| Path | `supabase/migrations/20260816120000_docs_166_tenant_lifecycle.sql` (from certified impl tree) |
| SHA-256 | `4b1edb1f6150f70160577e2e1fba759bf4e15f92d7d6f6f3ca64bfd06f09a0c2` |
| Bytes | 19,132 |
| Modified before apply | **No** |

SQL was applied as certified. No compatibility patch was written.

---

## 3. Apply attempt

| Field | Value |
|-------|--------|
| Mechanism | Supabase `apply_migration` to `vahnmcrpnuggxkivynvo` |
| Requested name | `docs_166_tenant_lifecycle` |
| Outcome | **FAILED** — transaction aborted |
| Error | `42703: column "created_at" does not exist` |
| Production stamp assigned | **none** |
| Stored SQL SHA-256 | **n/a** — stamp not stored |

Do **not** replay `20260816120000` as-is. Equivalent certified SQL is **not** live under a platform-assigned stamp.

---

## 4. Blocking defect

Certified policy (source lines 470–482):

```sql
create policy financial_receipts_select_resident
on public.financial_receipts
for select
using (
  public.finance_resident_can_select_charge(
    organization_id,
    lease_id,
    null,
    null,
    created_at
  )
);
```

Live `financial_receipts` columns:

| Column | Type |
|--------|------|
| id | uuid |
| organization_id | uuid |
| payment_id | uuid |
| lease_id | uuid |
| resident_id | uuid |
| receipt_number | text |
| amount | numeric |
| currency | text |
| **issued_at** | timestamptz |
| payload | jsonb |

There is **no** `created_at`. The live timestamp is `issued_at`.

Sibling tables that the same migration references **do** have `created_at` (`financial_charges`, `financial_payments`, `financial_payment_allocations`, `financial_ledger_entries`, `financial_charge_schedules`). Receipts are the incompatible object.

docs/168 certified READY without checking `financial_receipts.created_at`. That is a certification miss, not a Production lineage drift.

This package did not invent a replacement expression (`issued_at`, `payments.created_at`, or a new column). That requires Design → Document → Approve.

---

## 5. Post-attempt schema (unchanged)

| Object | After failed apply |
|--------|--------------------|
| Ledger tip | still `20260816074525` / `docs_161_fin_ops_reconciliation_m4_write_rls` |
| `lease_residents` occupancy columns | **absent** |
| `organization_invitation_tenant_bindings` | **null** |
| `utc_today()` / `tenant_occupies_lease` / `member_is_tenant_only` | **null** |
| `financial_receipts_select_resident` | still `finance_resident_owns_lease(organization_id, lease_id)` |

Occupancy-status distribution: **n/a** — columns not created.

Portal-capable UAT tenant (`6cde6423-ad9b-49fb-aadd-3ea93ec8b040`, lease `a11ce002-0001-4000-8000-000000000401`): still the sole `lease_residents.user_id` link. Occupancy backfill did not run. Pre-migration access path unchanged.

Binding table rows: table absent (expected 0 after a successful apply; apply did not succeed).

Invitations remain 14 / hash `f697f696…`.

---

## 6. Helpers / RLS

Certified occupancy helpers are **not** live. Staff paths remain the M4 / PLAT-002 / PLAT-005 / ADR-033 definitions.

No anonymous privileged mutation helper was added. No browser-controlled binding path was added.

Do not broaden authenticated access to compensate. Nothing needs compensating; the prior schema is intact.

---

## 7. Existing tenant / application split-state

| Layer | State |
|-------|--------|
| DATABASE | **unchanged** — M4 tip; no occupancy authorization |
| APPLICATION | `867c579bad30a5417c4cc682e90790627a55052d` |

The current Production app still does not read occupancy columns. Because the schema did not change, the existing Tenant Portal was not broken by this attempt.

Add Tenant / Move Out remain unavailable. That is unchanged, not the intentional post-apply split-state from docs/168.

---

## 8. FIN-OPS / COM-002 / documents / subscriptions

After the failed apply (same as before):

| Check | Result |
|-------|--------|
| charges / payments / receipts / allocations | 18 / 11 / 1 / 11 |
| charges money hash | `e86487062cba4aeacef245b49c720335` |
| payments money hash | `1427d3aace128cd565802ee21a0da698` |
| receipts money hash | `27e1b44a8d042d3c428737ae15c796c3` |
| allocations money hash | `f4b217d66fb431497125aed8bf048b3c` |
| M4 first-write Property Demo charge `f2a6d161-…` / `17.16` / `open` | intact (included in charges hash) |
| `finance_ops_writes_enabled()` | true |
| July frozen | true |
| Stripe execution | false |
| COM-002 conversations / messages | 2 / 8 |
| work orders | 33 |
| documents | 1 |
| saas_subscriptions | 4 / hash `ac31d516…` |

Business-data delta: **NONE**. Structural delta: **NONE**. July delta: **0**. Stripe delta: **0**. SKU/subscription delta: **0**.

---

## 9. Incident status

| Field | Value |
|-------|--------|
| Severity | Apply blocked; Production not mutated |
| Incident | Certified SQL incompatible with live `financial_receipts` |
| Data loss | none |
| Partial schema | none (transaction abort) |
| Rollback performed | not required — nothing committed |
| Customer impact | none observed |

---

## 10. Exact next Owner-authorized step

**Do not** replay `20260816120000` as certified.

Required next gate: Design → Document → Approve a **compatibility amendment** that makes tenant-lifecycle receipt SELECT valid against live `financial_receipts.issued_at` (or an approved additive column), without rewriting FIN-OPS money, reopening July, or enabling Stripe execution.

Only after that amendment is certified may Production apply be retried.

Do not deploy the tenant-lifecycle application while occupancy schema is absent.

---

## Approval / next gate

This record does **not** authorize a patched apply, deploy, invitation, or move-out.

**Status: BLOCKED.**
