# 07 — Document Vault Integration

**Package:** API-004  
**Status:** Draft — Ready for Approval

---

## Principle

Executed signature artifacts are **first-class vault documents**, not email attachments or orphaned provider links.

```
Signature package completed
  → SignatureService.downloadArtifacts (via SignatureProvider)
  → Store executed PDF(s) + certificate in Document Vault / Media (API-002A)
  → Link to applicant / resident / lease / property / organization
  → Timeline event signature.vault.stored
```

Provider portals are **not** the system of record for long-term retention.

---

## Artifact types

| Artifact | Category | Required on complete |
|----------|----------|----------------------|
| Executed document PDF | `executed_agreement` | ✔ (per package document) |
| Certificate of completion | `signature_certificate` | ✔ when provider supplies |
| Source/pre-sign PDF | `signature_source` | Retained for audit |
| Audit export (optional) | `signature_audit_export` | Future |

---

## Entity linkage

Every executed artifact should link (where applicable) to:

| Link | Purpose |
|------|---------|
| Organization | RLS / tenancy |
| Property | Portfolio context |
| Unit | Unit file |
| Lease | Execution proof |
| Applicant | Pre-resident path |
| Resident / tenant | Post-activation path |
| Signature package | Provenance |
| Screening case | Optional leasing chain continuity (API-003) |

Version history: new executions create new vault versions; prior executed copies remain unless retention purge applies.

---

## Media plane

Use API-002A organization plane + private bucket:

- `plane = organization`
- Path prefix includes `organization_id`
- Signed URL read with `signature:read_full` or `document:read` as designed in permissions matrix
- Virus/malware scan hooks follow API-002A

---

## Retention

| Setting | Behavior |
|---------|----------|
| `signature.retention_days` | Org-configurable |
| `signature.purge_mode` | Soft-delete vs hard-delete media |
| Legal hold | Blocks purge when flag set on lease/package |

Purge jobs must audit `signature.artifact.purged` and never orphan lease status without PM visibility.

---

## Download & sharing

- In-app download only through authorized APIs
- External share links (if ever) are separate product decision — **not** Phase 1
- Certificate and executed PDF downloads audited

---

## Failure handling

If vault store fails after provider reports complete:

1. Package remains `completed` with `vault_status = pending_retry`
2. Ops **Provider Failures** / vault retry queue surfaces the package
3. Background retry downloads from provider until success or manual intervention

Do not mark lease unexecuted solely due to vault lag; surface degraded state clearly.
