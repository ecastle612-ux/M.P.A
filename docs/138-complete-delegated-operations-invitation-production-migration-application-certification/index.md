# 138 — Complete Delegated Operations Invitation Remediation Production Migration Application Certification

**Title:** COMPLETE DELEGATED OPERATIONS INVITATION REMEDIATION PRODUCTION MIGRATION APPLICATION CERTIFICATION  
**Status:** **READY FOR APPLICATION DEPLOYMENT**  
**Date:** 2026-08-15  
**Program:** Complete Delegated Operations (invitation workflow only)  
**Authority:** Owner authorization to apply the certified Production migration only · [docs/135](../135-complete-delegated-operations-invitation-remediation/index.md) **Approved** · [docs/136](../136-complete-delegated-operations-invitation-implementation-certification/index.md) · [docs/137](../137-complete-delegated-operations-invitation-production-migration-certification/index.md) **READY FOR PRODUCTION MIGRATION APPLICATION** · [ADR-033](../18-decision-log/adr-033-member-operating-scope.md) remains closed  
**Target:** `mpa-prod` / `vahnmcrpnuggxkivynvo` (us-west-2, ACTIVE_HEALTHY)  
**Not the target:** `mpa-preview` / `drcbipqrxfqpjilsfxip`  
**This package:** Database apply only. **No application deploy.**  

---

## Verdict

**READY FOR APPLICATION DEPLOYMENT**

docs/135 invitation schema remediation is live on Production. The Production application remains on the certified pre-remediation SHA. That split is intentional.

**Do not deploy the docs/135 application from this record.**

---

## What this package did not do

- Did not deploy the docs/135 application
- Did not merge application code
- Did not apply any other migration
- Did not apply `20260815200000` or `20260815210000`
- Did not create or send Production invitations
- Did not modify memberships or assign operating scopes
- Did not reset passwords
- Did not change Stripe / billing / prices / subscriptions / SKUs / roles / entitlement keys
- Did not implement FIN-OPS, create `financial_charges`, replay S0/S1/S2, or modify July finance data
- Did not rewrite historical invitations or operating-scope events

---

## 1. Pre-apply Production baseline

Read immediately before apply against `mpa-prod` / `vahnmcrpnuggxkivynvo`.

| Check | Result |
|-------|--------|
| Target | `mpa-prod` / `vahnmcrpnuggxkivynvo` — not Preview |
| Status | ACTIVE_HEALTHY |
| Ledger tip | `20260815193129` / `adr_033_dataplane_member_scope` — compatible with docs/137 |
| `20260815220000` registered | **No** |
| Equivalent invitation-remediation successor | **None** |
| Forbidden unused stamps `20260815200000` / `20260815210000` | **Absent** |
| Application SHA | `9b92db375dac75d469ed859134c629d46af536e8` (deploy `5923987277`, 2026-08-15T19:42:36Z) |
| Certified file SHA-256 | `1c24058a47ef924ded3f18731b13967b80a373a066e65fa99d732924568c8638` — **match** |
| Material drift vs docs/137 | **None** |

Pre-apply counts:

| Object | Pre-apply |
|--------|-----------|
| `organizations` | 21 |
| `organization_memberships` | 34 |
| active memberships | 32 |
| `organization_invitations` | 7 |
| `organization_operating_scope_events` | 8 |
| `organization_subscriptions` | 6 (1 Complete active · 5 PM active · 0 FO) |
| `maintenance_work_orders` | 33 (14 facility / 19 residential) |
| `facility_assets` | 6 |
| `facility_stock_items` | 2 |
| `facility_stock_movements` | 9 |
| `comms_conversations` | 2 |
| `comms_messages` | 0 |
| `document_documents` | 1 |
| `workspace_tables` | 7 |
| July `financial_activity` | 12 |
| `financial_charges` | **absent** |

Invitation distribution (unchanged expectation):

| status | delivery_status | n |
|--------|-----------------|---|
| accepted | failed | 1 |
| accepted | pending | 3 |
| expired | failed | 1 |
| pending | NULL | 1 |
| revoked | failed | 1 |

STOP condition for docs/137 invalidation: **not triggered**.

---

## 2. Certified file

| Item | Value |
|------|-------|
| File | `supabase/migrations/20260815220000_docs_135_invitation_acceptance_remediation.sql` |
| SHA-256 | `1c24058a47ef924ded3f18731b13967b80a373a066e65fa99d732924568c8638` |
| Bytes | 3996 |

File matched the docs/137 digest. Apply used that exact SQL. No altered SQL.

---

## 3. Apply result and ledger stamp

| Field | Value |
|-------|-------|
| Tool | Supabase MCP `apply_migration` |
| Project | `vahnmcrpnuggxkivynvo` |
| Name | `docs_135_invitation_acceptance_remediation` |
| Result | **success** |
| Other migrations applied | **None** |

### Stamp discrepancy (established process — not BLOCKED)

MCP `apply_migration` does not accept a caller-supplied version. It registers a platform-generated timestamp. That is the same unavoidable process documented in [docs/115](../115-ops-001-production-migration-application-certification/index.md).

```
20260815220000
    certified source migration
    supabase/migrations/20260815220000_docs_135_invitation_acceptance_remediation.sql

        ↓ exact SQL (SHA-256 match)

20260815222252
    Production apply version
    name: docs_135_invitation_acceptance_remediation
    repo stamp: supabase/migrations/20260815222252_docs_135_invitation_acceptance_remediation.sql
```

| Item | Value |
|------|-------|
| Certified source version **not** registered | `20260815220000` count = **0** |
| Production apply version | **`20260815222252`** |
| Production apply name | `docs_135_invitation_acceptance_remediation` |
| Predecessor tip | `20260815193129` / `adr_033_dataplane_member_scope` |
| Successor check | `20260815222252` > `20260815193129` |
| Forbidden unused stamps still unused | `20260815200000` / `20260815210000` absent |

### Proof of exact SQL equivalence

| Artifact | SHA-256 | Bytes |
|----------|---------|-------|
| Certified source file | `1c24058a47ef924ded3f18731b13967b80a373a066e65fa99d732924568c8638` | 3996 |
| Successor repo file | `1c24058a47ef924ded3f18731b13967b80a373a066e65fa99d732924568c8638` | 3996 |
| Production `schema_migrations.statements[1]` for `20260815222252` | `1c24058a47ef924ded3f18731b13967b80a373a066e65fa99d732924568c8638` | 3996 |

`cardinality(statements) = 1`. No omitted statements. No added compatibility SQL. Equivalence is proven; the apply is **not** BLOCKED.

The successor repo file is a byte-identical copy so the Production stamp is visible in git. The historical source file is unchanged. **Do not apply `20260815220000` later** — that SQL is already live as `20260815222252`.

Ledger tip after apply:

| Version | Name |
|---------|------|
| `20260815222252` | `docs_135_invitation_acceptance_remediation` |
| `20260815193129` | `adr_033_dataplane_member_scope` |
| `20260815185722` | `adr_033_member_operating_scope` |

---

## 4. Invitation schema validation

| Check | After apply |
|-------|-------------|
| `delivery_status` | **present** |
| `last_delivered_at` | **present** |
| `email_status` | **absent** |
| Business status CHECK | `pending` / `accepted` / `revoked` / `expired` |
| `delivery_status` CHECK | NULL or `pending` / `sent` / `failed` |
| Historical invitation rows | **7**, same status/delivery distribution — not rewritten |

---

## 5. Invitation UPDATE hardening

`invitations_update_authorized` is now:

```
USING (has_org_capability(organization_id, 'invitation:create'))
WITH CHECK (has_org_capability(organization_id, 'invitation:create'))
```

The jwt-email UPDATE path is **gone**. Ordinary signed-in invitees cannot UPDATE persisted `roles`, `operating_scope`, organization, status, or delivery fields.

SELECT-by-email remains for post-login preview (`invitations_select_authorized` unchanged).

No live invitation rows were mutated to prove this. Policy inspection is sufficient.

---

## 6. Membership INSERT boundary

`memberships_insert_authorized` is unchanged:

```
membership:update
OR organizations.created_by = auth.uid()
```

No invitee-self-insert policy was added. Ordinary authenticated invitees still cannot INSERT themselves into `organization_memberships`. Trusted `service_role` acceptance remains the later application path. No invitation/accept `SECURITY DEFINER` function exists.

---

## 7. Technician role CHECK

Both invitation and membership role CHECKs now allow:

`organization_admin`, `property_manager`, `leasing_agent`, **`maintenance_technician`**, **`facility_technician`**, `property_owner`, `tenant`, `vendor`

| Check | Result |
|-------|--------|
| `facility_manager` introduced | **No** |
| Existing rows satisfy the constraint | **Yes** |
| Memberships rewritten | **No** — still 34 / 32 active |
| `facility_technician` memberships | **2** (unchanged) |
| `maintenance_technician` rows | **0** (app not deployed) |
| `facility_manager` rows | **0** |
| RBAC `role_permission_grants` | Migration contains no grant writes. Live 412 grants / 19 finance keys. |

---

## 8. Acceptance idempotency index

| Field | Value |
|-------|--------|
| Name | `organization_operating_scope_events_invitation_accepted_uidx` |
| Definition | UNIQUE btree (`invitation_id`) WHERE `reason = 'invitation.accepted'` AND `invitation_id IS NOT NULL` |
| Matching events | **3** events / **3** distinct invitation ids |

No acceptance events were created in this package. Existing event rows were not rewritten.

---

## 9. ADR-033 regression

Authorization formula is unchanged:

```
effective access =
  SKU surfaces
  ∩ member operating scope
  ∩ role/module permission
  ∩ action
```

ADR-033 base `20260815185722` and Slice D `20260815193129` remain on the ledger. Scope CHECKs unchanged. Membership scope distribution unchanged: 31 NULL / 1 `both` / 1 `property_operations` / 1 `facility_operations`.

Controlled representations (read-only; not modified):

| Persona | Role | Scope | Status |
|---------|------|-------|--------|
| Erick `uat.adr033.erick@…` | `organization_admin` | `both` | active |
| Sarah `uat.adr033.sarah@…` | `property_manager` | `property_operations` | active |
| Mike `uat.adr033.mike@…` | `property_manager` | `facility_operations` | active |

---

## 10. Last-BOTH / grant-cap boundary

The applied SQL adds no function, trigger, or policy that bypasses application enforcement for inviter grant caps, last-BOTH protection, role demotion, scope-change protection, or existing-member accept/upsert. Those remain application-layer controls for the later docs/135 deploy. No destructive live tests were run.

---

## 11. Data safety — before / after

| Object | Before | After |
|--------|--------|-------|
| organizations | 21 | 21 |
| memberships | 34 | 34 |
| active memberships | 32 | 32 |
| invitations | 7 | 7 |
| invitation status/delivery distribution | see §1 | **identical** |
| operating-scope events | 8 | 8 |
| subscriptions | 6 | 6 (same SKU mix) |
| work orders | 33 (14/19) | 33 (14/19) |
| FAC-003 assets / stock / movements | 6 / 2 / 9 | 6 / 2 / 9 |
| COM-002 conversations / messages | 2 / 0 | 2 / 0 |
| OPS-001 documents / tables | 1 / 7 | 1 / 7 |
| July `financial_activity` | 12 | 12 |
| `financial_charges` | absent | **absent** |

No customer row was rewritten. No count changed.

---

## 12. Split-state confirmation

| Layer | State |
|-------|--------|
| Database | docs/135 invitation schema remediation **LIVE** as `20260815222252` |
| Application | pre-docs/135 SHA **`9b92db375dac75d469ed859134c629d46af536e8` still LIVE** |

This split remains **safe** (docs/137 §10):

- Live invitation create/list may remain broken because the app still selects/writes `email_status`
- Schema was **not** changed to add `email_status` for the old app
- Existing membership authorization and ADR-033 delegation remain healthy
- Invitee UPDATE hole is closed immediately (security improvement)

Temporary until the later certified application deployment.

---

## 13. FIN-OPS hard stop

| Check | Result |
|-------|--------|
| `financial_charges` | **absent** |
| `financial_*` tables | only existing `financial_activity` |
| FIN-OPS migration applied | **No** |
| July finance data | 12 rows, unchanged |
| PLAT-006 finance grants | migration did not write grants; 19 finance keys remain |
| docs/126 | remains blocked |

---

## 14. Application state

| Field | Value |
|-------|--------|
| Production SHA | `9b92db375dac75d469ed859134c629d46af536e8` |
| Deploy | `5923987277` |
| Created | `2026-08-15T19:42:36Z` |
| Deployed from this package | **No** |

---

## 15. Incident status

**None.** Apply succeeded. One platform ledger stamp (`20260815222252`) instead of the certified filename stamp (`20260815220000`). Exact SQL mapped byte-for-byte. No rollback required. No customer data change.

---

## Next Owner step

A **separate** application deployment package may deploy the certified docs/135 application. Then controlled invitation UAT. Neither is authorized by this record.

Do not apply `20260815220000` or the unused ADR-033 source stamps.

---

## Final verdict

**READY FOR APPLICATION DEPLOYMENT**
