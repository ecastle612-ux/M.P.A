# Role Experience Philosophy

**Status:** Draft for approval  
**Mandate:** One Progressive Web App. Four completely different experiences. One Canopy design language.

After authentication, each role should feel like software built **only for them** — while still unmistakably M.P.A.

---

## Shared DNA (All Roles)

| Shared | Detail |
|--------|--------|
| Tokens | Canopy colors, type, radius, motion |
| Components | Same button/input/table family |
| Trust cues | Status chips, calm errors, sourced AI |
| Brand | Ink + canopy recognizability |
| Accessibility | WCAG 2.1 AA |

**Not shared:** Information architecture, density, navigation chrome, default landing, content priority.

---

## Property Manager — “Command”

**Feeling:** Precision instrument. Fast. Dense. Keyboard-friendly.  
**Primary device:** Desktop.  
**Home:** Operations Console.

| Trait | Expression |
|-------|------------|
| Structure | Ink sidebar + console split |
| Density | High — portfolio scale |
| Motion | Minimal, functional |
| AI | Triage suggestions, drafts, rankings |
| Success | Clear the queue; advance workflows |

**Nav emphasis:** Operations, Properties, Tenants, Leasing, Maintenance, Marketplace, Payments, Reports, AI Assistant entry points, Settings.

**Must not feel like:** Tenant consumer app or simplified mobile utility.

---

## Tenant — “Home”

**Feeling:** Clear, friendly, mobile-first, low anxiety.  
**Primary device:** Phone.  
**Home:** Today card — rent status, open maintenance, messages.

| Trait | Expression |
|-------|------------|
| Structure | Bottom tabs (Home, Pay, Maintenance, Documents, Messages) |
| Density | Low — one job per screen |
| Motion | Soft, short; reassuring feedback on pay/submit |
| AI | Knowledge answers, form help — never legal advice theater |
| Success | “I paid / I submitted / I understand status” |

**Visual delta:** Larger tap targets; more whitespace; less ink chrome (lighter top bar, no heavy sidebar). Canopy green still marks primary actions (Pay Rent).

**Must not feel like:** PM console shrunk to mobile.

---

## Property Owner — “Clarity”

**Feeling:** Executive calm. Trust and transparency.  
**Primary device:** Tablet / desktop.  
**Home:** Portfolio snapshot — performance narrative + items needing approval.

| Trait | Expression |
|-------|------------|
| Structure | Simple top nav: Properties, Reports, Approvals, Messages |
| Density | Medium — summary first, detail on demand |
| Motion | Quiet; report transitions fade |
| AI | Readable monthly narratives (PM-approved before publish) |
| Success | “I understand my property without calling my PM” |

**Visual delta:** More editorial typography in reports (Satoshi titles, generous measure); charts allowed here; still no widget carnival.

**Must not feel like:** Accounting ERP or PM’s internal triage tool.

---

## Vendor — “Jobs”

**Feeling:** Field-ready. Direct. Mobile-first. Earn and go.  
**Primary device:** Phone.  
**Home:** Job inbox — new invites, active jobs, blockers.

| Trait | Expression |
|-------|------------|
| Structure | Bottom tabs: Jobs, Bids, Active, Payments, Profile |
| Density | Medium — list of jobs with sharp status |
| Motion | Crisp state changes (accepted, en route, complete) |
| AI | Job summary / checklist assists — optional |
| Success | “I know where to be and when I get paid” |

**Visual delta:** Status-forward lists; large primary CTAs (Accept, Update status, Submit invoice); map/deeplink affordances later. Compliance warnings unavoidable and clear.

**Must not feel like:** Owner report portal or PM marketplace admin.

---

## Portal Shell Comparison

| Element | PM | Tenant | Owner | Vendor |
|---------|----|--------|-------|--------|
| Sidebar | Yes (ink) | No | Optional slim | No |
| Bottom nav | No (desktop) | Yes | Rare | Yes |
| Default home | Ops Console | Today | Portfolio | Job inbox |
| Tables | Primary | Rare | Reports | Job lists |
| Charts | Reports only | No | Yes | Earnings simple |
| ⌘K | Essential | Optional light | Helpful | Optional |

---

## Cross-Plane Users

One human may be a PM and an owner. UX rules:

1. Post-login **role chooser** when multiple planes exist
2. Persistent **plane switcher** in account menu
3. Never blend permissions into one confused chrome
4. Visual shell swaps completely on switch (not just data filter)

---

## Onboarding Tone by Role

| Role | First-run focus |
|------|-----------------|
| PM | Create org → first property → invite team |
| Tenant | Verify lease access → set payment method |
| Owner | View linked properties → notification prefs |
| Vendor | Profile + compliance docs → availability |

Same Canopy components; different scripts and pacing.

---

## The Role Test

For each portal screenshot (logo hidden):

1. Can you tell which role it is in under 2 seconds?
2. Does it still look like M.P.A. (Canopy)?
3. Would that role enjoy opening it daily?

If (1) fails → IA too similar. If (2) fails → tokens drifting. If (3) fails → density/emotion wrong.

---

## Related Documents

- [Operations Console](./operations-console.md) — PM signature
- [Visual Identity Guide](./visual-identity-guide.md)
- **03** User Personas
- **07** UX Principles
