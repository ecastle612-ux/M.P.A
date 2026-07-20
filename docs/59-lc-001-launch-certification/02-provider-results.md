# Provider Results

## Stripe

| Check | Status |
| --- | --- |
| Sandbox configured | **BLOCKED** |
| Resident payment | Not run |
| Webhook / receipt / ledger / refund / duplicate / failure | Not run (noop paths still unit-covered from PT-001) |

**Recovery:** Set `PAYMENT_PROVIDER=stripe`, `STRIPE_SECRET_KEY=sk_test_…`, `STRIPE_WEBHOOK_SECRET=whsec_…`, `STRIPE_MODE=sandbox`.

## OneSignal

| Check | Status |
| --- | --- |
| Credentials in env | **PASS** |
| API authentication | **FAIL** (HTTP 403) |
| Registration / permission / announcement / maintenance / resident / manager push | **BLOCKED** until API key valid |
| Failure path | Coded (returns `failed` + message) |

**Recovery:** Replace `ONESIGNAL_API_KEY` with a valid **REST API Key** for app `58dfaa1d-…` in the OneSignal dashboard. Re-run `pnpm launch:certify`.

## Dropbox Sign

| Check | Status |
| --- | --- |
| Sandbox configured | **BLOCKED** |
| Lease generate / send / sign / webhook / vault / activation | Not run |

**Recovery:** `SIGNATURE_PROVIDER=dropbox_sign` + sandbox API key + webhook secret.

## Checkr

| Check | Status |
| --- | --- |
| Sandbox configured | **BLOCKED** |
| Consent / submit / webhook / approve / reject / conditional / retry | Not run (noop createOrder still works) |

**Recovery:** `SCREENING_PROVIDER=checkr` + sandbox API key + webhook secret.

## Supabase Auth

| Check | Status |
| --- | --- |
| Health (GoTrue) | **PASS** |
| Email auth enabled | **PASS** |
| Signup/login/logout/reset/invite/session/role UI | **WARN** (manual / not fully automated) |

## Supabase Storage

| Check | Status |
| --- | --- |
| `media-private` bucket | **PASS** |
| Upload PDF | **PASS** |
| Signed URL | **PASS** |
| Delete / recovery | **PASS** |
| Profile/maintenance variants E2E via app UI | Not separately screenshot-certified this run |
