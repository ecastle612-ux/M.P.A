# COM-002 PRODUCTION RELEASE CERTIFICATION

**Title:** COM-002 PRODUCTION RELEASE CERTIFICATION  
**Status:** BLOCKED  
**Date:** 2026-08-14  
**Recorded at:** 2026-08-14T01:09:57Z  
**Approved design:** docs/80 (PR [#188](https://github.com/ecastle612-ux/M.P.A/pull/188), not on `main`)  
**ADR:** ADR-024 (PR #188, not on `main`)  
**Implementation cert:** docs/81 (PR #188, not on `main`)  
**Production deploy:** **NOT PERFORMED**  
**Billing / Stripe / commercial flow:** **Unchanged**

Identifier note: this record certifies **COM-002 Tenant Communication Center** (ADR-024 / docs/80), not COM-002 Self-Service Commercial (ADR-018 / docs/37).

---

## Final verdict

**BLOCKED**

Production release of COM-002 Tenant Communication Center is not certified. No production migration was applied. No production deployment was performed. Authenticated UAT was not executed.

Stop here.

---

## 1. Merge validation

| Check | Result |
|-------|--------|
| PR [#188](https://github.com/ecastle612-ux/M.P.A/pull/188) merged into `main` | **NO** — state `OPEN`, `isDraft: true` |
| Merge commit | **NONE** |
| Release SHA (COM-002 on `main`) | **NONE** |
| Current `main` SHA | `dac469a7de5ee245978c47b08b9e7c03d18abdd4` |
| COM-002 commits present on `main` | **NO** |

`origin/main` tip at certification time:

```
dac469a7 Merge pull request #178 from ecastle612-ux/cursor/final-release-certification-01f2
```

COM-002 commits exist only on `cursor/tenant-communication-center-b7a1` (PR #188 head `3f4d229a97b1701b7ba9332a8a9f68aa158616ae`):

| SHA | Commit |
|-----|--------|
| `029c1720` | docs: design COM-002 Tenant Communication Center (ADR-024) |
| `e1ced559` | docs: approve COM-002 Tenant Communication Center (ADR-024) |
| `2ad212ed` | feat: implement COM-002 Tenant Communication Center |
| `3f4d229a` | docs: certify COM-002 Tenant Communication Center implementation |

PR #188 checks (not a substitute for merge):

| Check | Result |
|-------|--------|
| CI `verify` | **SUCCESS** — [run 31759331243](https://github.com/ecastle612-ux/M.P.A/actions/runs/31759331243) |
| Vercel Preview | **SUCCESS** — `7xMwRreEsmXdqsmrHwM7rXL2VbZ5` |
| `mergeable` | `MERGEABLE` / `CLEAN` |

**Hard gate:** a certified main release requires #188 merged to `main`. This record does not merge the draft PR.

---

## 2. Database migration review

File reviewed: `supabase/migrations/20260814010000_com_002_tenant_communication_center.sql` (on PR #188; not on `main`).

### Intended objects (repo lineage)

| Object | Present in migration |
|--------|----------------------|
| `comms_conversations` | Yes — `create table if not exists` |
| `comms_conversation_participants` | Yes — `create table if not exists` |
| `comms_conversation_messages` | Yes — `create table if not exists` |
| `comms_message_reads` | Yes — `create table if not exists` |
| Inbox / tenant / thread / idempotency indexes | Yes — `create index if not exists` / unique link index |
| RLS on all four conversation tables | Yes — enable + select/insert/update policies |
| Organization isolation | Yes — `organization_id` on every table; access via `can_access_tenant_conversation` / `is_pm_staff` |
| `comms_notifications.conversation_id` | Additive nullable FK — `add column if not exists` |
| MEDIA-001 `conversation_message` | Widens `related_entity_type` check; tightens select RLS for that type only |

### Additive / non-destructive (relative to repo lineage)

| Check | Result |
|-------|--------|
| New tables only + `create or replace` helpers | **PASS** |
| No `drop table` / no rewrite of `comms_messages` | **PASS** |
| Notices store (`comms_messages`) not altered | **PASS** in file |
| MEDIA check constraint widened, not narrowed | **PASS** |
| Existing one-way notice rows unaffected by file | **PASS** in file |

### Production compatibility (mpa-prod `vahnmcrpnuggxkivynvo`)

The approved file is **not apply-safe on current production**. It assumes the LAUNCH-001 / FIN-OPS comms lineage that exists in the repo and on `mpa-preview`, not on `mpa-prod`.

| Prerequisite | Production (`mpa-prod`) | Preview (`mpa-preview`) |
|--------------|-------------------------|-------------------------|
| `comms_messages` | **Missing** | Present |
| `comms_notifications` | **Missing** | Present |
| `lease_residents` | **Missing** | Present |
| `is_lease_resident()` | **Missing** | Present (repo FIN-OPS S1) |
| `is_pm_staff()` | **Missing** | N/A until this migration |
| `can_access_tenant_conversation()` | **Missing** | Missing (expected) |
| `comms_conversations` and child tables | **Missing** | Missing (expected) |
| `is_org_member()` | Present | Present |
| `media_attachments` | Present (6 rows); check constraint lacks `conversation_message` | Present |
| `lease_agreements` / `pm_residents` | Present — **0 rows each** | Present |

Production already has a different communications store (`conversation_threads` 3 rows, `communication_messages` 2 rows, `in_app_notifications` 19 rows). Those objects are outside this migration and were not modified.

Applying `alter table public.comms_notifications add column …` on production **would fail** because the table does not exist. Creating `can_access_tenant_conversation` **would fail** because it calls `is_lease_resident()`, which does not exist on production.

Latest production migration: `20260813232103_fo_prod_enablement_d_events_audit_compat`. COM-002 version `20260814010000` is **not** in the production migration ledger.

---

## 3. Apply production migration

| Field | Value |
|-------|--------|
| Migration ID | `20260814010000_com_002_tenant_communication_center` |
| Applied | **NO** |
| Timestamp | n/a |
| Result | **NOT APPLIED** |

Reasons: PR #188 is not on `main`; the approved SQL is not apply-safe on `mpa-prod` without a separately designed production-compat package (out of scope for this release cert). Existing production communication rows were left untouched.

---

## 4. Deploy production

| Field | Value |
|-------|--------|
| COM-002 production deploy | **NOT PERFORMED** |
| Live production deployment | `dpl_5j41NXUG94oQyuNFXdzbMzTpQWFn` |
| Commit deployed | `dac469a7de5ee245978c47b08b9e7c03d18abdd4` |
| GitHub Production deployment | `5896348342` (2026-08-13T21:26:16Z) |
| Status | Ready — current `main` (PR #178), **not** COM-002 |
| Aliases | `www.my-property-assistant.com`, `my-property-assistant.com`, `m-p-a-web.vercel.app` |

A production promote of unmerged PR #188 was refused. Live production remains the certified `main` tip from PR #178.

---

## 5. Authenticated COM-002 UAT

**NOT PERFORMED** — COM-002 is not on production `main`, conversation tables are not in `mpa-prod`, and production has **zero** `lease_agreements` / `pm_residents` rows for a tenant inbox path.

| Scenario | Result |
|----------|--------|
| Property Manager — login / desk / start / send / history | **NOT RUN** |
| Tenant — login / inbox / receive / reply / history | **NOT RUN** |
| Attach image (MEDIA-001) / authorized view / unauthorized deny | **NOT RUN** |
| Start message from residential work order / thread linkage | **NOT RUN** |
| Notification Center entry / thread link | **NOT RUN** |

Implementation-level suites remain on PR #188 only (see docs/81). They are not a production UAT substitute.

---

## 6. Security validation

Live production security exercise for COM-002: **NOT PERFORMED** (feature not deployed; schema not present).

Code-level findings from docs/81 remain the implementation cert, not this production cert:

| Check | Production result |
|-------|-------------------|
| Tenant sees only own conversations | **NOT RUN** |
| PM sees only authorized residents/properties | **NOT RUN** |
| FO users cannot access tenant communications | **NOT RUN** |
| Organization isolation | **NOT RUN** |
| Media authorization | **NOT RUN** |

No production incident was opened. No production data was written.

---

## 7. Incident status

| Item | Status |
|------|--------|
| Production incident | **None** |
| Production schema change | **None** |
| Production traffic change | **None** |
| Customer-facing COM-002 availability | **Not released** |

---

## Unblock requirements (next Owner authorization)

These are gates, not work authorized by this record:

1. Mark PR #188 ready and **merge into `main`**. Re-record merge commit + release SHA.
2. Design → Document → Approve a **production-compat apply package** for `mpa-prod` (missing `comms_notifications`, `is_lease_resident` / `lease_residents`). Do not apply FIN-OPS or LAUNCH-001 comms wholesale without that gate.
3. Apply the approved production-compat migration to `mpa-prod` and record ID / timestamp / result.
4. Deploy that `main` SHA to production (`m-p-a-web`) and record deployment ID.
5. Run authenticated UAT with controlled PM + tenant accounts (production currently has no `pm_residents` / `lease_agreements` rows).
6. Re-issue this certification with **PRODUCTION RELEASE SUCCESSFUL** or remain **BLOCKED**.

No feature additions, redesign, billing, Stripe, commercial-flow, or Facility Operations tenant-messaging work is authorized by this record.
