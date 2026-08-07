# Backup Verification

**Parent:** [Production Deployment Support](./index.md)  
**Target:** Production Supabase project used by Customer #1  

---

## Why this matters

Customer #1 data (org, properties, leases, payments metadata, maintenance) must be recoverable. Verify **before** production migrations and before go-live traffic.

---

## Pre-deploy checks

- [ ] Production Supabase project identified (ref recorded in [Environment Verification](./environment-verification.md))  
- [ ] **Point-in-time recovery (PITR)** or daily backups enabled for the plan in use  
- [ ] Backup retention meets operator policy (record actual retention below)  
- [ ] Database password / project access limited to operators  
- [ ] Confirm who can restore (named owner)  

---

## Migration safety

Before applying `supabase/migrations/*.sql` to production:

1. Confirm staging already runs the full migration set successfully.  
2. Snapshot or note current production schema version / migration list.  
3. Prefer applying during a low-traffic window (first customer: before their session).  
4. After migrate: spot-check critical tables exist (`organizations`, memberships, properties, residents, leases, financial + maintenance tables from LAUNCH-001).  

---

## Restore drill (minimum)

Do **not** restore production onto itself as a drill. Prefer:

| Option | Action |
|--------|--------|
| A (preferred) | Restore latest backup / PITR into a **throwaway** Supabase project or branch; confirm auth + one org query works |
| B | If plan lacks branch restore: document restore steps from Supabase dashboard and perform a **table count** export verification |

Record:

| Field | Value |
|-------|-------|
| Backup / PITR enabled? | ☐ |
| Retention | |
| Last successful backup time (UTC) | |
| Restore drill performed? | ☐ Yes ☐ Skipped (reason) |
| Drill result | |
| Restore owner | |
| Date | |

---

## During Customer #1

- Do not run destructive SQL in production.  
- Schema changes only via approved migrations under hotfix protocol.  
- If data corruption suspected: pause customer mutations → engage restore owner → follow [Bug-Fix Protocol](./production-bugfix-protocol.md).
