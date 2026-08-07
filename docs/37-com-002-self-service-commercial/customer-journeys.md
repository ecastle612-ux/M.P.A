# COM-002 — Customer Journeys

**Parent:** [COM-002 Index](./index.md)  
**Status:** Draft  

---

## Journey map overview

```
                         ┌─────────────────┐
                         │  Public Landing │
                         └────────┬────────┘
                                  │
                         Choose Product
                                  │
                           Choose Plan
                                  │
                      Choose Billing Cycle*
                                  │
              ┌───────────────────┴───────────────────┐
              │                                       │
       Try Live Demo                          Start Subscription
              │                                       │
     (no account / no pay)                    Enterprise?
              │                                  │        │
         Interactive demo                       No       Yes
         Role switch / reset                     │        │
              │                                  │        ▼
              │                                  │   Request Enterprise
              │                                  │        │
              ▼                                  │   Schedule → Sales →
        Convert to Paid ─────────────────────────┘   Proposal → Contract →
                                                     Implementation → Prod
              │
              ▼
      Secure Stripe Checkout
              │
      Payment successful
              │
         Create Account
              │
   Automatic org provisioning
              │
   Automatic module activation
              │
         Guided Setup
              │
        Mission Control
```

\*Billing cycle applies to Professional / Business only. Enterprise skips Checkout.

---

## J1 — Self-service subscribe (Professional / Business)

| Step | Customer sees | System does |
|------|---------------|-------------|
| 1 Landing | Brand, value, CTAs | Serve marketing |
| 2 Choose Product | PM / FO / Complete | Persist selection |
| 3 Choose Plan | Professional / Business (+ Enterprise CTA) | Persist tier |
| 4 Choose Billing Cycle | Monthly / Annual | Persist cycle → resolve Stripe Price |
| 5 Start Subscription | Checkout CTA | Create Stripe Checkout Session (`mode: subscription`) |
| 6 Pay | Stripe-hosted Checkout | Collect payment / trial start |
| 7 Success | “Creating your workspace…” | Webhook-driven provision |
| 8 Create Account | Email / password or magic link (design: post-payment account bind) | Link auth user to new org as owner |
| 9 Guided Setup | Checklist | Org already provisioned; customer completes profile/property first steps |
| 10 Mission Control | Ranked attention home | Role-aware routing |

**No employee interaction.**

### Account timing (design decision)

**Preferred sequence (this package):**

1. Stripe Checkout collects email + payment (or trial).  
2. On `checkout.session.completed` / `customer.subscription.created`: create Stripe Customer linkage, provision Organization + subscription row + entitlements.  
3. Redirect to **Create Account** (or password set) bound to Checkout email.  
4. First login → Guided Setup → Mission Control.

Alternate (account-before-pay) is rejected for self-serve default to reduce abandoned half-orgs; may be used only if Approve requires it.

---

## J2 — Live Demo

| Step | Customer sees | System does |
|------|---------------|-------------|
| 1 Choose Product | Demo entry per SKU | Route to demo host |
| 2 Enter demo | Full interactive UI | Issue demo session token; no auth account |
| 3 Operate | Realistic data | Read/write against demo dataset only |
| 4 Switch role | Role switcher | Rebind session persona (manager, owner, tenant, vendor, facility — as product allows) |
| 5 Reset | “Reset demo” | Reload snapshot |
| 6 Expire | Soft end / continue CTA | TTL expiry; destroy session |
| 7 Convert | Start Subscription | Carry product (+ optional plan) into J1 |

**Constraints:** No real organization. No payment. Isolated from production data.

---

## J3 — Enterprise (high-touch)

| Step | Customer sees | System does |
|------|---------------|-------------|
| 1 Landing / Plan | Enterprise highlighted | CTA: Request Enterprise |
| 2 Request | Form (company, portfolio size, product interest, contact) | Create Enterprise lead record; notify sales |
| 3 Schedule Consultation | Calendar booking (external or embedded) | Link lead ↔ meeting |
| 4 Sales | Discovery | CRM / notes (ops tools TBD) |
| 5 Proposal | Commercial proposal | Human-authored |
| 6 Contract | Legal / MSA | Human-authored |
| 7 Implementation | Onboarding plan | Operator provisions via Master Admin + playbooks |
| 8 Production | Mission Control | Entitlements assigned by ops; may use invoice Stripe or offline payment |

**Divergence from self-service:** No public Stripe Checkout. No automatic org create from Checkout. Provisioning is operator-gated.

---

## J4 — Returning customer billing

| Intent | Path |
|--------|------|
| Update payment method | Stripe Customer Portal |
| View invoices / receipts | Customer Portal + in-app Billing |
| Cancel | Portal or in-app → Stripe cancel at period end (default) |
| Upgrade / downgrade | In-app plan change → Stripe subscription update |
| Reactivate | Resubscribe Checkout or Portal |

---

## Journey copy principles

- Customer language only (no “SKU”, “webhook”, “provisioner”, “commercial operations”).  
- Always one obvious next step.  
- Enterprise never looks “broken” for lacking Checkout — it looks intentional.  
