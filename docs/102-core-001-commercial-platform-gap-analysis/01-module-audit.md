# 01 — Module Audit

**Package:** CORE-001  
**Date:** 2026-07-22  
**Method:** Evidence from package READMEs, certification records, and `apps/web` routes/libs. No new features invented.

Legend: **Works** · **Partial** · **Placeholder** · **Blocks commercial** · **Post-launch**

---

## Authentication & identity

| Aspect | Finding |
|--------|---------|
| Works | Login, forgot/reset password, invitations, org membership, role capabilities (`/login`, UX-005) |
| Partial | SSO / enterprise IdP not offered |
| Placeholder | — |
| Blocks commercial | None for email/password PM orgs |
| Post-launch | SSO, SCIM |

## Master Admin

| Aspect | Finding |
|--------|---------|
| Works | `/master-admin` health, providers, impersonation (ADMIN-001), testing utilities, flags |
| Partial | ADMIN-003 Mission Control slices B–D locked; EP-017 deep walk pending |
| Placeholder | Some HQ dashboards thin vs full ops console |
| Blocks commercial | Support cannot fully certify without operator walk |
| Post-launch | ADMIN-003 B–D, SaaS HQ metrics |

## Property Management

| Aspect | Finding |
|--------|---------|
| Works | Properties/units CRUD, portfolio, Ops Center entry (`/properties`, `/units`) |
| Partial | AI recommendation placeholders on some tables |
| Placeholder | Portfolio “optimization” AI |
| Blocks commercial | None for &lt;50 unit DP; scale uncertified |
| Post-launch | Large portfolio cert |

## Residents / lifecycle

| Aspect | Finding |
|--------|---------|
| Works | Tenants, move-in/out/transfer/bulk (`/residents/*`, WF-003) |
| Partial | Portal invite → real inbox depends on email ops |
| Placeholder | — |
| Blocks commercial | Weak if invite email not proven for paying orgs |
| Post-launch | WF-004 deeper automation |

## Applicants / screening

| Aspect | Finding |
|--------|---------|
| Works | Applicant pipeline, consent token, Checkr adapter (API-003) |
| Partial | Often sandbox/noop; income verification future |
| Placeholder | Auto-decisioning rules |
| Blocks commercial | Only if sold as live screening without live provider |
| Post-launch | Income verify, auto-rules |

## Leasing / signatures

| Aspect | Finding |
|--------|---------|
| Works | Leases, signing progress token, Dropbox Sign adapter (API-004) |
| Partial | `coTenantPlaceholder` / `lateFeePlaceholder`; sandbox e-sign common |
| Placeholder | Full lease file UX polish |
| Blocks commercial | Live e-sign if promised in contract |
| Post-launch | Multi-signer / leasing lifecycle cert |

## Maintenance

| Aspect | Finding |
|--------|---------|
| Works | Work orders, assign, complete, timeline, reports |
| Partial | Legacy placeholder columns (photos/recurring) still named in schema |
| Placeholder | Preventive/recurring product |
| Blocks commercial | None for core WO path |
| Post-launch | Preventive PM |

## Vendor

| Aspect | Finding |
|--------|---------|
| Works | Vendor directory, assignment, **QR Start/Finish** (VENDOR-001 A **PASS**) |
| Partial | Mobile device spot-check recommended; Phase B locked |
| Placeholder | Marketplace (ADR-004) |
| Blocks commercial | **Cannot pay vendors in-product** |
| Post-launch | Phase B invoice/pay; marketplace |

## Owner

| Aspect | Finding |
|--------|---------|
| Works | PM can generate owner statements / notify via communications |
| Partial | `ownerPlaceholder` on statements; no Connect identity |
| Placeholder | **`/portal/owner` = FutureReleaseNotice** |
| Blocks commercial | **No owner self-serve; no Connect payouts implemented**; FIN-003 docs referenced by ADR-023 **missing on disk** |
| Post-launch | Rich owner analytics |

## Communications

| Aspect | Finding |
|--------|---------|
| Works | Threads, announcements, property QR enrollment (`/join`), Message Resident |
| Partial | Email fan-out ops-sensitive; announcement targeting placeholders |
| Placeholder | Floor/attachment targeting fields |
| Blocks commercial | SMS must not be claimed (disabled) |
| Post-launch | INT-302 SMS |

## Accounting / financials

| Aspect | Finding |
|--------|---------|
| Works | Charges, expenses, transactions, owner statements, reports (Phase 10, FIN-001) |
| Partial | Not a GL; ACH/card method placeholders in contracts |
| Placeholder | Trust accounting |
| Blocks commercial | None if positioned as ops ledger not QuickBooks |
| Post-launch | GL / trust (ADR-010 reopen) |

## Payments / rent collection

| Aspect | Finding |
|--------|---------|
| Works | Resident pay portal, PM billing, Stripe + noop providers, webhooks |
| Partial | Default noop without env; **live supervised cert open (EP-017)** |
| Placeholder | Some method labels |
| Blocks commercial | **Live rent not certified for unsupervised paid use** |
| Post-launch | Autopay maturity, more rails |

## SaaS billing (M.P.A. subscription)

| Aspect | Finding |
|--------|---------|
| Works | Checkout, webhooks, Company Billing Center (BILL-001 A/B shipped) |
| Partial | Deeper HQ SaaS metrics locked |
| Placeholder | — |
| Blocks commercial | None for charging M.P.A. customers (Phase A PASS) |
| Post-launch | BILL Phase D / ADMIN SaaS KPIs |

## Documents

| Aspect | Finding |
|--------|---------|
| Works | Document vault browser, report PDF vaulting |
| Partial | Entity upload E2E uneven |
| Placeholder | — |
| Blocks commercial | None for vault + report artifacts |
| Post-launch | Full entity document workflows |

## Notifications / push

| Aspect | Finding |
|--------|---------|
| Works | In-app center, device APIs, OneSignal provider, MA diagnostics |
| Partial | **PUSH-001 Approved; PASS needs real devices** |
| Placeholder | Native SDKs (explicit non-goal) |
| Blocks commercial | Cannot claim reliable push until PASS |
| Post-launch | Native apps |

## AI

| Aspect | Finding |
|--------|---------|
| Works | Floating copilot, AI Operations surface, page context |
| Partial | AI-001 awaiting user verification (not PASS) |
| Placeholder | Proactive IA-001 execution |
| Blocks commercial | Not a hard money blocker; do not overclaim |
| Post-launch | IA-001 proactive ops |

## Reporting

| Aspect | Finding |
|--------|---------|
| Works | Report catalog, PDF, vault, maintenance summary |
| Partial | Owner delivery packs thin |
| Placeholder | BI suite / scheduling |
| Blocks commercial | None for PM generate/download |
| Post-launch | Schedules, more types |

## Search / command palette

| Aspect | Finding |
|--------|---------|
| Works | Command palette, Search M.P.A., SH-003 PASS |
| Partial | Index depth |
| Placeholder | — |
| Blocks commercial | None |
| Post-launch | Deeper search |

## Settings / team / appearance

| Aspect | Finding |
|--------|---------|
| Works | Org, team, appearance, notifications, integrations, billing, documents |
| Partial | Theme/perception under DPX-003 / BR-002 |
| Placeholder | — |
| Blocks commercial | Theme Sev-1 until DPX-003 PASS |
| Post-launch | White-label depth |

## Integrations

| Aspect | Finding |
|--------|---------|
| Works | Provider status center; Stripe/Resend/OneSignal/Sign/Checkr probes |
| Partial | Env-dependent readiness honesty |
| Placeholder | Maps optional |
| Blocks commercial | Mis-selling disabled providers (SMS) |
| Post-launch | SMS, maps |

## PWA

| Aspect | Finding |
|--------|---------|
| Works | Manifest, service worker, offline shell assets |
| Partial | Install UX lightly productized; push tied to PUSH-001 |
| Placeholder | Store packaging |
| Blocks commercial | Only via push claim |
| Post-launch | Install growth features |

## Migration / switching

| Aspect | Finding |
|--------|---------|
| Works | Migration center, templates, switching experience |
| Partial | Beginning balances guidance; not full GL history |
| Placeholder | Deep accounting migration |
| Blocks commercial | None if scope is honest |
| Post-launch | Accounting history import |

## Design language / Experience Architecture

| Aspect | Finding |
|--------|---------|
| Works | Canopy + Experience Architecture **Approved**; ADR-011/013 |
| Partial | Child docs with stale Draft headers; DPX-003 not PASS |
| Placeholder | — |
| Blocks commercial | Perception/polish for premium claim |
| Post-launch | Ongoing perception cert (ADR-022) |
