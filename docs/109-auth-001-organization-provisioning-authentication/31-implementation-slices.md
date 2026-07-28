# 31 — Implementation Slices

**Package:** AUTH-001  
**Amendment:** A08  
**Status:** Binding (Approved with Amendments)  
**Implementation:** Slice A ✅ **VALIDATED** ([35](./35-slice-a-validation.md)) · Slice B ✅ **VALIDATED** ([40](./40-slice-b-validation-rerun.md)) · Slice C ✅ **VALIDATED** ([43](./43-slice-c-validation.md) · **PASS**) · Slice D ✅ **VALIDATED** ([46](./46-slice-d-validation.md) · **PASS**) · Slice E ✅ **VALIDATED** ([49](./49-slice-e-validation.md) · **PASS**)

---

## Gate per slice

```
Design (this package) → Approval (package + slice unlock) → Implementation → Validation
```

**No slice may begin implementation until the prior slice is Validated**, unless gate owners record an explicit parallel exception (not the default).

Phrase examples:

```
AUTHORIZE AUTH-001 SLICE A
VALIDATE AUTH-001 SLICE A
AUTHORIZE AUTH-001 SLICE B
```

---

## Slice catalog

### Slice A — Identity foundation

| Field | Content |
|-------|---------|
| **Scope** | Identity Adapter · Username authentication · First login · Password change |
| **Includes** | Username principal model; login by username; temp→permanent password; invitation-only entrypoint hardening (remove/disable public signup); session revoke on password change |
| **Depends on** | AUTH-001 Approved with Amendments |
| **Validation** | Login/username/password/first-login cert; no public signup creates accounts |

### Slice B — Organization provisioning

| Field | Content |
|-------|---------|
| **Scope** | Organization provisioning · Organization Administrator · Subscription assignment |
| **Includes** | BILL-001 activation → org create; plan/modules bind; Org Admin provision; org status `Trial` / `Pending Setup`; capability matrix enforcement hooks ([26](./26-subscription-capability-matrix.md)) |
| **Depends on** | Slice A Validated |
| **Validation** | Idempotent provision; one Org Admin; plan capabilities applied |

### Slice C — Invitations & credentials delivery

| Field | Content |
|-------|---------|
| **Scope** | Invitation system · Temporary passwords · Email flow |
| **Includes** | Invite → accept → activate; temp password issuance/TTL; EML-001 welcome/invite templates; contact email verification |
| **Depends on** | Slice B Validated |
| **Validation** | Invite-only join path; temp single-use; emails delivered/retried |

### Slice D — Authorization surfaces

| Field | Content |
|-------|---------|
| **Scope** | Permission engine · Role management · Dashboard assignment |
| **Includes** | Role templates; property scopes; deterministic dashboard resolution; hide unpurchased modules; elevation bans |
| **Depends on** | Slice C Validated |
| **Validation** | Wrong dashboard unreachable; unpurchased modules absent; permission tests pass |
| **M0 deferral (CORE-003)** | Per [`CORE-003-AMD-M0-AUTH-ROLE-CERT-DEFER`](../113-core-003-implementation-master-plan/33-core-003-amd-m0-auth-role-cert-defer.md) ✅ APPROVED, certification of **Organization Administrator**, **Leasing Agent**, and **Facility Technician** is owned by Slice D — not M0 |

#### Slice D — COMPLETE criteria (binding addition)

Slice D **SHALL NOT** be declared **COMPLETE** until all of the following PASS:

1. Organization Administrator implemented (first-class membership / surfaces per AUTH-001)  
2. Leasing Agent implemented  
3. Facility Technician implemented  
4. Dashboard routing verified  
5. Permission boundaries verified  
6. Organization isolation verified  
7. Authenticated regression certification PASS for those roles  
8. Role-specific acceptance criteria PASS (dashboard, navigation, permissions, landing, denied routes, redirects)

### Slice E — Recovery, audit, support

| Field | Content |
|-------|---------|
| **Scope** | Recovery · Emergency recovery · Audit · Support escalation |
| **Includes** | Org Admin Level-3 recovery; secondary recovery contact; subaccount reset by Org Admin; permanent privileged audit ([20](./20-audit-compliance.md)); support routing ([30](./30-support-escalation-levels.md)); offboarding workflow hooks ([29](./29-employee-offboarding.md)) |
| **Depends on** | Slice D Validated |
| **Validation** | Org Admin cannot self-serve reset; audits immutable; escalation runbooks executable |

---

## Explicitly deferred (not in A–E unless unlocked)

| Item | Notes |
|------|-------|
| AI Guided Setup / Professional Implementation orchestration | Post–E product slices; may be AUTH-001-F+ or separate package |
| Multi-org switcher UX exposure | Architecture in [18](./18-multi-organization-future.md); UX unlock separate |
| SSO / SAML | Future |

---

## Slice status board

| Slice | Design | Approval / Authorize | Implement | Validate |
|-------|--------|----------------------|-----------|----------|
| A | ✔ | ✅ ([33](./33-slice-a-authorization.md)) | ✅ ([34](./34-slice-a-implementation.md)) | ✅ ([35](./35-slice-a-validation.md)) |
| B | ✔ | ✅ ([36](./36-slice-b-authorization.md)) | ✅ ([37](./37-slice-b-implementation.md)) | ✅ PASS ([40](./40-slice-b-validation-rerun.md)) · prior FAIL [38](./38-slice-b-validation.md) |
| C | ✔ | ✅ ([41](./41-slice-c-authorization.md)) | ✅ ([42](./42-slice-c-implementation.md)) | ✅ PASS ([43](./43-slice-c-validation.md)) |
| D | ✔ | ✅ ([44](./44-slice-d-authorization.md)) | ✅ ([45](./45-slice-d-implementation.md)) | ✅ PASS ([46](./46-slice-d-validation.md)) |
| E | ✔ | ✅ ([47](./47-slice-e-authorization.md)) | ✅ ([48](./48-slice-e-implementation.md)) | ✅ PASS ([49](./49-slice-e-validation.md)) |

---

## Acceptance (A08)

| ID | Criterion |
|----|-----------|
| SL-01 | Slices A–E defined with Design → Approval → Implementation → Validation |
| SL-02 | No implementation without explicit `AUTHORIZE AUTH-001 SLICE …` |
| SL-03 | Next slice waits on prior Validation (default) |
