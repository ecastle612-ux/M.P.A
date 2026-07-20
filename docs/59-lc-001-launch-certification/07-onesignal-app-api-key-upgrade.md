# LC-001G — OneSignal App API Key Upgrade

**Date:** 2026-07-18  
**Scope:** `onesignal-provider.ts` only (+ tests / `.env.example` docs). No NotificationService or architecture changes.

## Why we got HTTP 403

Two separate issues stacked:

1. **Wrong credential type in env** — `ONESIGNAL_API_KEY` was a short legacy-style value (not `os_v2_app_…`). OneSignal’s dashboard no longer issues legacy REST keys; current **App API Keys** start with `os_v2_app_`.
2. **Wrong health endpoint** — `health()` called `GET /apps/{app_id}`. That endpoint requires an **Organization API key**, not an App API key. A *valid* App API Key still returns **403 Access denied** on that route.

Auth header scheme `Authorization: Key <secret>` was already correct for the current API; the key value and health probe were not.

## What changed

| Area | Before | After |
| --- | --- | --- |
| Key validation | Any non-empty string | Requires `os_v2_app_` prefix for send/health |
| Env aliases | `ONESIGNAL_API_KEY` only | Also accepts `ONESIGNAL_REST_API_KEY` |
| App ID fallback | `ONESIGNAL_APP_ID` only | Falls back to `NEXT_PUBLIC_ONESIGNAL_APP_ID` on server |
| Health probe | `GET /apps/{id}` (org-scoped → 403) | `GET /notifications?app_id=…&limit=1` (app-scoped) |
| Send payload | No `target_channel` | Adds `target_channel: "push"` + `idempotency_key` |
| Error formatting | String errors only | Formats string / array / object `errors` |
| Empty audience | Treated as success if HTTP 200 | `skipped` / `no_recipients` when 200 without `id` |
| Client registration | Unchanged passthrough | Unchanged |

**Unchanged boundaries:** `NotificationProvider` contract, `NotificationService`, device POST flow, Web SDK `OneSignal.init` path.

## Verification

| Gate | Result |
| --- | --- |
| Unit tests (`onesignal-provider` + preferences) | Pass |
| ESLint (touched files) | Pass |
| `tsc --noEmit` | Pass |
| `next build` | Pass |

### Unit tests
`onesignal-provider.test.ts` covers:
- Legacy key rejection
- Health uses `/notifications` not `/apps`
- Send uses `Key os_v2_app_…` + `target_channel: push`
- `registerDevice` passthrough

### Live env (at upgrade time)
`.env.local` still contained a non-`os_v2_app_` key → health correctly fails with format guidance until the dashboard App API Key is pasted into `ONESIGNAL_API_KEY`.

Live health result after upgrade (before key rotation):

```json
{
  "ok": false,
  "detail": "ONESIGNAL_API_KEY is not a current App API Key (expected prefix os_v2_app_). Legacy REST keys and Key IDs are rejected by OneSignal."
}
```

This is expected until `ONESIGNAL_API_KEY=os_v2_app_…` is set. Browser registration code path was not changed.

### Operator steps to clear 403
1. OneSignal dashboard → **Settings → Keys & IDs → Add Key**
2. Copy the value starting with `os_v2_app_` (shown once)
3. Set in `apps/web/.env.local`:
   - `NOTIFICATION_PROVIDER=onesignal`
   - `ONESIGNAL_APP_ID=<uuid>`
   - `ONESIGNAL_API_KEY=os_v2_app_…`
   - `NEXT_PUBLIC_ONESIGNAL_APP_ID=<same uuid>`
4. Restart `next dev`
5. Re-run provider health / send a test notification

## Files

- `apps/web/src/lib/integrations/notifications/onesignal-provider.ts`
- `apps/web/src/lib/integrations/notifications/onesignal-provider.test.ts`
- `apps/web/.env.example`
- `docs/59-lc-001-launch-certification/07-onesignal-app-api-key-upgrade.md`
