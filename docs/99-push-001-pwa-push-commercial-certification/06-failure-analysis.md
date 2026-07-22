# 06 — Failure Analysis (Phase 6)

**Package:** PUSH-001  
**Status:** Draft — awaiting Approve  

---

## Rule

Every failure gets: symptom → root cause → fix → retest evidence.

---

## Failure catalog (seed)

| Failure | Likely root cause | Fix direction |
| --- | --- | --- |
| Permission denied | User/OS blocked | Settings guide; suppression cooldown |
| Expired / invalid subscription | OS cleared push token | Re-register; deactivate dead row |
| Invalid player / subscription id | Stale `external_subscription_id` | Deactivate + re-enroll |
| Network failure | Transient | Retry policy / operator retry (scope in Implement) |
| OneSignal rejection | Bad key, wrong app id, empty audience | Env + dashboard alignment |
| API timeout | Upstream | Timeout/error surfacing in diagnostics |
| Missing service worker | Wrong path/scope / SW conflict | Align dashboard + `client-push` constants |
| Environment mismatch | `noop` provider, preview origin | Production env audit |
| Token mismatch | App id client ≠ server | Unify env |
| Browser limitation | iOS tab, Firefox quirks, etc. | Document + PWA path |
| Relative deep link cold-launch miss | Absolute URL missing | Already mitigated — re-verify |
| Zero recipients | No enrollment | Banner + announcement warning (API-001A) |
| Duplicate notifications | Double `notify` / missing idempotency | Audit event keys |
| Empty title/body | Bad caller payload | Validation in `notify` |

---

## RCA log template

| ID | Device | Symptom | RCA | Fix | Retest | Status |
| --- | --- | --- | --- | --- | --- | --- |
| F-001 | | | | | | Open |

Fill during Implement in `artifacts/failures/`.
