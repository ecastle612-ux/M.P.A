# Final Pre-Marketing Readiness — P1-08 / P1-09 / P1-10

**Status:** Design / audit — awaiting Product Owner approval  
**Date:** 2026-08-17  
**Gate:** Design → Document → Approve → Implement. This record is Document only.  
**Authority:** [docs/178](../178-customer-launch-readiness-audit/index.md) · [docs/179](../179-pre-marketing-p1-cleanup/index.md)  
**Scope:** P1-08 Privacy/Terms · P1-09 SaaS Stripe Price env gate · P1-10 maintenance in-app notifications  

**Not in scope / not done this turn:** Production deploy or mutation · Stripe Price create/change · tenant rent/card pay · M5 · FIN-OPS money · July reopen · SKU/price change · customer email · Production invitations or work orders · invented legal representations

P1-01 through P1-07 remain **CLOSED**. This audit found no concrete regression that reopens them.

---

## 1. Overall verdict

Pre-marketing is **not closed**. Two items still need Owner decisions before any implement. One item is fully designed and ready to implement after this package is Approved.

| ID | Classification | Why |
|----|----------------|-----|
| **P1-08** | **OWNER DECISION REQUIRED** | Production `/privacy` and `/terms` are 404. No legal copy exists. Page shell is designable; publishing text without Owner/legal fields would invent representations. |
| **P1-09** | **READY TO IMPLEMENT** | Six base SaaS Prices are live at approved amounts. The early Checkout gate still keys off PM + unit-block only, so FO/Complete incorrectly depend on PM env vars. Fix is a per-quote fail-closed check. Do not create or change Stripe Prices. |
| **P1-10** | **OWNER DECISION REQUIRED** | Production `maintenance_notifications` is still **absent**. Runtime already soft-skips in-app WO rows. Do not invent a fourth domain. Owner must approve applying the **already-designed** table (not a new model). |

No new P0. No new P1 beyond these three. P2 items in docs/178 stay P2.

**Another design approval is necessary:** Owner must **Approve this document** before any implement. P1-08 also needs the legal-field answers in §3. P1-10 does **not** need a new ADR if Owner accepts “apply existing designed object.” Routing work-order events into `comms_notifications` would need a new Approve (ADR-029) and is **not** recommended.

**Exact next action:** Product Owner Approves `docs/180` and returns the P1-08 fields in §3. Then one implement package may proceed (slices in §8). Until then: **STOP. Do not implement. Do not deploy.**

---

## 2. P1-08 — Privacy Policy + Terms

### Production / repository truth

| Check | Result |
|-------|--------|
| `GET https://www.my-property-assistant.com/privacy` | **404** (reconfirmed 2026-08-17) |
| `GET https://www.my-property-assistant.com/terms` | **404** (reconfirmed 2026-08-17) |
| Routes under `apps/web/src/app` | No `/privacy` or `/terms` |
| Marketing footer (`marketing-chrome.tsx`) | Home, Live Demo, Explore Platforms, Pricing, Get Started, Enterprise, Sign In. **No Privacy/Terms links** (also no dead links). |
| Header / mobile nav | Same public nav. No legal links. |
| Confirm Plan (`/checkout`) | Quote + pay CTA. **No Privacy/Terms links. No consent checkbox.** |
| Login / Auth chrome | No legal links. |
| Invitation / account-create flows | No legal-page references. |
| Stripe Checkout | Stripe’s own terms only. |
| Existing Privacy/Terms copy in repo | **None** (no customer-facing policy text). `session-privacy.ts` is checkout-session payload minimization, not a legal page. |

### Public identity already displayed (do not invent more)

- Product: **My Property Assistant** / **M.P.A.**
- Site: `https://www.my-property-assistant.com`
- Products: Property Manager, Facility Operations, Complete Platform
- Enterprise contact already public: `enterprise@my-property-assistant.com`
- Transactional From already in use: `My Property Assistant <noreply@my-property-assistant.com>` (docs/176)
- No public legal entity name, mailing address, or phone in the product

### Third parties materially used (factual)

| Service | Role in the live product |
|---------|--------------------------|
| Stripe | SaaS Checkout and SaaS subscriptions only. Tenant rent/card execution is **off**. |
| Supabase | Authentication and application data |
| Resend | Transactional application email |
| Vercel | Hosting |
| SignWell | Optional e-sign |

Not provided: SMS, Web Push, native push, cookie-consent banner, public DPA, SOC 2 / GDPR / CCPA certification claims.

### Designed public pages (after Owner text)

- Routes: `/privacy` and `/terms` under `(marketing)`, wrapped in existing `MarketingChrome`.
- Unauthenticated. Mobile responsive. Canopy tokens only (forest teal `#0F6B56`, ink `#12151A`, mist grey).
- Footer links: Privacy · Terms (marketing chrome). After pages exist, also link from Confirm Plan and Auth chrome. **Do not add an “I agree” checkbox unless Owner requires it** (that is a legal choice).
- No `/legal` hub unless Owner asks. No lorem ipsum. No invented address, phone, entity, retention, certification, guarantee, or regulatory claim.
- Do not claim tenant card pay, M5, Customer Portal, Web Push, SMS, or other unshipped capability.

### A. Language safely derivable from the product

May appear only after Owner Approves this package (Owner may edit):

- M.P.A. is a hosted property-operations web application at the site above.
- Customers create an account after SaaS Checkout, then Guided Setup, then Mission Control.
- We process account identifiers (email/username), organization and membership data, and operational records the customer enters (properties, units, residents, work orders, documents, communications, operational finance records).
- SaaS subscription payments are processed by Stripe. M.P.A. does not store full card numbers.
- Authentication and data hosting use Supabase. Transactional mail uses Resend. Pages are served from Vercel. Optional e-sign may use SignWell.
- Session/auth cookies are required to operate the signed-in product.
- We do not offer SMS, Web Push, or native push.
- Tenant rent card collection is not enabled.
- Enterprise inquiries: `enterprise@my-property-assistant.com`.
- Transactional mail may come from `noreply@my-property-assistant.com`.

### B. Fields that must not be invented

See §3. Until Owner answers, **do not publish** Privacy or Terms pages.

**docs/178 smallest fix remains correct in intent** (Owner-approved pages + footer/Checkout links). Content is still an Owner/counsel task.

---

## 3. Exact Owner / legal decisions required (P1-08)

Return answers. Blank means “do not publish that claim.”

1. **Legal entity name** (who the contract is with).
2. **Registered / mailing address** (or explicit “no public address”).
3. **Privacy contact email** (or confirm `enterprise@my-property-assistant.com`).
4. **Support / deletion-request contact**.
5. **Governing law and venue**.
6. **Effective date**.
7. **Retention periods** (or “retain while the account is active; delete on Owner-approved request”).
8. **Regulatory assertions** — default **none** (no GDPR/CCPA/SOC 2/HIPAA/DPA unless Owner supplies counsel-approved text).
9. **Refund / cancellation legal wording** beyond in-app cancel-at-period-end.
10. **Children / COPPA age** (or omit).
11. **International transfer wording** (or omit).
12. **Cookie banner** — default **none** (not in the product today).
13. **Confirm Plan “I agree” checkbox** — default **links only**, no checkbox.
14. Approve or edit section A before publish.

---

## 4. P1-09 — SaaS Stripe Price env readiness

SaaS subscriptions only. **Not** tenant rent/card execution.

### Contract already in repo

Authoritative map: `packages/shared/src/commercial/unit-volume-stripe.ts` (`UNIT_VOLUME_PRICE_ENV_KEYS`).

Public catalog display keys: `SAAS_DISPLAY_PRICE_ENV_KEYS` in `packages/shared/src/commercial/saas-checkout.ts` (same six base names).

Later fail-closed path already exists: `validateQuoteForCheckout` → `resolveCheckoutLineItems` returns `missingEnvKey` for the **selected** module/cycle, and adds unit-block only when `additional_blocks > 0` (`UNIT_BLOCK_SIZE` = 500).

### The remaining bug

`unitVolumeCheckoutReadyEnvKeys()` returns only:

- `STRIPE_PRICE_PM_BASE_MONTHLY`
- `STRIPE_PRICE_PM_BASE_ANNUAL`
- `STRIPE_PRICE_UNIT_BLOCK_MONTHLY`
- `STRIPE_PRICE_UNIT_BLOCK_ANNUAL`

`isUnitVolumeCheckoutReady()` requires `STRIPE_SECRET_KEY` plus those four.

`POST /api/commerce/checkout` and `createUnitVolumeCheckoutSession` 503 **before** the per-quote resolver if that global gate fails, with a **PM/unit-block-keyed** message.

So FO or Complete Checkout **depends on PM Price env vars**. Owner forbade that.

**docs/178’s “add FO+Complete to the global list” is superseded.** A global list that includes every key would make PM depend on FO/Complete and still make FO depend on PM. The smallest correct fix is **per-quote**.

### Designed gate (smallest)

For a given server quote, require:

1. `STRIPE_SECRET_KEY`
2. `basePriceEnvKeyForModule(module, cycle)` for **that** product and cycle
3. `unitBlockPriceEnvKey(cycle)` **only if** `additional_blocks > 0`

Fail closed with that key’s name. Do not require PM keys for FO/Complete. Do not require FO/Complete keys for PM. Do not create or change Stripe Prices. Do not change public amounts (PM $59 / FO $59 / Complete $109 monthly; annual remains the approved 20%).

Admin helper `isSaasCheckoutReady()` may keep historical PM PROFESSIONAL keys for Master Admin only. Customer Checkout must not use it.

---

## 5. Exact env variable names and PRESENT / MISSING

Never expose values. Vercel MCP was not authenticated this turn — dashboard env was **not** listed. Production inference is from the public catalog only.

`GET https://www.my-property-assistant.com/api/commerce/catalog-prices` returned `status: "ready"` with all six SKU×cycle slots at approved amounts. That route retrieves Stripe Prices via `STRIPE_SECRET_KEY` + the six display env keys.

| Env variable | Role | Production this turn |
|--------------|------|----------------------|
| `STRIPE_SECRET_KEY` | SaaS Stripe API | **PRESENT** (inferred: catalog retrieve succeeded). Value not exposed. |
| `STRIPE_PRICE_PM_BASE_MONTHLY` | PM monthly ($59) | **PRESENT** |
| `STRIPE_PRICE_PM_BASE_ANNUAL` | PM annual ($566.40) | **PRESENT** |
| `STRIPE_PRICE_FO_PROFESSIONAL_MONTHLY` | FO monthly ($59) | **PRESENT** |
| `STRIPE_PRICE_FO_PROFESSIONAL_ANNUAL` | FO annual ($566.40) | **PRESENT** |
| `STRIPE_PRICE_COMPLETE_BASE_MONTHLY` | Complete monthly ($109) | **PRESENT** |
| `STRIPE_PRICE_COMPLETE_BASE_ANNUAL` | Complete annual ($1,046.40) | **PRESENT** |
| `STRIPE_PRICE_UNIT_BLOCK_MONTHLY` | Extra 500-unit block monthly ($39) | **NOT VERIFIED** (not in public catalog) |
| `STRIPE_PRICE_UNIT_BLOCK_ANNUAL` | Extra 500-unit block annual | **NOT VERIFIED** |
| `STRIPE_SAAS_WEBHOOK_SECRET` | SaaS webhook (not a Price) | **NOT VERIFIED** this turn |

Not required for customer unit-volume Checkout: `STRIPE_PRICE_PM_PROFESSIONAL_*`, `STRIPE_PRICE_PM_BUSINESS_*`, `STRIPE_PRICE_COMPLETE_PROFESSIONAL_*`.

Historical note only (not a live reconfirm): docs/69 recorded all eight Prices present in an earlier release.

Quotes with `managed_units <= 500` do not need unit-block Prices. The current global gate still demands those keys for every Checkout, including FO/Complete with zero extra blocks.

---

## 6. P1-10 — Maintenance in-app notifications

### Production truth (read-only `mpa-prod` / `vahnmcrpnuggxkivynvo`, 2026-08-17)

| Object | State |
|--------|--------|
| `maintenance_notifications` | **ABSENT** (confirms docs/176 and ADR-029) |
| `comms_notifications` | Present, 6 rows, RLS on |
| `financial_notifications` | Present, 1 row, RLS on |
| `notification_preferences` | Present, 1 row |
| `in_app_notifications` | Present, 19 rows — **not referenced by current app code** (legacy; do not adopt) |
| `maintenance_work_orders` | Present, 33 rows |
| `maintenance_work_order_updates` | Present, 43 rows |

### Designed migrations already in repo (do not invent a new table)

| File | What it designed |
|------|------------------|
| `supabase/migrations/20260806110000_launch_001_j6_maintenance.sql` | `maintenance_notifications` + RLS select/insert |
| `supabase/migrations/20260806200000_launch_001_promise_remediation_documents_comms.sql` | `comms_notifications` (`message_id` FK to `comms_messages`, nullable) + maintenance update-own policy |
| `supabase/migrations/20260811190000_stab_sprint5_observability_notifications.sql` | `channel`, `email_delivery_status`, provider id/error/attempted_at |
| `supabase/migrations/20260814160000_plat_002_authorization_hardening.sql` | Tightens insert policy. **Does not create the table.** PLAT-002 declined to replay J6. |

**Do not replay full J6 in Production.** Work-order tables already exist. STAB-007 `ALTER`s fail if the notifications table is missing (the current Production state).

### Runtime today

`notifyLifecycle` (`apps/web/src/lib/maintenance/lifecycle-notify.ts`):

- Called after authorized work-order writes (`maintenance-service.ts`: create / assign / progress / cancel / close, including FO).
- In-app insert when `notification_preferences.in_app` is on.
- Missing table (`42P01` / `PGRST205` / schema-cache text) → soft-skip in-app (`ADR-029`). Other insert errors still throw.
- Email only when `emailCritical` **and** user email preference. Critical keys: assigned, vendor.assigned, started, completed, closed, cancelled, emergency.
- Email via Resend; idempotency `maintenance:{key}:{userId}:{workOrderId}`.
- Email failure updates the in-app row **if it exists** and **does not roll back** the work-order mutation.
- No Web Push. No native push. No SMS.

Notification Center (`listUnifiedNotifications`) unions finance + maintenance + comms, org+user scoped. Missing maintenance table → that query errors; `data ?? []` yields no WO rows. Finance/comms still show. Mark-read uses `maintenance:` prefix.

In-app rows have **no unique** `(organization_id, user_id, work_order_id, notification_key)` in the designed table. Duplicate inserts are possible if notify runs twice. Email is the idempotent channel today.

### Why not reuse another domain

| Candidate | Verdict |
|-----------|---------|
| `comms_notifications` | Comms-specific (`message_id` → `comms_messages`). ADR-029: routing WO events here needs a **separate Approve**. Not the smallest path. |
| `financial_notifications` | Finance domain. Do not stretch. |
| `in_app_notifications` | Legacy, unused by current code. Do not revive. |
| New fourth table | Forbidden unless existing models cannot represent the event. They can: the designed `maintenance_notifications` object already matches the writer and the Notification Center. |

---

## 7. Recommended notification architecture

Keep the **three-source Notification Center** (finance / maintenance / comms).

Apply the **already-designed** `maintenance_notifications` end state:

- Columns = J6 + STAB-007
- RLS on; select own user (managers may select org rows per existing policy); insert per current PLAT-002 policy; update-own for mark-read / email status
- Org + user isolation on every read/write
- Preference-gated email after the work-order write
- Provider failure must not roll back the mutation (already true)
- No push. No SMS.

**Smallest Production apply vehicle:** one **additive** migration that `CREATE TABLE IF NOT EXISTS` the designed end-state table, indexes, RLS, and current policies. Do not replay J6 work-order DDL. Do not add new columns beyond J6+STAB-007 unless Owner also wants a unique idempotency index (optional; see §8).

---

## 8. Smallest implementation slices

Authorize only after this document is Approved. One implement package, three slices.

### Slice A — P1-08 (blocked on §3 answers)

1. `(marketing)/privacy/page.tsx` and `(marketing)/terms/page.tsx` using `MarketingChrome`.
2. Footer links. Confirm Plan + Auth chrome text links.
3. Publish **only** Owner-approved wording. No placeholders.

### Slice B — P1-09 (ready after Approve)

1. Replace the customer Checkout global PM+block gate with `requiredUnitVolumePriceEnvKeysForQuote(quote)`.
2. 503 message names the **missing key for that quote**.
3. Leave admin `isSaasCheckoutReady` out of the customer path.
4. No Stripe Price create/change. No SKU/amount change.

### Slice C — P1-10 (blocked on Owner apply decision)

1. Additive migration for the designed table end state only.
2. Optional Owner add: `UNIQUE (organization_id, user_id, work_order_id, notification_key)` — not in J6; recommend yes for idempotency; default **omit** if Owner wants zero schema delta beyond designed columns.
3. No Production work-order or email from the implement turn.
4. Production apply is a separate Owner/ops step after merge (same pattern as tenant-lifecycle certs). No deploy from this design record.

---

## 9. Tests required (when implementing)

**P1-08**

- Unauthenticated `GET /privacy` and `GET /terms` return 200.
- Marketing footer (and Confirm Plan / Auth chrome) contain the links.
- Copy fixture equals Owner-approved text (no invented entity/address/cert).

**P1-09**

- FO monthly Checkout ready when only FO monthly + secret key are set (PM keys unset; unit-block unset; `additional_blocks = 0`).
- Complete annual same pattern.
- PM does not require FO/Complete keys.
- Selected cycle missing → fail closed with that env name.
- `additional_blocks > 0` and unit-block key missing → fail closed with `STRIPE_PRICE_UNIT_BLOCK_*`.
- Existing `validateQuoteForCheckout` / line-item tests stay green.
- No test may create or mutate live Stripe Prices.

**P1-10**

- Existing `lifecycle-notify` missing-table soft-skip stays green.
- When table exists: in-app insert; Notification Center returns the row; mark-read scoped to org+user.
- Email failure does not throw to the work-order caller.
- RLS: user A cannot read user B’s row.
- No Production invitation/work-order/email in tests.

---

## 10. Other P0 / P1 from this audit

None.

- Notification Center empty maintenance query is the designed ADR-029 soft-skip, not a new P1.
- `RESEND_FROM_EMAIL` optional fallback remains P2-09 (docs/176 / docs/178).
- Do not reopen P1-01–P1-07 without a new regression.

---

## 11. Classification summary + next action

| ID | Classification |
|----|----------------|
| P1-08 | **OWNER DECISION REQUIRED** |
| P1-09 | **READY TO IMPLEMENT** (after this package is Approved) |
| P1-10 | **OWNER DECISION REQUIRED** |

**Another design approval:** **Yes** — Approve this document. No new ADR if P1-10 is “apply existing designed table.”

**Exact next action:** Product Owner Approves `docs/180`, answers §3, and confirms P1-10 = apply existing `maintenance_notifications` (additive migration; no new domain). Then authorize one implement turn for slices A–C. Until then, stop.
