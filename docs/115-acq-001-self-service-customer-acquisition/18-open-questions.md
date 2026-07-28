# 18 — Open Questions (Resolved)

**Package:** ACQ-001  
**Status:** ✅ **RESOLVED** (2026-07-27) · Locked for Version 1.0 with `APPROVE ACQ-001`  
**Rule:** These decisions are binding for Implement unless a later amendment reopens them.

---

## Resolution table

| ID | Decision (locked) | V1.0 | May change later? |
|----|-------------------|------|-------------------|
| **OQ-01** | Trial **enabled** as public self-serve via **Stripe Trial with payment method** (`trial_period_days`) | Required | Yes (Finance may change length/card policy via amendment) |
| **OQ-02** | Pre-Checkout fields: **company name + work email** only | Required | Phone optional later |
| **OQ-03** | Existing principal who is only a member elsewhere: **allow new org as Org Admin** (multi-org) | Required | Harden edge cases later |
| **OQ-04** | Duplicate hard-block: **open SaaS subscription for same Stripe customer** only; soft-warn on similar company name | Required | Domain heuristics later |
| **OQ-05** | Abandoned Checkout email: **No for V1.0** | Required (defer) | Yes — Slice D+ |
| **OQ-06** | Public site: **same Next.js app** public routes | Required | Separate marketing host later |
| **OQ-07** | Pricing interval default: **Monthly**, with Annual toggle | Required | Default flip is copy/config |
| **OQ-08** | Demo / Enterprise: **form → COM opportunity**; optional scheduler URL via env later | Required for Enterprise path | Calendly embed optional |
| **OQ-09** | Cookie consent: **reuse existing global privacy approach**; no ACQ-specific banner | Required | Legal may mandate banner |
| **OQ-10** | Founder plan: **not listed** on public pricing | Required | Never without grant policy change |
| **OQ-11** | Post-success: **email first-login only** (no auto-session from return URL) | Required | Magic link auto-login needs Security re-Approve |
| **OQ-12** | Professional Implementation upsell on success: **hidden in V1.0** | Required (defer) | Show from Setup later |

---

## Recommendations, trade-offs, and rationale

### OQ-01 — Trial retained with card

**Decision:** Public Trial CTA → Stripe Checkout in trial mode with payment method on file.

**Trade-offs:** Card requirement reduces casual spam vs $0 no-card; slightly higher drop-off vs free-no-card. Aligns with BILL-001 trial mirroring (`trialing`) and entitlement caps.

**V1.0:** Required if Trial CTA is shown (it is).

### OQ-02 — Company + work email

**Decision:** Collect company name + work email before creating Checkout Session (Slice B+). Email may still be confirmed in Stripe.

**Trade-offs:** One extra step vs email-only-in-Stripe; enables welcome delivery + provision hints without waiting for webhook email alone.

**V1.0:** Required for Checkout entry (Slice B). Slice A collects the same fields on `/acquire/start` for intent continuity.

### OQ-03 — Multi-org for existing members

**Decision:** Allow purchase to create a **new** organization with buyer as Org Admin even if they already belong to another org.

**Trade-offs:** Supports operators running multiple companies; slightly more complex support. Blocking would strand legitimate buyers.

**V1.0:** Required (AUTH multi-org already designed).

### OQ-04 — Duplicate detection

**Decision:** Hard-block second Checkout only when the Stripe customer already has an **open** SaaS subscription. Soft-warn (non-blocking) on similar organization name at success/ops.

**Trade-offs:** Name-only hard-blocks create false positives; customer-id open-sub is precise and matches BILL one-sub invariant.

**V1.0:** Required for Checkout (Slice B+).

### OQ-05 — Abandoned checkout email

**Decision:** Defer. No abandoned-cart email in V1.0.

**Trade-offs:** Missed recovery revenue vs scope/privacy complexity.

**V1.0:** Not required.

### OQ-06 — Same Next app

**Decision:** Routes under the production web app (`/`, `/tour`, `/pricing`, `/contact-sales`, `/acquire/*`).

**Trade-offs:** Shared deploy/Canopy vs separate marketing CMS flexibility. Fastest path to V1.0.

**V1.0:** Required.

### OQ-07 — Monthly default

**Decision:** Pricing loads on **Monthly**; user may toggle Annual (show savings when list prices differ).

**Trade-offs:** Annual default can raise AOV; monthly matches SMB evaluation behavior.

**V1.0:** Required.

### OQ-08 — Contact Sales form → COM

**Decision:** Enterprise path uses a form; Slice B+ persists as COM opportunity. Slice A ships form UX + client validation; persistence authorize with Slice B if needed for sales ops.

**Trade-offs:** Form-only without CRM write loses leads; COM write is the SoT.

**V1.0:** Form required in Slice A; opportunity persistence required before Enterprise launch claim (Slice B minimum).

### OQ-09 — Privacy

**Decision:** Do not invent an ACQ-only cookie banner; inherit app-wide privacy/legal links in footer.

**Trade-offs:** May need Legal follow-up for marketing analytics cookies.

**V1.0:** Required as stated; Legal can amend.

### OQ-10 — No public Founder

**Decision:** Founder never appears on `/pricing`.

**Trade-offs:** None for V1.0; Founder remains Master Admin grant.

### OQ-11 — Email first-login

**Decision:** After provision, credentials via email; success page links to `/login` / first-login — **no** session mint from success URL alone.

**Trade-offs:** Extra click vs magic auto-login; far safer against URL leakage.

**V1.0:** Required.

### OQ-12 — Hide implementation upsell on success

**Decision:** Success page focuses on credentials + setup; Professional Implementation upsell deferred.

**Trade-offs:** Missed upsell vs clearer first-run.

**V1.0:** Required (hide).

---

## Dependencies (post-resolve)

| Dependency | Status |
|------------|--------|
| COM-001 A10 | ✅ Accepted with Approve |
| BILL-001 Checkout with buyer hints | Slice B |
| Stripe Trial/Pro/Business prices | Ops before Slice B cert |
| Legal footer links | Present on marketing shell |
| Canopy public pages | Slice A Implement |
