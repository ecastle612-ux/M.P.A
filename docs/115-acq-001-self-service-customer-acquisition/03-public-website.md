# 03 — Public Website

**Package:** ACQ-001  
**Status:** Draft — Ready for Approval  
**Design language:** Canopy (Approved) · Experience Architecture (Approved)

---

## Public website (scope)

Marketing / acquisition surfaces live **outside** the authenticated Ops shell. They share Canopy tokens and brand, but must not look like a logged-in dashboard ([visual identity](../06-design-language/visual-identity-guide.md)).

| Route (proposed) | Purpose |
|------------------|---------|
| `/` or `/home` | Landing |
| `/tour` | Interactive product tour |
| `/pricing` | Pricing + plan comparison + FAQ |
| `/contact-sales` | Enterprise / demo |
| `/acquire/success` | Post-Checkout success / waiting |
| `/acquire/canceled` | Checkout canceled |
| `/acquire/error` | Recoverable error |

Exact path names may adjust at Implement; semantics are binding.

---

## Landing page

### Goals

- Brand-first first viewport (Canopy + frontend design rules)
- One composition; one primary CTA
- No dashboard chrome, no card grids in hero

### Content budget (first viewport)

1. Brand / product name (hero-level)  
2. One headline  
3. One short supporting sentence  
4. CTA group: **Start free trial** / **See pricing** / **Take the tour**  
5. One dominant atmospheric or product visual (full-bleed hero treatment for marketing)

### Below fold (ordered)

1. Who it’s for (PM operators)  
2. What you get (property + facility ops summary — not feature dump)  
3. Trust signals (security, Stripe, privacy — factual, no fake stats)  
4. Secondary CTA → Pricing or Tour  

### Forbidden on landing

- “Create free account” without Checkout  
- Fake testimonials / invented metrics  
- Purple-glow consumer SaaS clichés banned by Canopy / user design rules  

---

## Interactive product tour

### Goals

Show the product in motion with **minimal reading**. Prefer guided highlights of real UI screenshots or a scripted walkthrough of key jobs:

1. Command Center / today’s work  
2. Properties → maintenance  
3. Leasing / residents (high level)  
4. Facility ops (if SKU relevant)  
5. Billing / team (admin)  

### Interaction model

- Stepper with Next / Back / Skip to Pricing  
- Keyboard accessible  
- Progress indicator  
- Total steps ≤ 6  
- Optional short video later (not required for V1 Approve)

### Exit CTAs

- Primary: **See pricing**  
- Secondary: **Contact sales** (Enterprise)  

### Non-goals

- Hostage multi-minute mandatory tour before Pricing  
- Account creation mid-tour  

---

## Pricing page

### Plans shown (self-serve)

| Plan | Public CTA |
|------|------------|
| Trial | Start trial → Checkout |
| Professional | Choose Professional → Checkout |
| Business | Choose Business → Checkout |
| Enterprise | Contact Sales / Schedule Demo — **not** Checkout |

Founder is **not** listed as a public purchasable plan.

### Required elements

- Monthly / Annual toggle (annual shows savings if configured)  
- Clear seat / property / module summary per plan (from capability matrix — not inventing new caps)  
- “See only what you bought” note  
- Link to full comparison table  
- FAQ section (below)  

### Plan comparison

Matrix columns: Trial | Professional | Business | Enterprise  

Rows (minimum):

- Max properties  
- Max seats  
- Property operations  
- Facility operations  
- Core modules (maintenance, leasing, financials, messaging, documents)  
- AI copilot  
- Marketplace  
- Priority support  
- Implementation (AI Guided vs Professional / sales)  

Numeric caps: reuse AUTH-001 capability matrix / BILL-001 — single SoT; pricing page is a **view**.

---

## Frequently asked questions

Minimum FAQ topics:

1. How does Trial work?  
2. What happens after I pay?  
3. Can I invite my team?  
4. Can I upgrade later?  
5. How do cancellations work?  
6. Is tenant rent money separate from my M.P.A. subscription? (**Yes** — BILL-001 separation)  
7. Do you offer Enterprise / custom?  
8. Who owns my data?  

Tone: direct, short answers; link to Security / Privacy pages if they exist.

---

## Enterprise public path

| Element | Behavior |
|---------|----------|
| Pricing Enterprise card | Contact Sales + Schedule Demo |
| Form fields | Minimal: name, work email, company, portfolio size, message |
| Downstream | Creates / updates COM-001 opportunity (Lead/MQL) — reuse commercial APIs |
| No Checkout | Binding |

---

## Brand & Canopy

- Public pages use Canopy tokens  
- Marketing may use fuller hero treatment  
- Authenticated product must remain distinct after login  
- No new component library — use `@mpa/ui` + Canopy patterns
