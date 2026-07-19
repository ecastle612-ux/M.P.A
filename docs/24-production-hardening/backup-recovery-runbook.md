# Backup & Recovery Runbook (EP-008 Phase 1)

**Status:** Documented (2026-07-19)
**Parent:** [24 Production Hardening](./index.md) · [ADR-015](../18-decision-log/adr-015-production-hardening-operational-excellence.md)
**Scope:** Database backups, storage recovery, restore procedures, environment recovery,
and disaster-recovery guidance for the **currently existing** infrastructure (Supabase
Postgres, Storage, Auth). Document Vault protection is **Deferred** until that module exists.

> This is a procedural runbook (§4.6). It introduces no application code or schema.

---

## 1. Database Backups (Supabase Postgres)

- **Managed backups:** Supabase provides automated daily backups; paid tiers add
  Point-in-Time Recovery (PITR). Confirm the project's plan and that PITR is enabled before
  Design Partner production use.
- **Logical export (portable):** `supabase db dump --file backup.sql` (schema + data) for
  an off-platform copy. Store encrypted, access-controlled, and versioned.
- **Migrations as source of truth:** schema is reproducible from `supabase/migrations/`.
  Never hand-edit production schema; all changes flow through migrations (and the gate).
- **Verification cadence:** monthly — take a dump, restore into a scratch project/local
  stack, and confirm row counts + `auth.users` integrity.

## 2. Storage Recovery (Supabase Storage)

- Buckets and objects are backed by the project's storage backend. For portability, script
  periodic bucket exports (S3-compatible API) to an encrypted external location.
- Recovery: recreate bucket config, then restore objects from the latest export. Validate
  object counts and a sample of checksums.

## 3. Restore Procedures

1. Provision a target (new Supabase project or local `supabase start`).
2. Apply migrations: `supabase db push` (or `supabase start` locally applies them).
3. Restore data from the latest verified dump.
4. Restore storage objects from the latest export.
5. Reconfigure Auth redirect URLs and environment variables (see the
   [Deployment Readiness Runbook](./deployment-readiness-runbook.md)).
6. Smoke test: sign-up, sign-in, session, and a protected route.

## 4. Environment Recovery

- Environment configuration is code + documented variables — see the deployment runbook
  for the authoritative variable inventory. No secret lives only in a person's head; all
  are recoverable from the secret manager.
- Local/dev recovery is reproducible from the repo (`pnpm install`, `.env.local`,
  `supabase start`).

## 5. Disaster Recovery Guidance

- **RPO/RTO targets:** define per Design Partner SLA before launch (recommend RPO ≤ 24h via
  daily backups, tighter with PITR; RTO ≤ 4h via the restore procedure above).
- **Runbook ownership:** the restore drill (§1 verification) must be executed and signed off
  at least once before expanded Design Partner usage.
- **Immutable audit trail:** once the Deferred append-only audit store lands, include it in
  backup scope; until then, audit events are emitted to the log sink (see
  [Security Review Findings](./security-review-findings.md)).

---

## Deferred (own gate)

- Document Vault protection/recovery (module does not exist yet).
- Automated backup verification in CI and alerting on backup failure.
