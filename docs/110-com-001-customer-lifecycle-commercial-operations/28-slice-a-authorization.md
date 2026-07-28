# 28 — COM-001 Slice A Authorization

**Package:** COM-001 — Customer Lifecycle & Commercial Operations  
**Slice:** **A — Commercial data foundation** (pipeline · activation contract · org↔opportunity link)  
**Status:** ✅ **AUTHORIZED** · Implementation ✅ **COMPLETE** ([29](./29-slice-a-implementation.md)) · Validation ✅ **PASS** ([30](./30-slice-a-validation.md))  
**Authorization date:** 2026-07-24  
**Binding phrase (issued):**

```
AUTHORIZE COM-001 SLICE A
```

**Validation phrase (to be issued after implementation):**

```
VALIDATE COM-001 SLICE A
```

**Program record:** [CORE-003 §46](../113-core-003-implementation-master-plan/46-com-001-slice-a-authorization.md)  
**Next-workstream recommendation:** [CORE-003 §45](../113-core-003-implementation-master-plan/45-next-workstream-recommendation.md)  
**Slice catalog:** [26 — Implementation slices](./26-implementation-slices.md)  
**Prior package spine:** AUTH-001 Slices A–E ✅ **VALIDATED** / **COMPLETE** ([AUTH-001 §49](../109-auth-001-organization-provisioning-authentication/49-slice-e-validation.md))  
**Package approval:** [27 — Approval record](./27-approval-record.md) · ✅ APPROVED WITH AMENDMENTS  
**ADR:** [ADR-027](../18-decision-log/adr-027-customer-lifecycle-commercial-operations.md) (**Accepted**)  
**Design SoT:** [17 — Sales pipeline](./17-sales-pipeline.md) · [02 — Sales-to-customer workflow](./02-sales-to-customer-workflow.md) · [01 — Customer lifecycle](./01-customer-lifecycle.md) · [13 — Handoffs](./13-handoffs.md) · [12 — Acceptance criteria](./12-acceptance-criteria.md) (P-01 · P-02) · [26](./26-implementation-slices.md) Slice A · [AUTH-001 §05](../109-auth-001-organization-provisioning-authentication/05-subscription-activation-workflow.md) (activation packet)  
**AUTH foundation:** AUTH-001 Slice B ✅ **VALIDATED** (provision / activation consumer) · AUTH-001 A–E ✅ **COMPLETE**  
**OPS foundation:** OPS-001 Slice A ✅ **VALIDATED** — secret-free bus / timeline for activation outcomes  
**UX foundation (any UI):** UX-012 Slice A ✅ **VALIDATED** — `--mpa-*` tokens only  
**Billing boundary:** BILL-001 remains SaaS money rail (Payment Successful source of truth)  
**Program order:** CORE-003 **M2.2** ([05](../113-core-003-implementation-master-plan/05-master-implementation-order.md))

> Phrase **`AUTHORIZE COM-001 SLICE A` issued**. Implementation may begin **only** within the scope below.  
> COM-001 Slice B · OPS-001 Slice B · UX-012 Slice B · PMX-004 Phase 2 remain **locked**.  
> Do **not** begin implementation of excluded packages under this phrase.

---

## 1. Prerequisite verification

| Prerequisite | Evidence | Status |
|--------------|----------|--------|
| COM-001 Approved with Amendments | [27](./27-approval-record.md) · A01–A09 | ✅ |
| ADR-027 Accepted | [ADR-027](../18-decision-log/adr-027-customer-lifecycle-commercial-operations.md) | ✅ |
| Implementation slices finalized | [26](./26-implementation-slices.md) | ✅ |
| Slice A preconditions (approval record) | [27](./27-approval-record.md) §§ Amendments / slices | ✅ |
| M0 = GO | [CORE-003 §36](../113-core-003-implementation-master-plan/36-final-m0-governance-review.md) | ✅ |
| UX-012 Slice A Validated | [UX-012 §32](../112-ux-012-platform-experience-design-system/32-slice-a-validation.md) · **PASS** | ✅ |
| OPS-001 Slice A Validated | [OPS-001 §34](../111-ops-001-platform-operations-architecture/34-slice-a-validation-rerun.md) · **PASS** | ✅ |
| AUTH-001 Slice B Validated (activation handoff) | [AUTH-001 §40](../109-auth-001-organization-provisioning-authentication/40-slice-b-validation-rerun.md) · **PASS** | ✅ |
| AUTH-001 Slices A–E COMPLETE | [AUTH-001 §49](../109-auth-001-organization-provisioning-authentication/49-slice-e-validation.md) · **PASS** | ✅ |
| CORE-003 M2.2 order · next-workstream recommendation | [05](../113-core-003-implementation-master-plan/05-master-implementation-order.md) · [45](../113-core-003-implementation-master-plan/45-next-workstream-recommendation.md) | ✅ |
| No unfinished Authorized slice blocking serial rule | AUTH-E Validated | ✅ |
| COM-001 Slice B | Not authorized | ✅ (correct) |
| OPS-001 Slice B | Not authorized | ✅ (correct) |
| UX-012 Slice B | Not authorized | ✅ (correct) |
| PMX-004 Phase 2 | Locked | ✅ (excluded) |
| Explicit authorize phrase recorded | **This document** | ✅ |

**Governance blockers remaining for Slice A?** ❌ **None.**

---

## 2. Authorization scope

### In scope (Slice A)

| Deliverable | Binding source |
|-------------|----------------|
| **Opportunity / sales pipeline data model** with stages Lead → … → Customer Active | [17](./17-sales-pipeline.md) · SP-01… |
| **Required opportunity fields** (Source, Sales Owner, Expected Close, Probability, Lost Reason, CAC, Referral, Demo Completed) | [17](./17-sales-pipeline.md) · SP-02 · SP-03 |
| **Activation event contract** (Payment Successful → AUTH-001 provision handoff packet) | [02](./02-sales-to-customer-workflow.md) · [13](./13-handoffs.md) H2 · P-02 |
| **Idempotent activation** keyed for AUTH-001 provision (no duplicate orgs) | [26](./26-implementation-slices.md) · AUTH-001 Slice B ledger patterns |
| **org ↔ opportunity link** after successful provision | [17](./17-sales-pipeline.md) · [01](./01-customer-lifecycle.md) |
| **Won ↛ Organization** enforcement — org creation only after Payment Successful (or audited Master Admin commercial exception that still emits activation) | [17](./17-sales-pipeline.md) · SP-04 · P-01 · C2 |
| **Secret-free OPS domain events** for commercial activation / opportunity outcomes (reuse OPS-001 Slice A bus) | OPS-001 Slice A · COM binding events |
| **Ops-minimum surfaces** only (API / service / minimal staff tooling) — no commercial dashboard productization | [26](./26-implementation-slices.md) |

### Implementation boundaries

1. Work is limited to **commercial data foundation**: pipeline/opportunity model, activation contract, org↔opportunity linkage, and AUTH handoff — not trial UX, health scores, offboarding, or staff commercial dashboard.  
2. Reuse **AUTH-001 Slice B** provision path (`provisionOrganizationFromActivation` / activation ledger) — do **not** invent a parallel org-create channel that bypasses Payment Successful / activation.  
3. **BILL-001** remains the money rail; Slice A consumes Payment Successful / activation signals — it does **not** redesign Stripe Billing.  
4. **Won does not create an organization**; Subscription Purchased / Payment Successful does ([17](./17-sales-pipeline.md) · SP-04).  
5. Public self-registration as acquisition remains **forbidden** (C6 · invitation-only).  
6. Any **UI** touched under Slice A **must** consume UX-012 Slice A tokens (`--mpa-*`) — no UX-012 Slice B chrome / Command Center productization.  
7. OPS events are **secret-free** (ids / stage / status / reason codes only).  
8. External CRM deep sync is **optional** and not required for Slice A PASS (event/API may suffice).  
9. Material scope beyond Slice A requires a new authorize phrase (COM-B+ / other packages).

### Includes (explicit)

- Persistable opportunity records with COM-001 pipeline stages  
- Stage transitions with Lost Reason required on Lost  
- Activation handoff packet fields per [02](./02-sales-to-customer-workflow.md) (`saas_subscription_id`, `plan_code`, `organization_type`, `buyer_contact_email`, `buyer_company_name`, `implementation_preference`, `sales_owner_id`, `idempotency_key`)  
- Wiring activation → AUTH-001 provision (idempotent)  
- Link created `organization_id` back to opportunity  
- Auditable / secret-free commercial activation outcomes on OPS Slice A bus  
- Minimal staff/ops API or tooling sufficient to exercise pipeline + activation (not Slice E dashboard)

---

## 3. Excluded functionality (explicit)

| Excluded | Remains |
|----------|---------|
| COM-001 Slice B (implementation progress · trial experience) | Separate authorize |
| COM-001 Slice C (health · discovery · communication timeline) | Separate authorize |
| COM-001 Slice D (offboarding · CS automation) | Separate authorize |
| COM-001 Slice E (staff commercial dashboard · marketplace prep) | Separate authorize |
| OPS-001 Slice B (notify / automation productization) | Separate authorize |
| UX-012 Slice B (role chrome / Command Center productization) | Separate authorize |
| PMX-004 Phase 2 | `AUTHORIZE PMX-004 PHASE 2` |
| Certified partner marketplace UI | Post–E / separate |
| External CRM deep sync productization | Optional / ops choice |
| New BILL-001 / Stripe Checkout redesign | BILL-001 gates |
| AUTH-001 new identity/recovery productization | AUTH A–E already Validated — reuse only |
| FIN-003 Phase C+ | Separate CORE-003 M4+ gates |
| Public signup / open registration | Forbidden permanently under C6 |

---

## 4. Dependencies

| Dependency | Role |
|------------|------|
| COM-001 Approved with Amendments · ADR-027 | Commercial SoT |
| CORE-003 M0 = GO · M2.2 order | Program unlock / sequence |
| AUTH-001 Slice B Validated | Idempotent org provision consumer |
| AUTH-001 A–E COMPLETE | Identity / provision / invite / roles / recovery stable for handoff |
| OPS-001 Slice A Validated | Secret-free event bus |
| UX-012 Slice A Validated | Token foundation if any UI |
| BILL-001 boundary | Payment Successful / subscription facts |

**Does not depend on:** OPS-001 Slice B · UX-012 Slice B · PMX-004 Phase 2 · COM-001 Slice B+ · FIN-003 C.

---

## 5. Acceptance criteria (Slice A) — CA-01 … CA-10

| ID | Criterion |
|----|-----------|
| **CA-01** | **Pipeline model** — opportunity records support COM-001 stages Lead → … → Customer Active (and Lost) with stage semantics from [17](./17-sales-pipeline.md). |
| **CA-02** | **Required fields** — Source, Sales Owner, Expected Close, Probability, Lost Reason (on Lost), CAC, Referral Source, Demo Completed are capturable (SP-02 · SP-03). |
| **CA-03** | **Won ↛ org** — transitioning to Won (or earlier) does **not** create an organization; provision requires Payment Successful / activation (SP-04 · P-01 · C2). |
| **CA-04** | **Activation packet** — activation/handoff always carries required COM-001 fields including `idempotency_key` (P-02 · [02](./02-sales-to-customer-workflow.md)). |
| **CA-05** | **Idempotent AUTH handoff** — repeated activation with the same idempotency key does not create duplicate organizations; links to AUTH-001 Slice B provision ledger. |
| **CA-06** | **org ↔ opportunity link** — after successful provision, opportunity records the resulting `organization_id` (and stage advances appropriately toward Organization Created / Customer Active). |
| **CA-07** | **Master Admin exception path** — any Level-0 foreshadow/manual commercial exception still emits activation / audit and does not invent silent orgs without commercial trail. |
| **CA-08** | **OPS / secrets** — commercial activation OPS payloads are secret-free; no plaintext credentials or payment secrets on bus/timeline. |
| **CA-09** | **Regression / invitation-only** — AUTH-001 A–E login/provision/invite/role/recovery surfaces remain green; public self-registration remains forbidden. |
| **CA-10** | **Documentation & scope** — implementation summary + validation evidence recorded; no COM-B / OPS-B / UX-012 B / PMX-004 Phase 2 / unauthorized workflows shipped under this authorize. |

---

## 6. Exit criteria (Validation)

Slice A exits **Validated** only when **all** are true:

1. Acceptance criteria **CA-01–CA-10** PASS.  
2. Won cannot create orgs; Payment Successful / activation → AUTH provision certified idempotent.  
3. Opportunity↔organization linkage exists for provisioned customers.  
4. No unresolved **critical** defects.  
5. Documentation updated (implementation summary + validation report + board status).  
6. Governance recommendation recorded.  
7. Validation phrase recorded:

```
VALIDATE COM-001 SLICE A
```

Until Validation is recorded: COM-001 Slice B and other packages remain subject to their own authorize phrases. OPS-001 Slice B · UX-012 Slice B · PMX-004 Phase 2 remain locked regardless of this authorize.

---

## 7. Remediation process (if Validation FAIL)

If `VALIDATE COM-001 SLICE A` results in **FAIL**:

1. **Preserve** the FAIL validation report (do not rewrite history).  
2. Document defects with severity and binding criterion IDs (CA-xx / SP-xx / P-01–P-02).  
3. Produce a **remediation** record limited to fixing authorized Slice A defects — no scope expansion into COM-B / OPS-B / UX-012 B / other packages.  
4. Re-run validation under phrase **`VALIDATE COM-001 SLICE A`** (or a clearly labeled re-run document) until **PASS** or gate owners halt.  
5. Other packages stay locked until their own authorize phrases.

---

## 8. Deferred / outside Slice A

| Item | Disposition |
|------|-------------|
| COM-001 Slice B | Eligible after Slice A Validated · **not** authorized by this document |
| OPS-001 Slice B | Eligible separately after COM-A per M2 · **not** authorized |
| UX-012 Slice B | Eligible separately · **not** authorized |
| PMX-004 Phase 2 | Separate authorize |
| Commercial dashboard / marketplace | Slice E / post–E |
| Trial / health / offboarding productization | Slices B–D |

---

## 9. Recommendation

1. ✅ Phrase **`AUTHORIZE COM-001 SLICE A` issued** (this document).  
2. ✅ **Recommend begin** COM-001 Slice A **implementation** within the scope above.  
3. ❌ Do **not** authorize or begin COM-001 Slice B · OPS-001 Slice B · UX-012 Slice B · PMX-004 Phase 2 under this phrase.  
4. After implementation: issue **`VALIDATE COM-001 SLICE A`** in a separate session.
