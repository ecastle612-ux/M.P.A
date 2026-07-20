# Certification Report

**Runner:** `pnpm launch:certify` → `apps/web/scripts/dev/run-launch-certification.ts`  
**Artifact:** [`launch-certification-run.json`](./launch-certification-run.json)

## Checklist results (this run)

| # | Blocker | Result | Notes |
| ---: | --- | --- | --- |
| 1 | Stripe | **BLOCKED** | No `sk_test_` / provider not stripe |
| 2 | OneSignal | **FAIL / BLOCKED** | Env present; API 403; push E2E blocked |
| 3 | Dropbox Sign | **BLOCKED** | No API key |
| 4 | Checkr | **BLOCKED** | No API key |
| 5 | Authentication | **PARTIAL PASS** | Health + email provider on; interactive flows warn |
| 6 | Storage | **PASS** | Bucket, upload, signed URL, delete |
| 7 | Email Deliverability | **BLOCKED** | No outbound provider; invite is DB-only |
| 8 | 100 Unit Simulation | **PASS** | Seeded + timed |

## Summary counts

From `launch-certification-run.json`: **pass=8 · fail=1 · blocked=5 · warn=2** → **NO-GO**

## Code / reliability fixes included in LC-001

- OneSignal `health()` now calls live `GET /apps/{appId}` (no silent “configured = healthy”)
- Data integrity audit uses `maintenance_work_orders` + `occupancy_status` (correct schema)
- Launch certification CLI + docs package
