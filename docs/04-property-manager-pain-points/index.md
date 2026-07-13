# 04 — Property Manager Pain Points

## Purpose

This document names the operational pain M.P.A. must eliminate. Every workflow, feature, and AI capability should trace back to one or more pain points here.

Pain is categorized by **headache type** (see **02 Product Philosophy**).

---

## 1. Fragmentation Pain

### The Problem
Property managers operate across email, spreadsheets, listing sites, accounting software, vendor texts, owner calls, and tenant portals. No single source of truth exists.

### Manifestations
- Lease terms in one system, rent status in another, maintenance history in a notebook
- Owner asks a question → 20 minutes of assembly from 4 sources
- New staff cannot onboard because knowledge is tribal

### M.P.A. Response
- Unified property graph: people, documents, money, maintenance on one record
- Workflow-connected data — no module boundaries in the underlying model
- Natural language search across operational data (see **13 AI Strategy**)

---

## 2. Vacancy & Leasing Pain

### The Problem
Vacancy is revenue death. Every day empty costs money and owner confidence.

### Manifestations
- Slow application turnaround loses qualified applicants
- Screening bottlenecks and manual document collection
- Lease errors discovered after signing
- Move-in coordination drops items (keys, utilities, deposits)

### M.P.A. Response
- Connected leasing pipeline with stage visibility
- Screening integration with checklist enforcement
- AI lease clause review and risk flags
- Automated move-in task orchestration

**Goals served:** Save Time, Increase Occupancy, Reduce Risk

---

## 3. Rent Collection Pain

### The Problem
Late rent creates cash flow stress, owner anxiety, and awkward tenant conversations.

### Manifestations
- Manual reminder sequences
- Unclear partial payment handling
- Fee calculation inconsistencies
- No early warning on chronic delinquency patterns

### M.P.A. Response
- Automated collection workflows with human override
- Stripe Connect orchestration (not reinventing payments)
- AI risk detection on payment patterns
- Owner-visible collection status without manual report building

**Goals served:** Save Money, Save Time, Reduce Risk, Improve Communication

---

## 4. Maintenance Chaos Pain

### The Problem
Maintenance is the highest-frequency operational workflow and the highest complaint driver.

### Manifestations
- Requests arrive via text, email, phone — no triage system
- Wrong vendor for the job → return trips, owner frustration
- No visibility into status until owner calls angry
- Invoice doesn't match approved scope
- Emergency vs routine not prioritized

### M.P.A. Response
- Unified work order lifecycle with tenant → PM → vendor → owner chain
- AI maintenance prioritization
- Vendor marketplace matching by trade, geography, rating, availability
- Photo/document evidence trail
- Invoice-to-scope reconciliation

**Goals served:** Save Time, Save Money, Improve Communication, Automate Repetitive Work

---

## 5. Vendor Reliability Pain

### The Problem
PM businesses rise and fall on vendor bench strength. Spreadsheets of "guys we know" don't scale.

### Manifestations
- Vendor ghosting on jobs
- No performance history across properties
- Pricing opacity
- Payment delays damage vendor relationships
- Compliance docs (insurance, licenses) expire unnoticed

### M.P.A. Response
- **Vendor Marketplace as core system** — not a contact list
- Vendor profiles, ratings, compliance document tracking
- Job matching and bid workflows
- Integrated payment via Stripe Connect
- Cross-org vendor reputation (with privacy controls)

**Goals served:** Save Money, Reduce Risk, Save Time

---

## 6. Owner Communication Pain

### The Problem
Owners fire PM companies when they feel uninformed, surprised, or ignored.

### Manifestations
- Monthly report assembly takes hours per owner
- Expense surprises without context
- PM can't quickly answer "how's my property doing?"
- Inconsistent report quality across portfolio

### M.P.A. Response
- AI-generated owner summaries from live data
- Scheduled report delivery with approval workflow
- Owner portal with property-scoped visibility
- Expense approval flows before money moves

**Goals served:** Improve Communication, Save Time, Reduce Risk

---

## 7. Compliance & Risk Pain

### The Problem
Property management is liability-intensive. Small mistakes become expensive legal events.

### Manifestations
- Fair housing screening inconsistencies
- Lease clause violations by jurisdiction
- Missing move-in/move-out documentation
- Security deposit handling errors
- Insurance and license expiration on vendors

### M.P.A. Response
- Jurisdiction-aware checklist enforcement
- AI risk detection on lease and screening patterns
- Document retention and audit trails
- Vendor compliance gates before job assignment

**Goals served:** Reduce Risk, Save Money

---

## 8. Reporting & Visibility Pain

### The Problem
PM leadership cannot see portfolio health without manual aggregation.

### Manifestations
- Occupancy calculated manually
- Maintenance backlog invisible until crisis
- Staff workload uneven but unmeasured
- Owner churn signals appear too late

### M.P.A. Response
- Operational dashboards derived from workflow state — not vanity charts
- Predictive signals (vacancy risk, maintenance escalation, payment patterns)
- Natural language queries: "Which properties have open maintenance over 7 days?"

**Goals served:** Save Time, Increase Occupancy, Reduce Risk

---

## 9. Scaling Pain

### The Problem
Processes that work at 30 doors break at 300.

### Manifestations
- Same tasks repeated per property with no templates
- Staff onboarding takes months
- Owner reporting doesn't scale linearly
- Vendor coordination becomes full-time job per coordinator

### M.P.A. Response
- Workflow templates and automation rules
- AI-assisted drafting and prioritization at scale
- Marketplace vendor pool reduces single-threaded vendor dependency
- Role-based access so teams partition work cleanly

**Goals served:** Save Time, Automate Repetitive Work

---

## Pain Priority Matrix (Platform v1)

| Priority | Pain Area | Rationale |
|----------|-----------|-----------|
| P0 | Maintenance + Vendor | Highest frequency, highest churn risk |
| P0 | Owner communication | Directly tied to PM company retention |
| P1 | Rent collection | Cash flow is existential |
| P1 | Leasing pipeline | Vacancy reduction = revenue |
| P2 | Compliance automation | Risk reduction, slower immediate ROI |
| P2 | Portfolio analytics | Leadership value, not day-one blocker |

See **17 Development Roadmap** for delivery sequencing aligned to this matrix.
