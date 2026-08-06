# Launch Readiness — Customer #1 Clarity

**Status:** Draft — awaiting approval  
**Parent:** [24 Product Architecture](./index.md)

Question: Can Customer #1 clearly understand what they bought, which modules they have, what is included, and what requires Complete Platform?

---

## Verdict

**Not ready.**

The platform currently presents as a single Property Manager OS in documentation and as a foundation shell in the application. There is no customer-visible commercial model.

| Clarity question | Ready? | Evidence |
|------------------|:------:|----------|
| What they bought | **No** | No SKU, billing page, or plan name in product |
| What module they have | **No** | Nav is placeholders; Facility absent |
| Capabilities included | **No** | No subscription matrix in product experience |
| What requires Complete | **No** | Complete Platform not defined in prior docs |
| Maintenance vs Facility distinction | **No** | Facility product missing; Maintenance treated as the ops story |
| Master Admin confusion | **N/A for customer** | Must never appear in customer chrome |

---

## Minimum Clarity Bar for Customer #1

Before launch (post-approval implementation):

1. **Plan badge** in org switcher / settings: Property Manager | Facility Operations | Complete Platform
2. **Billing / Plan page** listing included modules (from Subscription Matrix)
3. **Navigation** showing only entitled modules
4. **Upgrade cues** when user hits a Complete-only capability (if on single product)
5. **Guided Setup** that matches the purchased product
6. **Empty states** that never pitch Facility modules to PM-only (and vice versa)
7. **Docs / sales consistency** — Blueprint Vision updated to three offerings

---

## Drift Risks Blocking Clarity

| Drift | Customer impact |
|-------|-----------------|
| Vision = “OS for property managers” only | Facility buyers feel like an afterthought |
| Roadmap sequences PM-only phases as “the product” | Facility never scheduled as a peer |
| Operations Console as the only home | Complete customers lack Facility home |
| Philosophy examples treating preventive maintenance as PM feature | Wrong product ownership signal |
| Continuing CORE-004 / LAUNCH-001 / Financial Ops without SKU framing | Ships confusion faster |

---

## Stopped Workstreams (Clarity Protection)

| Workstream | Why stopped |
|------------|-------------|
| CORE-004 | Must remap to approved ownership |
| LAUNCH-001 | Launch cannot precede commercial IA clarity |
| Financial Operations implementation | In PM commercially, but must not ship without package approval + its own design gate |

---

## Exit Criteria for “Customer #1 Understands”

- [ ] This Product Architecture package Approved
- [ ] ADR-015 Accepted
- [ ] Vision/Philosophy/Roadmap reconciled
- [ ] Entitlement + subscription design Approved
- [ ] Customer plan page copy Approved
- [ ] Nav assembly rules Approved
- [ ] Only then: implement the clarity surfaces above
