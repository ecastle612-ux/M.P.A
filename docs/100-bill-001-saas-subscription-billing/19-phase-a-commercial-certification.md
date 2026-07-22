# 19 — Phase A Commercial Certification Record

**Package:** BILL-001  
**Recorded:** 2026-07-22  
**Verdict:** **PASS** — Phase A commercial foundation certified  
**Phase B:** Unblocked for implementation after this record (Company Billing Center only; no scope creep)

Automated unit tests / typecheck / build are **not** treated as certification. Operator evidence below is authoritative.

---

## Evidence IDs (non-secret)

| Item | Value |
|------|-------|
| Supabase project | `mpa-prod` (`vahnmcrpnuggxkivynvo`) |
| Migration | `bill001_saas_subscription_foundation` applied |
| Stripe live account | `acct_1Tv5Lj8jGrZYUXDt` |
| Stripe test sandbox account | `acct_1Tw3R8CtsRR7lN4Z` (CLI claimable sandbox; badge: Unclaimed sandbox) |
| SaaS webhook (live) | `we_1Tw3Cg8jGrZYUXDtp2lv6gY0` → `https://www.my-property-assistant.com/api/webhooks/saas/stripe` |
| SaaS webhook (test) | `stripe listen` → `localhost:3000/api/webhooks/saas/stripe` (signing secret local-only) |
| Portal configuration (live) | `bpc_1Tw3Hn8jGrZYUXDtwr0bPHQX` |
| A04 cert org | `81132fa3-4a00-40fc-8be7-85a6eeb67506` (PAT Two) |
| A04 Stripe Customer | `cus_UvvdCsvJnBqnio` |
| A04 Checkout Session | `cs_test_a1bB8Spkv27SjfSnR4E3FyLo4EnBSovISSITa8WLN0ldRDIhFsI9PS4hyx` |
| A04 Subscription | `sub_1Tw4haCtsRR7lN4Zg4aNIsVX` (`active`) |
| A04 Invoice | `in_1Tw4hXCtsRR7lN4ZNZVLh0oC` (`paid`, $99.00) |
| A04 test price | `price_1Tw3i4CtsRR7lN4ZJwQgmvCr` (Professional monthly) |
| Prior live cert org | `f8232926-149d-46b3-829f-c84b55378718` / `sub_1Tw3L88…` (`trialing`) |
| Screenshots | [`evidence/`](./evidence/) |
| Git commit | `fb70ba18b9eb17013759f6f1f6ed02c9465072a1` |
| Production deployment | `dpl_9f7S4aFDBqmujVacN46afPMKdAi1` |
| Production aliases | `https://m-p-a-web.vercel.app` · `https://www.my-property-assistant.com` |

---

## Step results

### A01 — Database — **PASS**

Applied `20260722120000_bill001_saas_subscription_foundation.sql` to production.

Verified tables: `saas_customers`, `saas_subscriptions`, `saas_invoices`, `saas_webhook_events`, `saas_audit_events`, `saas_entitlement_snapshots`.  
Capabilities seeded: `saas:read`, `saas:manage`, `saas:admin`.

---

### A02 — Environment — **PASS**

| Variable | Status |
|----------|--------|
| Live SaaS vars on Vercel Production | set (`SAAS_BILLING_PROVIDER=stripe`, price aliases, `STRIPE_SAAS_WEBHOOK_SECRET`) |
| Live local `.env.local` | set (`sk_live` — not used for A04) |
| Test/sandbox keys for A04 | CLI sandbox `rkcs_test_…` / `pk_test_…` via `stripe sandbox create --from-git` |
| Test prices | Created on sandbox account (Founder→Enterprise monthly/annual) |

---

### A03 — Stripe Billing webhook — **PASS**

Live dedicated endpoint registered (separate from payments). Signature verification confirmed.  
Test path certified via `stripe listen` forwarding to local `/api/webhooks/saas/stripe` (200 responses for checkout + subscription + invoice events).

---

### A04 — Hosted Checkout — **PASS**

Completed end-to-end hosted Checkout in **Stripe test mode** (not session-create-only).

| Check | Result |
|-------|--------|
| Test mode keys + test prices | ✔ sandbox `acct_1Tw3R8…` |
| Hosted Checkout page loaded | ✔ Professional $99/mo |
| Payment method entered | ✔ `4242 4242 4242 4242` |
| Checkout completed | ✔ `payment_status=paid`, `status=complete` |
| Customer | ✔ `cus_UvvdCsvJnBqnio` |
| Subscription | ✔ `sub_1Tw4ha…` **active** |
| Invoice | ✔ `in_1Tw4hX…` **paid** $99 |
| Webhooks received | ✔ `checkout.session.completed`, `customer.subscription.created`, `invoice.paid` → HTTP 200 |
| Mirror updated | ✔ `saas_customers` + `saas_subscriptions` (active/professional) |
| Invoice mirrored | ✔ after invoice parent.subscription_details fix + replay |
| Entitlements | ✔ `saas_entitlement_snapshots.plan_code=professional` |
| Audit | ✔ `saas.subscription.upserted`, `saas.invoice.upserted` |

**Negative card scenarios** (session remains `open` / `unpaid`, no subscription):

| Scenario | Card | Session |
|----------|------|---------|
| Decline | `4000000000000002` | `cs_test_a1ew7CDP…` |
| Expired | `4000000000000069` | `cs_test_a1kxNWZT…` |
| Insufficient funds | `4000000000009995` | `cs_test_a1Esx0bL…` |

Evidence: `evidence/a04-success-summary.json`, before/after screenshots, decline summary.

---

### A05 — Mirror — **PASS**

A04 org `81132fa3-…` and prior live org `f8232926-…` both mirrored. Isolation: SaaS path does not write tenant `payments` / `payment_attempts`.

---

### A06 — Customer Portal — **PASS**

Live portal session verified earlier (Professional trial + invoice history). Screenshot captured in prior cert session.

---

### A07 — Webhook synchronization / idempotency — **PASS**

| Trigger | Result |
|---------|--------|
| Subscription upsert from Checkout | processed |
| Invoice paid (replay after API-shape fix) | processed → `saas_invoices` |
| Duplicate event id | `ignored` / `reason=duplicate` |
| Live cancel/resume/fail/paid suite (earlier) | processed |

---

## Quality

| Check | Result |
|-------|--------|
| `pnpm typecheck` | ✔ (Phase A package) |
| `pnpm --filter @mpa/web build` | ✔ (prior + prod build) |
| Committed Phase A sources | ✔ `fb70ba18b9eb17013759f6f1f6ed02c9465072a1` |
| Production deploy from that commit | ✔ `dpl_9f7S4aFDBqmujVacN46afPMKdAi1` |
| Prod route smoke | ✔ `POST /api/webhooks/saas/stripe` → 401 without signature; `GET /api/saas` → 401 without auth |

---

## Code fixes during A04 final cert (not Phase B UI)

- Stripe Checkout Playwright helper: `qa/e2e/scripts/complete-stripe-checkout.mjs`
- Invoice normalization reads `parent.subscription_details.subscription` + org metadata (Stripe Billing API change where root `subscription` is null)
- `rkcs_test_` recognized as test/sandbox secret prefix
- Invoice org-not-found webhook rows marked `failed` (no longer stuck `received`)

---

## Phase B

Phase A commercial certification is **PASS**. Phase B (Company Billing Center) may begin under the approved BILL-001 design package. Do not expand into Master Admin SaaS metrics (Phase D / ADMIN-003).
