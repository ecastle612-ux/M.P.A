# 03 — ReportingService

**Package:** FIN-001  
**Status:** Design ✔ · Document ✔ · Approve Pending · Implement Blocked

---

## Role

`ReportingService` is the **only** application entry point for financial report preview, generation, download resolution, and vault persistence orchestration.

It does **not** own accounting rules. It orchestrates read → model → render → store.

---

## Responsibilities

| Responsibility | In scope |
| --- | --- |
| Authorize caller (org + capability) | ✔ |
| Validate report type + filters | ✔ |
| Load read-only snapshots for Report Engine | ✔ |
| Create / track generation jobs | ✔ |
| Return interactive preview models | ✔ |
| Invoke PDF Renderer | ✔ |
| Persist to Document Vault (versioned) | ✔ |
| Serve cached artifacts when fingerprint matches | ✔ |
| Mutate accounting / ledger / payments | ✘ |
| Send email / owner portal publish | ✘ Phase 1 (hook only) |
| AI summary | ✘ Phase 1 (hook only) |

---

## Conceptual API (design contracts)

Names are illustrative; post-Approve may map to Next.js route handlers or server actions. Contracts matter more than transport.

### `listReportTypes()`

Returns Phase 1 catalog metadata (id, title, description, filter schema, savedCount hints).

### `getSavedReportCount(input)`

```
input: { organizationId, propertyId, reportType, period? }
output: { count: number }
```

Counts vault versions matching scope (see [05](./05-document-vault-integration.md)).

### `previewReport(input)`

```
input: {
  reportType,
  propertyId,
  period: { startDate, endDate } | { year, month },
  options?: { recognitionBasis?: 'cash' | 'accrual' }
}
output: {
  reportModel,          // typed structured model for UI
  sourceFingerprint,    // hash of inputs + data revision markers
  generatedAt
}
```

Preview may skip PDF bytes. Must still be read-only.

### `generateReport(input)`

```
input: preview input + { persistToVault?: boolean } // default true
output: {
  jobId,
  status: 'queued' | 'running' | 'succeeded' | 'failed',
  progress?: { stage, percent? }
}
```

### `getJob(jobId)`

```
output: {
  jobId, status, progress?,
  error?: { code, message },
  result?: {
    reportModelSummary,
    vaultDocumentId,
    version,
    downloadPath or signedUrlHandle,
    contentHash,
    sourceFingerprint
  }
}
```

### `listVersions(input)`

```
input: { propertyId, reportType, year?, month? }
output: { versions: Array<{ version, generatedAt, period, vaultDocumentId, createdBy }> }
```

### `getDownload(versionId | jobId)`

Resolves authorized signed URL / stream. Never public unauthenticated bucket paths.

---

## Read-only enforcement

| Forbidden operation | Examples |
| --- | --- |
| Insert/update/delete | `rent_charges`, `payments`, `expenses`, `late_fees`, `financial_activity`, reconciliation tables |
| “Side effect writes” | Auto-posting late fees, creating charges to “balance” a report |
| Soft accounting fixes | Adjusting balances because a report “looks wrong” |

Allowed writes (reporting plane only):

- Report job rows (or equivalent job store)  
- Vault metadata + media asset references for PDF bytes  
- Optional report cache index (fingerprint → artifact)

---

## Job lifecycle

```
queued → running → succeeded
                 ↘ failed (retryable | terminal)
```

| Stage | Meaning |
| --- | --- |
| `queued` | Accepted; waiting for worker |
| `running` | Fetching data / building model / rendering PDF / vaulting |
| `succeeded` | Preview + PDF available; vault version created when persist=true |
| `failed` | Error recorded; accounting untouched |

Retries: see [06 Performance](./06-performance.md).

---

## Source fingerprint

To enable safe caching and “regenerate if data changed”:

```
fingerprint = hash(
  reportType,
  propertyId,
  period,
  options,
  dataRevisionMarkers   // e.g. max(updated_at) per source table in scope, or activity watermark
)
```

If fingerprint matches a succeeded artifact and policy allows cache hit → return existing vault version without re-render.

---

## Error model

| Code | User meaning |
| --- | --- |
| `UNAUTHORIZED` | No access |
| `PROPERTY_NOT_FOUND` | Invalid property |
| `INVALID_PERIOD` | Bad dates |
| `NO_DATA` | Valid request; empty report still generable with zeros / empty sections |
| `RENDER_FAILED` | PDF renderer error — retry |
| `VAULT_FAILED` | PDF built but store failed — retry store; do not invent accounting writes |
| `TIMEOUT` | Job exceeded budget — retry |

`NO_DATA` is **not** a hard failure for Phase 1; reports should still generate with empty-state sections unless product Approve requires otherwise.

---

## Future plug-in surface

```
ReportingService.generateReport
        │
        ├── ScheduleAdapter.enqueue(spec)      // future
        ├── DeliveryAdapter.send(versionId)    // future
        └── InsightAdapter.summarize(versionId)// future IA-001
```

Phase 1 ships adapters as **no-op interfaces / documented events only**.

---

## Testing expectations (post-Implement)

1. Unit: each Report Engine total math with fixtures  
2. Contract: ReportingService never calls mutation repositories (lint boundary / dependency rule)  
3. Integration: generate → vault version increments  
4. Regression: accounting create payment still works with reporting module present  

No Implement work until Approve.
