# Architecture Review — COM-002

## Verdict (architecture)

The proposed architecture is a credible enterprise SaaS commerce spine: catalog → Checkout → webhook → provisioner → entitlements → Guided Setup → Mission Control, with a parallel Enterprise human path and an isolated Live Demo.

It will not survive tens of thousands of organizations **as written** without tightening: FO honesty, account-bind security, demo tenancy cost, provisioning compensation, and a few lifecycle journeys.

---

## What is strong

| Area | Assessment |
|------|------------|
| Philosophy | Automate Pro/Business; humans for Enterprise — correct for scale |
| ADR-015 preservation | Three products retained; Master Admin non-SKU |
| FIN-OPS boundary | Explicit `saas_billing` vs resident payments — mandatory and well stated |
| Slice plan A–G | Independently testable; good gate discipline |
| Fail-closed entitlements | Aligns with certified commercial integrity |
| Idempotent job keys | Correct instinct for webhook-driven systems |
| Enterprise divergence | Conceptually separate from Checkout |

---

## Structural challenges

### 1. Product readiness vs commercial automation (critical)

COM-002 assumes self-serve purchase of Facility Operations / Complete activates modules immediately. Platform reality (FO module shells / deferred feature depth) conflicts with “automatic module activation” as a customer promise.

**Challenge:** Selling FO/Complete self-serve without a honesty constraint recreates the BUG-003/004 trust failure at payment scale.

**Required direction (A1):** Either (a) self-serve catalog launches with Property Manager only (+ Complete only when FO depth is certified), or (b) COM-002 explicitly defines “commercial entitlement active” vs “operational feature completeness” in customer language and gates FO/Complete self-serve behind FO readiness criteria.

### 2. Pay-before-account is right for abandoned orgs — incomplete for identity

Preferred sequence reduces zombie orgs but creates:

- Race: success redirect vs webhook  
- Bind risk: claiming a Checkout email  
- Orphan Stripe customers if account never completes  

Must be designed as a first-class state machine, not a footnote (A2, A5).

### 3. Demo “identical to production” is an expensive lie if naive

Full interactive clones per session do not scale to viral traffic. Read-mostly shared snapshots + session overlay (or serverless ephemeral schemas with hard caps) must be the default architecture (A3).

### 4. Catalog dimensionality tax

Product × Plan × Cycle is three decisions before money. Competitors often collapse to Plan (+ annual toggle) with product packaging inside the plan. Not fatal, but CX risk (see CX audit).

### 5. Open decisions left too late

O2/O5/O6 are architectural (limits, seats, account timing). Leaving them to “Approve-time” without proposed defaults blocks honest approval of the blueprint (A7).

---

## Architecture score (reviewer)

| Dimension | Score (1–5) | Note |
|-----------|-------------|------|
| Clarity | 4 | Well structured package |
| Completeness | 3 | Missing journeys / compensation |
| Security | 3 | Gaps in bind + demo scrape |
| Scalability | 3 | Demo + webhook ops under-specified |
| Commercial honesty | 2 | FO/Complete self-serve tension |
| Implementability | 4 | Slices are good |

**Overall:** Approve with amendments — do not implement from Draft as-is.
