# BUG-011.1 — Production Database Migration (authorized COM-002 only)

| Field | Value |
|-------|--------|
| Authorization | BUG-011.1 — apply approved COM-002 Production migrations only |
| Result | **FAIL** |
| Date | 2026-08-08 |
| Production project | `https://vahnmcrpnuggxkivynvo.supabase.co` (`vahnmcrpnuggxkivynvo`) |
| Production deploy | `dpl_7jHkUnv6YjVsgd8SqxhpNMabCorz` |
| Production deployment SHA | `cd9a9fb33b45ed6b112427beaa3ef3ddb989e07d` (`origin/main`) |
| Production database schema version | **Unknown** — no Postgres access; `supabase_migrations.schema_migrations` not readable |
| Applied migrations this run | **None** |
| Slice F / Capital Projects / UI redesign | Not started (per authorization) |

## Constraints honored

- Did **not** modify migration files
- Did **not** create replacement tables
- Did **not** hand-patch Production
- Did **not** generate new SQL DDL
- Ready runner uses only approved files in exact order

## Approved apply order (not executed)

| # | File | SHA-256 |
|---|------|---------|
| 1 | `20260806010000_phase1_commercial_subscriptions.sql` | `69d4d8ee38f94bac0c31a4f18df7f77aea953421fd080dd197293c219d238299` |
| 2 | `20260808010000_com_002_slice_c_saas_checkout.sql` | `ef90d1850d91d5d322d1b99f135b844819dee7c80ea4e23fceced32ce9b3db81` |
| 3 | `20260808020000_com_002_slice_d_provisioning.sql` | `481b353efd69edf7e9474428a35d93240f667db9640d16a3cbc2344fa80292c5` |
| 4 | `20260808030000_com_002_slice_e_lifecycle.sql` | `e8151b65355ea7807b60d7398c0a210660b331722d096376f6ef81b5059d798b` |

Runner prepared (no DDL of its own): `scripts/bug-011-apply-com002-migrations.py`

## Pre-apply Production schema audit (anon REST)

| Table | Status |
|-------|--------|
| `product_skus` | **MISSING** (PGRST205) |
| `organization_subscriptions` | **MISSING** (PGRST205) — matches provisioning error |
| `organization_setup_state` | **MISSING** (PGRST205) |
| `platform_operators` | **MISSING** (PGRST205) |
| `saas_checkout_sessions` | **MISSING** (PGRST205) |
| `saas_stripe_webhook_events` | **MISSING** (PGRST205) |
| `provisioning_jobs` | **MISSING** (PGRST205) |
| `saas_customers` | Present (empty) |
| `saas_lifecycle_events` | **MISSING** (PGRST205) |

Indexes / constraints / RLS policies / functions / triggers: **not verified** (requires SQL access).

## Post-migration verifications

| Step | Result |
|------|--------|
| Apply migration 1–4 | **Not run** |
| Verify tables/indexes/constraints/RLS/functions/triggers after each | **Not run** |
| Final Production schema audit | **FAIL** (8/9 required tables missing) |
| Customer journey Landing → Mission Control | **Not re-run** (blocked by missing schema) |
| Master Admin Customer / Org / Subscription / Provisioning Job / Lifecycle | **Not verified** |

Checkout API still returns Stripe session URLs on Production; journey fails later at provisioning without `organization_subscriptions`.

## Remaining blockers

1. **`SUPABASE_DB_URL` not injected** into this Cloud Agent environment.  
   Injected secrets today: Stripe keys only (`STRIPE_SECRET_KEY`, webhook secrets, publishable key).  
   Without the Production Postgres connection string, approved migrations cannot be applied.
2. Optional but useful for post-checks: `SUPABASE_SERVICE_ROLE_KEY` (Master Admin / service reads).
3. `cursor-cloud` `request-environment-setup-actions` is unavailable on this run (tool not found), so the agent cannot prompt secret injection via MCP.
4. Vercel MCP remains `needsAuth` (Desktop OAuth) — not required for SQL apply if `SUPABASE_DB_URL` is present.

## Resume procedure (when `SUPABASE_DB_URL` is available)

```bash
# Inject secret into Cloud Agent environment, then:
python3 scripts/bug-011-apply-com002-migrations.py
```

Then re-probe REST tables, re-run full Production journey with promo `BUG010E2E`, and verify Master Admin rows.

## Verdict

**FAIL** — authorization accepted; migrations not applied; Production schema unchanged; journey not completed.
