# 199 — Final Public Launch Audit After Tenant Payments

**Status:** **READY FOR PUBLIC MARKETING / FIRST REAL CUSTOMER**  
**Date:** 2026-08-17  
**Authority:** Owner final public-launch audit after [docs/198](../198-property-demo-ach-payment-method-activation-uat/index.md) accepted PASS  
**Mode:** Read-only / non-money. No organization activated. No tenant payment. No SaaS Checkout. No complimentary grant. No Stripe Price or Checkout change. No M5. No July reopen. No global execution flip.

Successor: [docs/200 — Public Rent Collection Marketing](../200-public-rent-collection-marketing/index.md) (in-repo copy; not Production-deployed from that record).

---

## 1. Overall launch verdict

**READY FOR PUBLIC MARKETING / FIRST REAL CUSTOMER**

Not **BLOCKED — FINAL PUBLIC LAUNCH AUDIT**.

docs/194–198 tenant-payment architecture remains technically certified. Production execution is **OFF** everywhere. The binding commercial flow is intact. Eligible Property Manager and Complete residential customers can discover Online Payments after Guided Setup without being forced through Stripe KYC to finish organization setup. Facility Operations–only does not advertise or expose residential rent-payment setup.

This record does **not** activate a real customer.

---

## 2. P0 findings

None.

No finding would prevent a new paying subscriber from completing:

Landing → choose PM / FO / Complete → SaaS subscription → account claim → Guided Setup → Mission Control → normal product use

or, for eligible PM / Complete residential customers, later:

Financial Operations → Online Payments → Connect with Stripe → choose ACH / Cards / Both → Enable Online Payments

---

## 3. P1 findings

None.

Leftover internal roadmap language and Day-1 “record a manual payment” copy are classified **P2**. They do not block the commercial flow, do not contradict public payment claims, and do not hide the certified Online Payments path. Manufacturing them as P1 would invent a launch blocker.

---

## 4. P2 findings

| ID | Finding | Why not P1 |
|----|---------|------------|
| P2-01 | Financial Operations command center still lists `FIN_OPS_SLICES` “Implementation progress,” including **S4 Autopay & Payment Plans Polish — blocked** | Internal slice IDs on an implementation-progress list. AutoPay itself is certified on Online Payments and tenant Billing. Payment-plan polish was never a launch promise. |
| P2-02 | After the first lease, journey / finance-desk first-collect copy is still “Record your first payment” (manual `#record`) | Owner asked not to add Stripe prompts everywhere. Finance desk already has **Open Online Payments**. |
| P2-03 | Global search has Financial Operations / payments, not a dedicated Online Payments hit | Discoverability via sidebar + FO section nav + desk CTA is enough for launch. |
| P2-04 | Guided Setup billing step says “Optional review” but the checkbox is required to finish | Awkward, not a dead end. The next-action hint tells the customer to check the box. |
| P2-05 | Guided Setup does not introduce Online Payments / Stripe Connect | Recommended: finish setup → Mission Control → FO shows Online Payments. Connect is correctly **not** a setup gate. |
| P2-06 | Tenant checkout 503 can mention `STRIPE_SECRET_KEY` if Stripe is unconfigured | Production Stripe is configured. This string does not appear on the normal customer path. |
| P2-07 | Password / reset mail is Supabase-native, not the branded M.P.A. shell | Recoverable. Does not block claim or Guided Setup. |
| P2-08 | PWA offline page says “foundation shell” | Installable PWA surfaces are healthy. Copy polish only. |
| P2-09 | Privacy / Terms still say “operational FIN-OPS” | Certified legal copy. Owner §5 forbids FIN-OPS jargon on the Online Payments customer surface, which does not show it. |
| P2-10 | `/property-manager`, `/facility-operations`, `/complete-platform` are 404 | Public nav uses `/`, `/modules`, `/pricing`. Those vanity paths are not linked. |
| P2-11 | No tenant receipt email pipeline | In-app receipts remain. Not a promised launch email. |
| P2-12 | FO command-center timeline says “late-fee assessment” is live | Means the **manual** late-fee desk. M5 automated assessment remains unauthorized. |

Do **not** implement these from this audit.

---

## 5. Public website status

Live Production HTML `data-dpl-id=dpl_BjW3Qk3EKEXxP8FvmKUWaJzip6nA` (docs/197-certified application SHA `0653b428`).

| Surface | HTTP | Result |
|---------|------|--------|
| `/` Landing | 200 | PM / FO / Complete. “Take rent online with Stripe. Choose bank payments, cards, or both.” Tenants can pay once or authorize AutoPay. Subscriber controls amounts. FAQ **denies** automated late fees, automated collections, instant bank settlement, and staff-enrolled AutoPay. |
| `/pricing` | 200 | PM **$59**/month · FO **$59**/month · Complete **$109**/month. Annual **Save 20%**: PM/FO **$566.40**/year · Complete **$1,046.40**/year. Same rent-online line. |
| Property Manager | via `/` + `/modules` | Rent-online + bank/cards/both. |
| Facility Operations | via `/` + `/modules` | Facility work-order capabilities only. **No** residential rent-collection advertising. |
| Complete Platform | via `/` + `/modules` | Rent-online when operating in residential / property scope. |
| `/get-started` | 200 | Questionnaire → plan. Client-rendered; SSR HTML does not need the marketing needles. |
| `/checkout` | 200 | Confirm Plan / Stripe Checkout entry. Server quote only. |
| `/privacy` | 200 | Bank payments, cards, or both. Tenant funds do not settle to the SaaS account. AutoPay is tenant-authorized. |
| `/terms` | 200 | Same payment truth + approved prices. |
| `/login` | 200 | Sign-in. |
| `/forgot-password` | 200 | Recovery. `/reset-password` also 200. |
| `/enterprise` | 200 | Sales motion only. Not a product or pricing tier. |

Not advertised: free processing, instant ACH, automatic late fees, automated collections / M5, admin-enrolled AutoPay.

Enterprise is not presented as a buyable SKU.

---

## 6. Paid subscriber lifecycle

Code / configuration / safe Production reads. **No subscription was purchased.**

```
SaaS Checkout (server quoteId only)
  → Stripe Checkout (mpa_money_domain=saas_billing)
  → /api/commerce/webhooks/stripe (STRIPE_SAAS_WEBHOOK_SECRET)
  → run-provisioning
  → purchaser claim email → /commerce/continue
  → account create / reuse
  → Guided Setup
  → purchased SKU home
```

| Check | Result |
|-------|--------|
| Client cannot send SKU / Price / amount | `POST /api/commerce/checkout` rejects `productSku`, Price IDs, amounts, trial flags |
| Provisioning SKU | Taken from the SaaS session / job, not the browser |
| Post-setup home | PM → `/pm/mission-control` · FO → `/facility/mission-control` · Complete → `/launcher` |
| Plan change cannot silently swap SKU | `POST /api/commerce/subscription/change-plan` returns **409** |
| Complimentary claim cannot change SKU | `complimentaryClaimLocksSku` |
| SaaS Stripe vs tenant Connect | Separate routes, webhook secrets, and `mpa_money_domain`. Shared platform secret key is expected. Tenant money uses the org Express account |

SKU cannot silently change at checkout, provisioning, or complimentary claim.

---

## 7. Guided Setup status

`apps/web/src/components/commercial/guided-setup-page.tsx`

Steps: organization → purchased product → billing acknowledgment → workspace home → next action (Complete also chooses operating model).

| Check | Result |
|-------|--------|
| Stripe Connect / KYC is a setup step | **No** |
| Finish requires Connect | **No** |
| PM next action | Add first property |
| FO next action | Add first building / facility work — **not** rent setup |
| Complete next action | Open Launcher and add first property |
| Online Payments mentioned in setup | **No** (P2-05; recommended path is after setup) |

A new subscriber can finish Guided Setup and use M.P.A. without Stripe KYC.

---

## 8. Mission Control / navigation

| Audience | Financial Operations | Online Payments |
|----------|----------------------|-----------------|
| Property Manager | Sidebar + Mission Control finance links | FO home desk CTA **Open Online Payments** + section nav |
| Complete + residential / property scope | Same FO entitlement (`pm.financial_operations`) | Same |
| Complete + facility-only scope | Hidden (no residential finance surface) | Hidden |
| Facility Operations–only | Entitlement denied (`excludedSkus` includes `mpa_facility_operations`). Path `/pm/financial-operations` not allowed | Not shown |

No redundant Stripe prompts on Mission Control first-run. First-run CTA is add a property / building, which is correct.

---

## 9. Online Payments discoverability

Recommended Owner path exists and is implemented:

Complete Guided Setup → Mission Control → Financial Operations → **Open Online Payments** → Connect → ACH / Cards / Both → Enable

Customer states implemented: Not connected · Stripe setup incomplete · Ready to enable · Online payments active · Action required.

Accepted methods shown as **Bank account (ACH)** and **Credit/debit cards**. Subscriber can choose ACH only, Cards only, or Both.

Customer payload / Online Payments UI do not show Stripe account IDs, webhook secrets, PaymentIntent IDs, or “FIN-OPS” ledger jargon.

Discoverability gap (P2 only): Day-1 journey still prefers manual “Record your first payment.” The FO desk CTA covers the recommended next action.

---

## 10. Tenant Billing status

Execution is **FALSE** on every organization, including Property Demo.

| With execution OFF (current Production) | Certified |
|----------------------------------------|-----------|
| Balances | Visible |
| History | Visible |
| Receipts | Visible (in-app) |
| Pay Once / AutoPay CTAs | Gated: `tenantOnlinePayAvailable` requires execution **true** + Connect ready + `occupancyAccess === "active"` |
| Checkout / AutoPay start | Fail closed (`stripe_payment_execution_disabled`) — docs/197 / docs/198 |
| Former tenants | History-only (`canPay` only when occupancy is `active`) |

Once an org Enables (not done here; certified in docs/198):

| Subscriber setting | Tenant sees |
|--------------------|-------------|
| ACH only | Bank Account |
| Cards only | Card |
| Both | Both |

AutoPay remains tenant-authorized. Admin AutoPay start is **403**. No admin-enrolled AutoPay.

---

## 11. Complimentary access status

Previously certified Master Admin tester / gift flow is present and has not been mutated by this audit.

| Check | Result |
|-------|--------|
| Master Admin–only API | `GET/POST/PATCH /api/admin/complimentary-access` requires `isPlatformOperatorUser` |
| Claim | `/complimentary/claim` · SKU locked to the grant |
| Welcome email | Branded shell · From `noreply@my-property-assistant.com` · Reply-To **`feedback@my-property-assistant.com`** |
| Tester vs gift | Tester includes feedback ask + expiry; gift does not invent tester copy |
| Paid conversion | `/pricing?from=complimentary` |
| Production grants touched | **None.** One existing active FO tester grant remains. No email sent. |

Do not create another grant from this record.

---

## 12. Security / isolation

| Control | Result |
|---------|--------|
| Org isolation | Active-organization cookie. Cross-org lease checkout 404 (docs/198 Clinic → Property Demo) |
| PM / FO / Complete entitlements | Path + API entitlement maps. FO cannot call `/api/finance/online-payments` |
| Residential vs facility scope | `orgAllowsWorkSurface` / Complete operating scope |
| Complimentary controls | Master Admin / platform operator only |
| Tenant occupancy | Online pay requires `active` |
| Former-tenant | History-only |
| Connect ownership | One Express account per org; Property Demo still `acct_1U5MdJ8DmtuNiZTl` only |
| Accepted-method enforcement | Server 403 before Stripe on disabled method |
| Execution flag | `=== true` required; missing row fail-closed |
| Connect-ready | Enable refuses unless ready |
| SaaS webhook vs FIN-OPS webhook | `STRIPE_SAAS_WEBHOOK_SECRET` vs `STRIPE_WEBHOOK_SECRET` + `STRIPE_CONNECT_WEBHOOK_SECRET`. FIN-OPS verifier never uses the SaaS secret |

No Production mutation.

---

## 13. FIN-OPS / execution state

Compared to docs/198. **No financial write.**

| Check | This audit |
|-------|------------|
| `stripe_payment_execution_enabled` true count | **0** (6 settings rows, all false) |
| Property Demo execution | **FALSE** |
| Property Demo Connect | `acct_1U5MdJ8DmtuNiZTl` · `ready` · charges enabled. ACH capability **kept** from docs/198 |
| Other orgs Connect | `not_started` / no `acct_` |
| AutoPay enrollments | 1 total · **0 active** (docs/193 revoked card) |
| July freeze | `finance_july_freeze_enabled() = true` |
| M5 | `isFinanceM5Authorized() === false` |
| Late-fee policies | active **0** / total **0** |
| Schema tip | `20260817193519` |
| Application | `dpl_BjW3Qk3EKEXxP8FvmKUWaJzip6nA` / SHA `0653b428` |

FIN-OPS totals **unchanged** vs docs/198 / docs/197:

| Metric | Value |
|--------|-------|
| charges | 21 / 24711.70 / paid 11114.54 |
| payments | 14 / 11114.54 |
| allocations | 14 / 11114.54 |
| receipts | 4 |
| ledger | 48 |

SaaS public prices unchanged on Production HTML and in `PUBLIC_PRICING_MODEL_COPY` (PM/FO $59 / $566.40 · Complete $109 / $1,046.40). Stripe Price objects were last certified in docs/198. Stripe MCP was not authenticated this turn; no Price list or write was performed.

---

## 14. PWA / mobile status

| Check | Result |
|-------|--------|
| `/manifest.webmanifest` | 200 · name M.P.A. · `start_url=/dashboard` · `display=standalone` · theme `#0F6B56` |
| `/sw.js` | 200 · cache `mpa-foundation-v3-house-mark-icons` |
| `/offline.html` | 200 |
| Apple | `appleWebApp.capable` · `/icons/mpa-apple-touch.png` 200 |
| Android / install icons | mark 192 / 512 200 · maskable icons in manifest |
| Login / setup / Mission Control / FO / tenant Billing / Online Payments | Existing responsive app routes; no new native project |

Apple Add to Home Screen and Android/Chrome install are **different** flows. Install cards already distinguish them. Do not assume one universal install.

---

## 15. Email status

Template / code inspection only. **No test email sent.**

| Mail | From | Notes |
|------|------|-------|
| SaaS purchaser claim | `My Property Assistant <noreply@my-property-assistant.com>` | Branded shell · `/commerce/continue` |
| Complimentary tester | same From · Reply-To **`feedback@my-property-assistant.com`** | Product headline + claim link |
| Complimentary gift | same From · same Reply-To | No tester-feedback paragraph |
| Password / reset | Supabase-native (P2-07) | |
| Finance transactional | In-app notifications + existing finance mail helpers | No new tenant receipt blast |

Logo shell: `packages/email` branded lockup. Production origin `https://www.my-property-assistant.com`.

---

## 16. Error / empty-state findings

No customer-facing dead end on the launch path.

| Risk | Classification |
|------|----------------|
| Raw `error.message` on some finance fetches | P2 if Stripe/API fails; happy path uses customer labels |
| `STRIPE_SECRET_KEY` in unconfigured checkout 503 | P2-06 |
| Internal env names on configured Production | Not observed |
| UUID / `acct_` on Online Payments customer payload | Absent (docs/198 + current UI) |
| Blank Mission Control | First-run welcome + add-property CTA |
| Misleading disabled pay buttons | Gated off when execution is false; not a fake enabled CTA |
| Stale “coming soon” on FO | FO no-shells tests forbid it |
| Payment claims vs capability | Public + Online Payments copy match certified ACH / cards / both |
| Setup with no next action | Checklist + finish hint present |
| 404 in normal public nav | None. Vanity product slugs (P2-10) are not in the nav |

---

## 17. Exact fixes required

**None required before public marketing or the first real customer.**

Optional later polish (separate Design → Document → Approve if material):

1. Hide customer-facing `FIN_OPS_SLICES` or stop calling S4 “blocked.”
2. Point first-collect journey copy at Online Payments **or** keep manual record and leave the FO desk CTA as the online path (Owner: do not spray Stripe prompts).
3. Drop “Optional” from the required Guided Setup billing checkbox.
4. Replace checkout 503 env-var text with a customer sentence.
5. Brand password-reset mail if Owner wants parity.

Do **not** implement those from this audit.

---

## 18. Whether another design approval is required

**No** — not for public marketing or first-real-customer Enable of one eligible PM / Complete residential organization.

A P2 polish package would restart Design → Document → Approve if it changes customer-facing FO home language or journey CTAs.

Do not treat this audit as authorization to Enable any organization.

---

## 19. Exact next action

Owner-authorized **first real customer Online Payments activation** for **one** eligible Property Manager or Complete residential organization (not this audit; not Property Demo unless separately named):

1. That organization completes Stripe Connect on **its own** Express account until ready.
2. If they want bank payments, request ACH in place until `us_bank_account_ach_payments` is active.
3. Admin sets ACH, Cards, or Both.
4. Admin clicks **Enable Online Payments** for that organization only.

Until the Owner names that organization and authorizes Enable:

**STOP.**

Do not activate any organization from this record. Do not process a tenant payment. Do not create Stripe Checkout or a PaymentIntent. Do not create another Connect account. Do not create a complimentary tester. Do not buy a SaaS subscription. Do not change Stripe Prices or SaaS Checkout. Do not enable M5. Do not unfreeze July. Do not globally flip payment execution.

---

## Classification

**READY FOR PUBLIC MARKETING / FIRST REAL CUSTOMER**

No P0. No P1. Execution remains FALSE everywhere. Tenant-payment architecture stays certified and unused for real customers.
