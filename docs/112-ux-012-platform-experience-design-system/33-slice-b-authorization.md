# 33 — UX-012 Slice B Authorization

**Package:** UX-012 — Platform Experience & Design System  
**Slice:** **B — Core components**  
**Status:** ✅ **AUTHORIZED** · Implementation ✅ **IMPLEMENTED** ([34](./34-slice-b-implementation.md)) · Validation ✅ **PASS** ([35](./35-slice-b-validation.md))  
**Authorization date:** 2026-07-25  
**Binding phrase (issued):**

```
AUTHORIZE UX-012 SLICE B
```

**Validation phrase (to be issued after implementation):**

```
VALIDATE UX-012 SLICE B
```

**Program record:** [CORE-003 §59](../113-core-003-implementation-master-plan/59-ux-012-slice-b-authorization.md)  
**Prior slice:** [32 — Slice A Validation](./32-slice-a-validation.md) · ✅ **PASS**  
**Slice catalog:** [19 — Implementation slices](./19-implementation-slices.md)  
**Package approval:** [29 — Approval record](./29-approval-record.md) · ✅ APPROVED WITH AMENDMENTS  
**ADR:** [ADR-029](../18-decision-log/adr-029-platform-experience-design-system.md) (**Accepted**)  
**Design SoT:** [03 — Component standards](./03-component-standards.md) · [02 — Design system](./02-design-system.md) · [05 — Navigation architecture](./05-navigation-architecture.md) · [04 — Layout system](./04-layout-system.md) · [12 — Accessibility](./12-accessibility.md) (basics for primitives) · [22 — Design token governance](./22-design-token-governance.md) · [25 — Design quality standards](./25-design-quality-standards.md) · [26 — Component maturity model](./26-component-maturity-model.md) · [28 — Design review process](./28-design-review-process.md) · [19](./19-implementation-slices.md) Slice B  
**Token foundation:** UX-012 Slice A ✅ **VALIDATED** — `--mpa-*` / Canopy tokens only (no parallel token system)  
**Program order:** CORE-003 **M2.4** ([05](../113-core-003-implementation-master-plan/05-master-implementation-order.md)) · after OPS-001 Slice B ✅ **VALIDATED** ([OPS-001 §37](../111-ops-001-platform-operations-architecture/37-slice-b-validation.md))

> Phrase **`AUTHORIZE UX-012 SLICE B` issued**. Implementation may begin **only** within the scope below.  
> UX-012 Slices C–E · OPS-001 Slices C–E · PMX-004 Phase 2 · FIN-003 Phases C–E · certified partner marketplace UI remain **locked**.  
> Do **not** begin implementation of excluded packages under this phrase.

---

## 1. Prerequisite verification

| Prerequisite | Evidence | Status |
|--------------|----------|--------|
| UX-012 Approved with Amendments | [29](./29-approval-record.md) · A01–A08 | ✅ |
| ADR-029 Accepted | [ADR-029](../18-decision-log/adr-029-platform-experience-design-system.md) | ✅ |
| Canopy Approved (token values) | [06 Design Language](../06-design-language/index.md) | ✅ |
| Implementation slices finalized | [19](./19-implementation-slices.md) | ✅ |
| Slice B design SoT | [03](./03-component-standards.md) · [05](./05-navigation-architecture.md) · [26](./26-component-maturity-model.md) | ✅ |
| M0 = GO | [CORE-003 §36](../113-core-003-implementation-master-plan/36-final-m0-governance-review.md) · **GO** | ✅ |
| UX-012 Slice A Validated | [32](./32-slice-a-validation.md) · **PASS** | ✅ |
| OPS-001 Slice A Validated | [OPS-001 §34](../111-ops-001-platform-operations-architecture/34-slice-a-validation-rerun.md) · **PASS** | ✅ |
| OPS-001 Slice B Validated | [OPS-001 §37](../111-ops-001-platform-operations-architecture/37-slice-b-validation.md) · **PASS** · [CORE-003 §58](../113-core-003-implementation-master-plan/58-ops-001-slice-b-validation.md) | ✅ |
| AUTH-001 Slices A–E COMPLETE | [AUTH-001 §49](../109-auth-001-organization-provisioning-authentication/49-slice-e-validation.md) · **PASS** | ✅ |
| COM-001 Slices A–E COMPLETE | [COM-001 §42](../110-com-001-customer-lifecycle-commercial-operations/42-slice-e-validation.md) · **PASS** | ✅ |
| CORE-003 M2.4 dependency (UX-A Validated) | [05](../113-core-003-implementation-master-plan/05-master-implementation-order.md) | ✅ |
| No unfinished Authorized slice blocking serial rule | OPS-B Validated · no open authorize | ✅ |
| UX-012 Slice C–E | Not authorized | ✅ (correct — excluded) |
| OPS-001 Slice C–E | Not authorized | ✅ (correct — excluded) |
| PMX-004 Phase 2 | Locked | ✅ (excluded) |
| FIN-003 Phases C–E | Locked | ✅ (excluded) |
| Certified partner marketplace UI | Locked | ✅ (excluded) |
| Explicit authorize phrase recorded | **This document** | ✅ |

**Governance blockers remaining for Slice B?** ❌ **None.**

**Order note:** CORE-003 lists UX-012 Slice B at **M2.4** (depends on UX-A Validated). OPS-B (M2.3) is Validated. This phrase authorizes **UX-012 Slice B (M2.4)** only.

---

## 2. Authorization scope

### In scope (Slice B)

| Deliverable | Binding source |
|-------------|----------------|
| **Core components** — shared primitives (Button, Input/Textarea/Select, Checkbox/Radio/Switch, Badge/Tag, Avatar, Link, Icon, Tabs, Menu/Combobox, Tooltip, Modal/Drawer/Sheet, Toast/Banner, Skeleton, Progress) with required states | [03](./03-component-standards.md) · [19](./19-implementation-slices.md) |
| **Forms** — form-field pattern (label + control + hint + error); destructive confirm verb standards | [03](./03-component-standards.md) |
| **Navigation** — shared nav chrome / patterns per architecture (shell nav consistency; not role-home redesign) | [05](./05-navigation-architecture.md) |
| **Tables** — shared data-table density / header / row / empty patterns using tokens | [03](./03-component-standards.md) · [04](./04-layout-system.md) |
| **Cards** — shared card container pattern for interactive/list surfaces where a card is the interaction container | [03](./03-component-standards.md) · [04](./04-layout-system.md) |
| **Token consumption** — all Slice B UI uses UX-012 Slice A / Canopy `--mpa-*` (or mapped theme tokens); no parallel design system | [22](./22-design-token-governance.md) · Slice A |
| **Component maturity** — shared primitives advanced toward **Beta → Production** maturity for touched families | [26](./26-component-maturity-model.md) |
| **Accessibility basics** — keyboard focus, labels, disabled/loading states, focus trap on modal/drawer for touched primitives | [12](./12-accessibility.md) (basics only — full journey a11y is Slice D) |
| **Design review + quality** — Design Review Process + quality standards applied to Slice B surfaces before validation close | [28](./28-design-review-process.md) · [25](./25-design-quality-standards.md) |

### Implementation boundaries

1. Work is limited to **core shared components · forms · navigation patterns · tables · cards** — not role dashboards, Command Center productization, role playbook homes, AI chrome, motion system shipping, full a11y sweep, or final polish.  
2. **Preserve UX-012 Slice A** — token / typography / spacing / color foundations unchanged; Slice B **consumes** them.  
3. Prefer extending `packages/ui` / existing primitives over inventing parallel controls for the same job ([03](./03-component-standards.md)).  
4. Touch product screens only as required to adopt shared primitives — do not redesign AUTH / COM / OPS workflows or business logic.  
5. Navigation work is **shared chrome / pattern consistency**, not Slice C role-surface or Command Center composition.  
6. Cards are allowed as interaction containers per existing product rules — do not introduce dashboard card sprawl as marketing chrome.  
7. No schema, auth model, payments, messaging bus, or PWA architecture changes under this authorize.  
8. Material scope beyond Slice B requires a new authorize phrase (Slice C+ / other packages).

### Includes (explicit)

- Tokenized shared primitive families listed above (or documented subset that covers Slice B validation: component states · nav patterns · table density)  
- Form-field and related form patterns  
- Shared navigation pattern alignment in `packages/ui` / shell nav consumers as needed  
- Shared table + card patterns  
- Maturity / a11y-basics evidence for touched primitives  
- Implementation summary + validation evidence under UB-01…UB-10  

---

## 3. Excluded functionality (explicit)

| Excluded | Remains |
|----------|---------|
| UX-012 Slice C — Role dashboards · Command Center · role experiences / playbooks UI | Separate authorize |
| UX-012 Slice D — AI experience · motion shipping · full a11y sweep · responsive overhaul | Separate authorize |
| UX-012 Slice E — Visual polish · microinteractions · performance · final UX validation | Separate authorize |
| OPS-001 Slices C–E | Separate authorize (locked) |
| PMX-004 Phase 2 | `AUTHORIZE PMX-004 PHASE 2` |
| FIN-003 Phases C–E | FIN-003 phase authorize |
| Certified partner marketplace UI | Separate authorize |
| Competing design systems / one-off token sets | Forbidden ([18](./18-acceptance-criteria.md)) |
| User-selectable dashboards / bolt-on purple AI chrome | Forbidden package-wide |
| AUTH / COM / OPS product workflow redesign | Separate package gates |

---

## 4. Dependencies

| Dependency | Role |
|------------|------|
| UX-012 Approved with Amendments · ADR-029 | Experience SoT |
| UX-012 Slice A Validated | Token / foundation substrate |
| Canopy Approved | Token values / visual identity |
| CORE-003 M0 = GO · M2.4 order | Program unlock / sequence slot |
| Existing `packages/ui` / app shell | Implementation substrate |

**Does not depend on:** UX-012 C–E · OPS-001 C–E · PMX-004 Phase 2 · FIN-003 C–E · certified partner marketplace UI · new AUTH/COM slices.

**Program sequencing note:** OPS-001 Slice B Validated is the prior M2 peer; Slice B UX does not require OPS-C data (Command Center data completeness is Slice C / later).

---

## 5. Acceptance criteria (Slice B) — UB-01 … UB-10

| ID | Criterion |
|----|-----------|
| **UB-01** | **Core primitives** — shared primitive families required for Slice B (at minimum Button, Input/Select, and the table/card/nav-adjacent controls touched) exist as one tokenized family with documented required states ([03](./03-component-standards.md)). |
| **UB-02** | **Forms** — form-field pattern (label + control + hint + error) is available and used on touched form surfaces; destructive confirms use explicit verbs. |
| **UB-03** | **Navigation patterns** — shared navigation chrome/patterns align to [05](./05-navigation-architecture.md) for touched shell/nav surfaces without shipping Slice C role homes. |
| **UB-04** | **Tables** — shared data-table pattern supports density / header / row / empty states using Slice A tokens on touched tables. |
| **UB-05** | **Cards** — shared card pattern is tokenized and used only where a card is the interaction container (no parallel card styling systems). |
| **UB-06** | **Token governance** — Slice B UI consumes UX-012 Slice A / Canopy tokens only; no new hardcoded color/type/shadow systems on touched surfaces ([22](./22-design-token-governance.md)). |
| **UB-07** | **Maturity + a11y basics** — touched shared primitives meet Beta→Production intent for states/focus/labels; modal/drawer focus trap where applicable ([26](./26-component-maturity-model.md) · [12](./12-accessibility.md) basics). |
| **UB-08** | **Design review + quality** — Design Review Process ([28](./28-design-review-process.md)) and applicable quality standards ([25](./25-design-quality-standards.md)) completed for Slice B surfaces before validation close. |
| **UB-09** | **Regression** — UX-012 Slice A foundations remain green; no AUTH/COM/OPS workflow redesign; package fail conditions in [18](./18-acceptance-criteria.md) not violated. |
| **UB-10** | **Documentation & scope** — implementation summary + validation evidence recorded; no UX-012 C–E · OPS-001 C–E · PMX-004 Phase 2 · FIN-003 C–E · certified partner marketplace UI / unauthorized workflows shipped under this authorize. |

---

## 6. Exit criteria (Validation)

Slice B exits **Validated** only when **all** are true:

1. Acceptance criteria **UB-01–UB-10** PASS.  
2. Component states evidenced for touched primitive families.  
3. Nav patterns + table density evidenced on touched surfaces.  
4. Design Review Process completed for Slice B scope.  
5. No unresolved **critical** defects.  
6. Documentation updated (implementation summary + validation report + board status).  
7. Governance recommendation recorded.  
8. Validation phrase recorded:

```
VALIDATE UX-012 SLICE B
```

Until Validation is recorded: UX-012 Slices C–E · OPS-001 C–E · PMX-004 Phase 2 · FIN-003 C–E · partner marketplace UI remain subject to their own authorize phrases regardless of this authorize.

---

## 7. Remediation process (if Validation FAIL)

If `VALIDATE UX-012 SLICE B` results in **FAIL**:

1. **Preserve** the FAIL validation report (do not rewrite history).  
2. Document defects with severity and binding criterion IDs (UB-xx / Q-xx / design doc refs).  
3. Produce a **remediation** record limited to fixing authorized Slice B defects — no scope expansion into UX-012 C–E · OPS-001 C–E · PMX-004 Phase 2 · FIN-003 · partner marketplace UI.  
4. Re-run validation under phrase **`VALIDATE UX-012 SLICE B`** (or a clearly labeled re-run document) until **PASS** or gate owners halt.  
5. Other packages stay locked until their own authorize phrases.

---

## 8. Deferred / outside Slice B

| Item | Disposition |
|------|-------------|
| UX-012 Slices C–E | Locked until each `AUTHORIZE UX-012 SLICE …` |
| OPS-001 Slices C–E | Locked until each `AUTHORIZE OPS-001 SLICE …` |
| PMX-004 Phase 2 | Separate authorize |
| FIN-003 Phases C–E | Separate authorize |
| Certified partner marketplace UI | Separate authorize |
| Command Center / role playbook homes | Slice C |
| Full WCAG journey sweep / AI chrome / motion shipping | Slice D |
| Final polish / experience metrics baselines | Slice E |

---

## 9. Recommendation

| Field | Result |
|-------|--------|
| **Authorize Slice B?** | ✅ **YES — AUTHORIZED** |
| **Begin implementation?** | ✅ **YES** — completed ([34](./34-slice-b-implementation.md)) |
| **Begin validation now?** | ✅ Completed — **PASS** ([35](./35-slice-b-validation.md)) |
| **Authorize C–E / OPS-C / PMX-2 / FIN-C / marketplace UI?** | ❌ **NO** |

**Follow-on:** `VALIDATE UX-012 SLICE B` → ✅ **PASS** ([35](./35-slice-b-validation.md)).

---

## Sign-off

| Role | Decision | Date |
|------|----------|------|
| Governance / Product Owner authority | ✅ **AUTHORIZE UX-012 SLICE B** | 2026-07-25 |
| Implementation | ✅ **IMPLEMENTED** ([34](./34-slice-b-implementation.md)) | 2026-07-25 |
| Validation | ✅ **PASS** · `VALIDATE UX-012 SLICE B` ([35](./35-slice-b-validation.md)) | 2026-07-26 |
