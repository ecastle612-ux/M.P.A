# 223 — Final Pre-Onboarding Production Release
## FO-EFF Slice 6 Deterministic Routing + docs/222 Briefing Authorization

**Title:** FINAL PRE-ONBOARDING PRODUCTION RELEASE CERTIFICATION  
**Status:** **FINAL PRE-ONBOARDING PRODUCTION RELEASE SUCCESSFUL — M.P.A. READY FOR HUMAN ONBOARDING**  
**Date:** 2026-08-18  
**Authority:** Owner authorization — one controlled Production package containing certified docs/221 deterministic routing **and** the docs/222 rule-based Mission Control briefing permission correction only.  
**Design / ADRs:** [docs/221](../221-fo-eff-slice6-deterministic-routing/index.md) · [docs/222](../222-ai-assistant-functionality-audit/index.md) · [docs/220](../220-fo-eff-slice5-production-release/index.md) · [ADR-006](../18-decision-log/adr-006-embedded-ai-not-chatbot.md) (**Accepted**) · [ADR-019](../18-decision-log/adr-019-product-constitution.md) · [ADR-033](../18-decision-log/adr-033-complete-operating-scope.md) · [ADR-036](../18-decision-log/adr-036-fo-operational-efficiency-system.md)  
**Preserves:** docs/204–220 certified functionality. No generative chatbot. No OpenAI / Anthropic / model infrastructure. No extra feature.  
**Required baseline:** docs/220 · SHA `eb81b07f7f073b411668ae7eb504868097474df6` · deploy `dpl_HQpPuRD3TknzY177TEqqKRMk2NBE`  
**Certified Slice 6 implement SHA:** `cf94c1b4984f87cb84781deab70bfe06a0e25426`  
**Production application SHA:** `a1f617de77f30696471045e2f684ba8fe3d15f4f`  
**Target:** `mpa-prod` / `vahnmcrpnuggxkivynvo` · Vercel `m-p-a-web`  
**This package:** Reconcile docs/220 + docs/221 + docs/222 · confirm Slice 6 SQL already applied as Production twin `20260818091246` · deploy the matching application containing **both** routing and the briefing gate · controlled Clinic Demo routing UAT + server/test briefing authz proof · deactivate UAT rules. **No chatbot. No Stripe / Connect / AutoPay / FIN-OPS / price / M5 / July change. No manufactured employee.**

---

## Verdict

**FINAL PRE-ONBOARDING PRODUCTION RELEASE SUCCESSFUL**  
**— M.P.A. READY FOR HUMAN ONBOARDING**

Production now serves **both** FO-EFF Slice 6 deterministic routing and the docs/222 rule-based briefing permission correction as one revision. Application SHA **`a1f617de`** is live on `www.my-property-assistant.com` as **`dpl_4vsYcecpATEcFeQUNJaSJT4izHGS`**. Slice 6 SQL is registered once as **`20260818091246` / `docs_221_fo_eff_slice6_routing`**. Tenant payment execution remains **0 of 6 TRUE**. July freeze remains **ON**. M5 remains unauthorized. SaaS prices remain **$59 / $59 / $109**. P0 = **0**. P1 = **0**.

**Do not replay `20260818200000` or the Production twin.**  
**STOP all major feature development.** The next package is **HUMAN ONBOARDING SIMULATION** only.

---

## 1. Certification record

| Item | Value |
|------|--------|
| Unique number | **223** |
| Path | `docs/223-final-pre-onboarding-production-release/` |
| Slice 6 implement (unchanged meaning) | [docs/221](../221-fo-eff-slice6-deterministic-routing/index.md) |
| Briefing audit + P1 gate (unchanged meaning) | [docs/222](../222-ai-assistant-functionality-audit/index.md) |
| Prior Production | [docs/220](../220-fo-eff-slice5-production-release/index.md) |

---

## 2. Final deployed SHA

| Item | Value |
|------|--------|
| Production SHA | `a1f617de77f30696471045e2f684ba8fe3d15f4f` |
| Slice 6 implement source | `cf94c1b4984f87cb84781deab70bfe06a0e25426` |
| Briefing gate commit on this line | `c8341c5e` (cherry-pick of `0e40015c`) |
| Docs/222 pin | `a1f617de` (includes `a7b5524f` meaning) |
| Release branch | `cursor/pre-onboarding-production-01f2` |
| Prior Production | `eb81b07f` / `dpl_HQpPuRD3TknzY177TEqqKRMk2NBE` (docs/220) |
| Superseded Slice-6-only deploy | `c84742d9` / `dpl_BYMrKYufEpvSY1CbU4ybaY1f76RB` — **do not treat as the live package**; it lacked docs/222 |

---

## 3. Deployment ID

| Item | Value |
|------|--------|
| Deployment | **`dpl_4vsYcecpATEcFeQUNJaSJT4izHGS`** |
| Target | production · READY |
| Inspector | `https://vercel.com/ecastle612-uxs-projects/m-p-a-web/4vsYcecpATEcFeQUNJaSJT4izHGS` |
| Git ref | `cursor/pre-onboarding-production-01f2` |
| Live `data-dpl-id` | `dpl_4vsYcecpATEcFeQUNJaSJT4izHGS` (confirmed on `www.my-property-assistant.com/login`) |
| Aliases | `www.my-property-assistant.com` · `my-property-assistant.com` · `m-p-a-web.vercel.app` · `m-p-a-web-ecastle612-uxs-projects.vercel.app` |

Live unauthenticated probes on this revision:

- `GET /api/pm/mission-control` → **401**
- `GET /api/facility/mission-control` → **401**
- `GET /api/facility/assignment-rules` → **401**
- `GET /facility/settings/assignment-rules` → **307** `/login`

---

## 4. Migration Production stamp

| Item | Value |
|------|--------|
| Certified source | `supabase/migrations/20260818200000_docs_221_fo_eff_slice6_routing.sql` |
| Source version on Production | **absent** — do not replay |
| Production stamp | **`20260818091246`** / `docs_221_fo_eff_slice6_routing` |
| Repo twin | `supabase/migrations/20260818091246_docs_221_fo_eff_slice6_routing.sql` |
| Predecessor tip | `20260818081710` / `docs_219_fo_eff_slice5_pm` |

Applied exactly once by the Slice 6 Production twin line. This package **did not** re-apply either stamp.

Live objects: `facility_assignment_rules` · `facility_assignment_rule_evaluations` · unique `(organization_id, sort_order)` · unique `initial_create` evaluation per work order · org-membership RLS (`facility_assignment_rules_org_all`, `facility_assignment_evals_org_all`) · default grants to `anon` / `authenticated` / `service_role` / `postgres`. No historical work-order rewrite. No existing-WO auto-assignment.

---

## 5. Migration SHA-256

| File | SHA-256 |
|------|---------|
| Certified source `20260818200000` (full file) | `a75d3a8307e5d74d827b1df4fcdee0642b10931fab3277814341976a694cf04d` |
| Production twin `20260818091246` (full file) | `479c1712f026afc3513f79cb7502e12129534446660268fcefbe423a025bd450` |
| Comment-line-stripped SQL statements (source = twin) | `6a12175ffcdb9cdfc35130fe27224dc95e83b73eafd9a275c54511845e248157` |

Twin header comments record the Production stamp and forbid replay of `20260818200000`. SQL statements are equivalent.

---

## 6. docs/222 briefing fix live

**Yes.** The live revision contains `resolveDailyOpsBriefingAccess` and passes `authz.permissions` into `GET /api/pm/mission-control`.

Binding behavior on this SHA:

- Finance-related briefing data requires `pm.finance:read`
- Resident / lease briefing queues require `organization_admin` | `property_manager` | `leasing_agent`
- Technicians do not receive outstanding rent, delinquency, resident queues, lease queues, or financial briefing content merely because they can open Property Mission Control
- Technicians may still receive authorized maintenance-oriented briefing
- RLS was **not** weakened. Permissions were **not** broadened

The briefing remains **rule-based, read-only, no model, no chat, no mutations**.

---

## 7. Technician briefing result

No safe Production technician session exists on Clinic Demo, and this package did **not** manufacture an employee (docs/216 constraint).

Proof used instead:

- Production `role_permission_grants`: `facility_technician` has **no** `pm.finance:read`. Shared catalog: `maintenance_technician` finance capabilities are empty.
- Certified tests: `resolveDailyOpsBriefingAccess({ roles: ["maintenance_technician"], permissions: ["pm.properties:read", "pm.maintenance:read", "pm.maintenance:write"] })` → `includeFinance = false`, `includeResidentLease = false`
- `GET /api/pm/mission-control` without a session → **401**

**Result:** technician briefing is maintenance-safe. Finance and resident/lease queues are omitted.

---

## 8. Finance permission result

- `property_manager` and `organization_admin` have Production `pm.finance:read` **and** `pm.properties:read` → finance briefing **permitted** when those grants are present
- `property_manager` **without** `pm.finance:read` → finance briefing **omitted** (certified test)
- `leasing_agent` has Production `pm.finance:read` → finance briefing permitted; resident/lease queues permitted by role

---

## 9. Resident / lease permission result

Resident and lease briefing queues are limited to `organization_admin` / `property_manager` / `leasing_agent`. Technician roles fail `includeResidentLease`. Certified isolation tests require `daily-ops-service` to honor `access.includeResidentLease` before querying those tables.

---

## 10. Complete scope result

Complete SKU is not authorization. Certified Slice 6 + operating-scope tests:

- Complete **FO-only** → `facility.routing` allowed; Property briefing entitlement / PM Mission Control remain PM-surface gated (`requirePropertyPermission("pm.properties:read")` + `effectiveSurfaces`)
- Complete **PM-only** → no FO Mission Control / no Assignment Rules (`facility.routing` absent)
- Complete **both** → each surface follows its own permissions

Unauthenticated Production APIs return **401** on both PM and FO Mission Control.

---

## 11. Confirmation no generative AI exists

**Confirmed.** ADR-006 remains authoritative. “M.P.A. Assistant” remains a rule-based next-action briefing.

This package did **not** add:

- `OPENAI_API_KEY` / Anthropic / AI SDK / embeddings
- chat UI / tool loops
- a marketed generative assistant

`assistant-functionality-audit` tests: no `/api/ai`, no OpenAI / `@ai-sdk` imports, no `OPENAI_*` in `.env.example`.

---

## 12. Assignment Rules live

`/facility/settings/assignment-rules` exists on the live revision (307 to `/login` when anonymous). API `/api/facility/assignment-rules` exists and returns **401** when anonymous. Entitlement `facility.routing` is manager-only.

---

## 13. Public-request routing

Clinic Demo only (`M.P.A. UAT Clinic Demo` / `a11ce001-0001-4000-8000-00000000c11c`). Not a customer.

| Item | Value |
|------|--------|
| Work order | `dc81b996-53b9-4d85-afe7-6f737b8e81cd` |
| Number | `FR-2026-00003` |
| Title | Furniture Repair |
| Origin | `public_request` |
| Status | `assigned` |
| Assignee | existing Clinic Demo staff `a1f4c2c7-00be-4e02-bc4f-892544812983` (`technician_user_id`) |
| Evaluation | `7b89d795-1865-47e9-b1cc-90cddee1035b` · `matched` · `initial_create` · “Matched UAT Furniture Public Request Assignment (priority 100).” |

Path: public request → canonical facility WO → matching rule → assignment → routing audit. **Zero manager assignment clicks.**

A second public submit was **not** repeated on SHA `a1f617de`: the furniture form is inactive, image is required on the published version, and no new intake was created. The live WO was created on the already-applied routing service (same `routeFacilityWorkOrder` / `createFacilityWorkOrder` path shipped in this revision).

---

## 14. Manual routing

Same `createFacilityWorkOrder` → `routeFacilityWorkOrder` service. Certified by `assignment-routing-service.test.ts` (first-match assign, already-assigned skip). No authenticated Production operator cookie was used to click Create Work. No new staff created.

---

## 15. PM routing

Same routing service after Slice 5 generation. Certified tests cover the shared create/route path. Live PM generate was **not** re-run: this environment has no `CRON_SECRET`, and all Clinic Demo PM plans are **inactive** (including **UAT Slice 6 Routing Chair Check**). The earlier Slice 5 WO `cc59369c-eaf5-43ab-9dab-272cedac59f9` remains `unassigned` — it was created **before** routing rules existed and was correctly not rewritten.

---

## 16. Zero-click assignment

`FR-2026-00003` entered `assigned` with a technician and a matching evaluation without a manager Assign click.

---

## 17. Priority behavior

Unique `(organization_id, sort_order)` with `1` = highest. Certified: first matching rule wins; reorder keeps unique 1-based priority. Clinic Demo UAT used priority **100** over lower-priority furniture rule **200** (both now inactive).

---

## 18. No-match

Certified: `leaves work unassigned when nothing matches`. Historical Clinic Demo WOs created before routing remain unassigned. No historical rewrite.

---

## 19. Invalid destination

Certified: `does not fall through when the winning destination is invalid`. Work remains Unassigned; evaluation records failure; work creation survives. Clinic Demo rule **UAT Invalid Destination Vendor** (sort 400) is inactive and was not left live.

---

## 20. Manual override

Certified: `does not automatically re-route a manager override`. Manager reassignment wins. No bounce-back. Re-run is explicit and only while Unassigned.

---

## 21. Routing audit

`facility_assignment_rule_evaluations` row for `FR-2026-00003` preserved (`matched` / `initial_create` / rule snapshot / reason / assignee). Unique `initial_create` index present. Evaluations were **not** hard-deleted.

---

## 22. Notification / My Work behavior

Routed assignment used the **existing** `work_order.assigned` notification. Staff href: `/facility/my-work?workOrderId=dc81b996-53b9-4d85-afe7-6f737b8e81cd`. Public-submit notifications used existing `work_order.public_submitted` → Operations. **No** routing-specific notification engine.

---

## 23. Org / RBAC isolation

Rules and evaluations exist only on Clinic Demo (`4` inactive rules, `0` active). No other organization has `facility_assignment_rules` rows. RLS is org-membership. Cross-org assignee create is refused (certified). Complete FO vs PM isolation certified (`facility.routing` absent on PM-only).

---

## 24. Final active UAT rules

| Object | Final state |
|--------|-------------|
| Assignment rules | **0 active** (4 inactive Clinic Demo UAT rules retained for audit) |
| PM plans | All **inactive** (Quarterly Chair, Annual Roof, Slice 6 Routing Chair Check) |
| Furniture form | **inactive** |
| Slice 6 temporary intake `DPfL0I` | **revoked** |
| Pre-existing floor intake `DYgVQe` | **active** prefix from earlier public-request UAT; form is inactive so it cannot accept work. Not hard-deleted. Token not recovered / not printed |
| Evaluations / `FR-2026-00003` | **preserved** |

No real customer rule remains active. No customer organization received a rule.

---

## 25. Slice 1 regression

Templates, checklist snapshot, My Work, completion gate unchanged. Routing calls existing `assignWorkOrder`. Facility maintenance / assignment tests passed in the FO web suite (**142**).

---

## 26. Slice 2 regression

Facility Mission Control remains Needs Attention. No second dashboard. No chat. Unauthenticated FO Mission Control → **401**.

---

## 27. Slice 3 regression

Asset registry / QR / locked public context unchanged. No new asset system.

---

## 28. Slice 4 regression

Search / Create / Recent **not** expanded with Assignment Rules. Shared Slice 4 tests passed.

---

## 29. Slice 5 regression

PM plans, occurrence uniqueness, scheduler, and `origin_source` unchanged. No historical PM WO rewrite. Scheduler-created WOs can be assigned by a matching **active** rule; they stay unassigned when no rule matches.

---

## 30. docs/214 regression

One manager Facilities item: Assignment Rules. Technician rail unchanged. Shared Slice 6 nav tests passed.

---

## 31. Finance / payment safety

| Check | Result |
|-------|--------|
| `financial_module_settings.stripe_payment_execution_enabled = true` | **0 of 6** |
| Stripe / Stripe Connect / AutoPay / FIN-OPS / SaaS Checkout | **unchanged** |
| PM / FO / Complete monthly | **$59 / $59 / $109** |
| Approved annual | **$566.40 / $566.40 / $1,046.40** |
| Complimentary access | **unchanged** |
| Money movement in this package | **none** |

---

## 32. July / M5

| Check | Result |
|-------|--------|
| `finance_july_freeze_enabled()` | **true** (ON) |
| `isFinanceM5Authorized()` | **false** |
| Automated late fees | **none** |
| Collections automation | **none** |

---

## 33. Tests / build

| Check | Result |
|-------|--------|
| Shared focused (facility + daily-ops + operating-scope + Slice 4) | **106** passed |
| Web FO + briefing + isolation + require-authorized-action | **142** passed |
| `pnpm --filter @mpa/shared typecheck` | Pass |
| `pnpm --filter @mpa/web typecheck` | Pass |
| ESLint on briefing + routing changed sources | Pass |
| Production Vercel build | **READY** · `dpl_4vsYcecpATEcFeQUNJaSJT4izHGS` |
| Local `next build` in this VM | Fails without Sentry/Resend/SignWell workspace secrets — **not** a code regression; Production build is the release evidence |

Pre-existing unrelated: `tenant-portal-billing-copy.test.ts` may fail if the full web suite is run without env. **Not hidden. Not changed.**

---

## 34. P0 remaining

**0**

---

## 35. P1 remaining

**0**

docs/222 P1-1 (technician finance / resident-lease over-read) is **closed and live**.

---

## 36. P2 intentionally deferred

| ID | Note |
|----|------|
| P2-1 | Root / manifest “AI Property Operations Platform” branding (docs/222). Not a generative product. |
| P2-2 | Finance-desk late-fee wording outside FIN-OPS. |
| P2-3 | Technician can still open PM Mission Control nav; briefing is now maintenance-safe. |
| P2-4 | docs/13 remains design, not live. |
| P2-5 | No authenticated Production technician session for a click-through briefing UAT — server/test proof used as authorized. |
| P2-6 | No `CRON_SECRET` in this agent environment — live PM generate not re-run; certified shared routing path + inactive UAT plans. |
| P2-7 | Furniture form remains image-required; no second public submit on `a1f617de`. |

Do not invent work from these.

---

## 37. Final onboarding verdict

**FINAL PRE-ONBOARDING PRODUCTION RELEASE SUCCESSFUL**  
**— M.P.A. READY FOR HUMAN ONBOARDING**

P0 = **0**. P1 = **0**.

### Feature freeze

After this certification:

**STOP ALL MAJOR FEATURE DEVELOPMENT.**

Do not start:

- generative AI / chat
- inventory
- vendor auto-dispatch
- predictive maintenance
- saved views
- favorites
- another major module

The next package is **HUMAN ONBOARDING SIMULATION** only. Then begin onboarding real testers / subscribers.

---

## Lineage (no unexpected conflict)

```
docs/220 Production  eb81b07f  /  dpl_HQpPuRD3TknzY177TEqqKRMk2NBE
        ↓
docs/221 implement   cf94c1b4
        ↓
Slice 6 Production twin + earlier Slice-6-only deploy  c84742d9
        ↓
docs/222 briefing gate + audit   c8341c5e + a1f617de
        ↓
this package (docs/223)          a1f617de  /  dpl_4vsYcecpATEcFeQUNJaSJT4izHGS
```

The Slice-6-only Production deploy is the same certified 221 ancestor plus the Production SQL twin. This package stacked the briefing gate on that line. That is **expected lineage**, not a conflict. Certified docs/204–220 meanings are unchanged.

**STOP.**
