# 08 — Security and Secrets

**Package:** API-001  
**Status:** Draft — awaiting Approve

---

## Threat model (summary)

| Threat | Mitigation |
|--------|------------|
| REST API key leaked to browser | Server-only env; never `NEXT_PUBLIC_` for secrets |
| Cross-org push | Always tag + filter by `organization_id`; resolve recipients server-side |
| Privilege escalation via device registration | Authenticated user can only register devices for self |
| Replay / spam | Idempotency keys; rate limits on notify + register |
| Quiet hours bypass abuse | Only `emergency` priority/category bypasses; audited |
| Secret in git | `.env*` gitignore; document names in `.env.example` without values |

---

## Environment variables (design — do not add until Implement)

| Variable | Scope | Required | Notes |
|----------|-------|----------|-------|
| `ONESIGNAL_APP_ID` | Server (+ optionally public SDK init) | Yes for onesignal provider | App identifier |
| `ONESIGNAL_API_KEY` | **Server only** | Yes for onesignal provider | REST key — never expose |
| `ONESIGNAL_USER_AUTH_KEY` | **Server only** | Optional | Only if SDK/API flows require it |
| `NOTIFICATION_PROVIDER` | Server | Yes | `noop` \| `onesignal` \| future |
| `NEXT_PUBLIC_ONESIGNAL_APP_ID` | Client | Optional | **Only** App ID if required by Web SDK; never API keys |

**Rules:**

- Prompt operators at implement time if missing; never hardcode.
- Document additions in `.env.example` / `apps/web/.env.example` as empty placeholders.
- Do **not** commit `.env.local` or real credentials.
- CI uses `NOTIFICATION_PROVIDER=noop` without OneSignal secrets.

---

## Secret storage

| Environment | Storage |
|-------------|---------|
| Local dev | `.env.local` (gitignored) |
| Preview / production | Host secret manager / platform env (Vercel/Supabase secrets as applicable) |
| Edge Functions (if used) | Function secrets — same names |

Rotation: replace API key in host secrets → restart/redeploy → revoke old key in OneSignal dashboard.

---

## Server-only credentials

Allowed to read `ONESIGNAL_API_KEY`:

- Notification OneSignal provider module
- Optional webhook verification handler
- Ops health check (existence / masked connectivity — never log full key)

Forbidden:

- Client components, shared browser bundles
- Storybook / public config dumps
- Error messages returned to clients

---

## Client registration & token lifecycle

```
User enables push
  → Browser permission
  → OneSignal Web SDK creates subscription
  → Client sends subscription id to M.P.A. API (session auth)
  → Server upserts resident_devices (external id, platform, property)
```

| Lifecycle event | Behavior |
|-----------------|----------|
| Register | Upsert active device for `(org, user, property/platform)` policy |
| Refresh | Update external id if SDK rotates |
| Disable push preference | Skip sends; optionally call provider unregister |
| Logout / revoke | Mark device inactive; unregister when possible |
| Stale device | Provider failure `invalid` → `is_active=false` |

External subscription IDs are **not** secrets equivalent to API keys but are treated as sensitive identifiers (no public listing).

---

## Least privilege

- OneSignal API key should be restricted to the single M.P.A. app.
- Sends target explicit subscription IDs or external user ids mapped from M.P.A. users — avoid org-wide “All” blasts from application code.
- Emergency audience still computed from announcement targeting rules, not provider segments alone.
- Service role DB access only inside trusted server paths already used by the app.

---

## Webhooks (optional)

If delivery webhooks are enabled:

- Verify signatures / secrets server-side.
- Idempotent processing.
- Update delivery status only; never trust webhook to create arbitrary notifications for other users.

---

## Audit

Log (structured, redacted):

- `notification_id`, `organization_id`, `provider`, `status`, `errorCode`
- Do not log full message bodies in production info logs if they may contain PII; prefer ids + category.

---

## Compliance notes

- Honor user push disable except emergency policy documented in 05.
- Retain emergency notification history longer (06).
- No SMS/email in this package — reduces TCPA/CAN-SPAM surface for API-001.
