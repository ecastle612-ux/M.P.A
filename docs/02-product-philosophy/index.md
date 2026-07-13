# 02 — Product Philosophy

## Core Belief

M.P.A. is not another property management application. It is an **AI Property Operations Platform**. The software exists to **eliminate headaches**.

If a feature does not solve a real property manager problem, **it should not exist**.

## The Five-Goal Filter

Every feature — before design, before engineering, before AI — must satisfy **at least one** of these goals:

| Goal | Definition | Example |
|------|------------|---------|
| **Save Time** | Removes manual steps, context switching, or duplicate entry | Auto-filled owner report from live ledger + maintenance data |
| **Save Money** | Reduces cost, leakage, or unnecessary spend | Vendor bid comparison; preventive maintenance alerts |
| **Reduce Risk** | Prevents legal, financial, or operational failure | Screening checklist enforcement; lease clause warnings |
| **Improve Communication** | Makes the right message reach the right person at the right time | Owner summary drafts; tenant maintenance status updates |
| **Increase Occupancy** | Reduces vacancy duration or improves conversion | Listing syndication status; application pipeline visibility |
| **Automate Repetitive Work** | Eliminates predictable human labor | Rent reminder sequences; work order routing rules |

If a proposed feature scores zero on this filter, it is rejected regardless of how interesting it sounds.

## What We Refuse to Build

| Anti-Pattern | Why |
|--------------|-----|
| Feature parity chasing | Legacy PM software is bloated because it accumulated decades of checkbox features |
| Dashboard-first design | Pretty charts that don't move work forward create illusion of productivity |
| AI chatbot as the product | Chat is an interface pattern, not a strategy |
| Module silos | "Maintenance app" + "Leasing app" UX creates the exact fragmentation PMs hate |
| Owner/tenant experiences as afterthoughts | Communication failures destroy PM businesses |
| Vendor as contact card | Vendors are economic participants, not address book entries |

## Workflow Over Module

We do not organize the product roadmap by modules. We organize by **business workflows**.

A workflow is a connected chain of decisions, documents, money, and communication. See **05 Business Workflows** for the canonical lifecycle.

When evaluating scope, ask:

1. Which workflow step does this advance?
2. What headache does it eliminate?
3. What happens upstream and downstream?
4. Does AI reduce steps or just add a new screen?

## Headache Elimination Framework

Property managers experience headaches as:

- **Fragmentation** — information in email, spreadsheets, portals, texts
- **Uncertainty** — "Did the vendor show up? Is rent late? Is the owner going to call?"
- **Repetition** — same report, same reminder, same data entry
- **Risk exposure** — missed deadlines, weak documentation, wrong vendor
- **Communication debt** — owners uninformed, tenants frustrated, vendors unclear

Every feature proposal must name which headache type it attacks.

## Premium SaaS Standard

M.P.A. is commercial software. Users pay for outcomes, not experiments.

| Standard | Implication |
|----------|-------------|
| Reliability | Financial and lease operations cannot "mostly work" |
| Clarity | Every action has visible consequence and undo path where safe |
| Speed | Desktop workflows must feel instant; no sluggish tables |
| Trust | AI suggestions are explainable; automation is auditable |
| Identity | Visual design is distinctive — never generic template aesthetics |

## AI Philosophy

AI in M.P.A. is a **capability layer**, not a product category.

- AI **recommends** — humans decide on high-stakes actions (eviction, vendor hire, lease terms)
- AI **drafts** — humans edit and send
- AI **prioritizes** — humans can override
- AI **detects** — humans investigate

See **13 AI Strategy** for capability definitions.

## Vendor Marketplace Philosophy

The Vendor Marketplace is **core infrastructure**, not a feature.

Vendors participate in maintenance, billing, compliance, and communication workflows. The platform must treat vendor identity, performance, availability, pricing, and payment as durable domain concepts — not fields on a work order form.

## Build vs Integrate

| Build | Integrate |
|-------|-----------|
| Workflow orchestration | Accounting GL (QuickBooks, etc.) |
| Owner/tenant communication hub | Listing syndication networks |
| Vendor marketplace operations | Background check providers |
| Embedded AI operations | eSignature (DocuSign, etc.) |
| Rent collection orchestration | Payment rails (Stripe) |

Integrate at boundaries. Own the workflow graph.

## Decision Escalation

When product and engineering disagree:

1. Return to the five-goal filter
2. Map to workflow impact
3. Measure headache elimination
4. If still unclear, defer — do not ship ambiguous value
