# 06 — Performance

**Package:** FIN-001  
**Status:** Design ✔ · Document ✔ · Approve Pending · Implement Blocked

---

## Goal

Property managers generate professional monthly reports in **under 60 seconds** at Design Partner scale **without slowing accounting workflows**.

---

## Principles

| Principle | Design |
| --- | --- |
| Lazy loading | Reports page loads card metadata first; property lists and saved counts fetch async |
| Async generation | PDF build runs as a job — UI never blocks the whole app shell |
| Background job | Worker/queue-ready shape even if Phase 1 uses in-process async |
| Progress | User sees generating state + stage (fetch → compose → render → vault) |
| Cached PDFs | Fingerprint hit returns existing vault artifact |
| Isolation | Reporting queries use read-only paths; no long locks on money tables |
| No accounting slowdown | Report jobs must not contend with payment posting hot paths |

---

## Generation budget (targets)

| Scale (guidance) | Target wall time |
| --- | --- |
| Single property, ≤ 50 units, one month | ≤ 60s end-to-end including vault |
| Preview model only (no PDF) | ≤ 5s typical |
| Cache hit download | ≤ 2s to signed URL |

Targets are acceptance goals for post-Implement Design Partner cohorts ([RC-001](../52-rc-001-beta-readiness/README.md)), not SLAs for enterprise portfolios.

---

## Caching

```
Request (type + property + period + options)
        ↓
Compute sourceFingerprint
        ↓
Cache index hit + policy allows?
   yes → return existing vault version (status: cached)
   no  → run Report Engine → PDF → vault vN+1 → index fingerprint
```

Invalidation: natural via fingerprint when underlying `updated_at` / activity watermarks change. No need to wipe accounting caches.

Optional: short-lived in-memory preview cache per user session — never a substitute for vault versions.

---

## Async job & progress

Stages for progress UI:

1. `fetching_data`  
2. `building_model`  
3. `rendering_pdf`  
4. `saving_vault`  
5. `complete`

Percent optional; stage label required.

---

## Retry

| Failure class | Retry |
| --- | --- |
| Transient render / storage | Automatic limited retries (e.g. 2) with backoff |
| Validation / auth | No retry — fix input |
| Timeout | User-visible retry; job marked failed |

Retries must be **idempotent** with respect to vault: either reuse in-progress job id or allocate new version only after successful PDF bytes exist.

---

## Query hygiene

- Prefer scoped selects by `organization_id` + `property_id` + date range  
- Avoid full-table scans of payments/expenses  
- Aggregation in Report Engine or SQL views — document chosen approach at Implement  
- Do not run report generation inside accounting mutation transactions  

---

## Future queue support

Phase 1 may implement jobs with a minimal store + async function. Contract must allow swap to a real queue later:

```
ReportingJob {
  id, organizationId, reportType, input, status,
  attempts, nextAttemptAt, lastError, resultRef
}
```

Scheduled monthly generation ([07](./07-future-roadmap.md)) enqueues the same job type.

---

## UX performance

- Skeleton states on first paint  
- Disable double-submit on Generate  
- Allow navigating away while job runs; return via job id / notifications later (notification optional Phase 1)  
- Large version lists paginate  

---

## Explicit non-requirements (Phase 1)

- Multi-region render farms  
- Pre-warming all properties every night  
- Real-time collaborative editing of reports  
- Sub-second PDF for 500+ unit properties  
