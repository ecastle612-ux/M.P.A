# Administrator Guide

**RC-001 · Environment & provider setup**

## 1. Environment

Copy `apps/web/.env.example` → `apps/web/.env.local` (never commit secrets).

Required:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=
```

## 2. Provider switches (Design Partner sandbox)

| Concern | Env | Sandbox value |
|---------|-----|---------------|
| Notifications | `NOTIFICATION_PROVIDER` | `noop` or `onesignal` |
| Screening | `SCREENING_PROVIDER` | `noop` or `checkr` |
| Signatures | `SIGNATURE_PROVIDER` | `noop` or `dropbox_sign` |
| Payments | `PAYMENT_PROVIDER` | `noop` or `stripe` |

### Checkr

```
CHECKR_API_KEY=
CHECKR_WEBHOOK_SECRET=
CHECKR_MODE=sandbox
CHECKR_ALLOW_SIMULATE=false   # true only in CI/dev
```

### Dropbox Sign

```
DROPBOX_SIGN_API_KEY=
DROPBOX_SIGN_WEBHOOK_SECRET=
DROPBOX_SIGN_MODE=sandbox
DROPBOX_SIGN_ALLOW_SIMULATE=false
```

### Stripe

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=
STRIPE_MODE=sandbox
STRIPE_ALLOW_SIMULATE=false
```

### OneSignal (optional)

```
ONESIGNAL_APP_ID=
ONESIGNAL_API_KEY=
NEXT_PUBLIC_ONESIGNAL_APP_ID=
```

## 3. Webhooks

Point provider dashboards to:

- `{APP_URL}/api/webhooks/screening/checkr`  
- `{APP_URL}/api/webhooks/signature/dropbox_sign`  
- `{APP_URL}/api/webhooks/payments/stripe`  

## 4. Roles

| Role | Use |
|------|-----|
| property_manager | Day-to-day ops |
| property_owner | Read financials (portal shell — limited) |
| tenant | Resident portal |
| vendor | Portal shell — manage vendors in PM app |

## 5. Pre-flight

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
pnpm qa:e2e:smoke   # with QA_E2E_AUTH_ENABLED=true after seed
```

## 6. Security hygiene

- Never paste secrets into chat  
- Rotate keys if exposed  
- Disable all `*_ALLOW_SIMULATE` outside local/CI  
- Confirm RLS remains enabled
