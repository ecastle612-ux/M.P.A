# 23 — Acceptance Criteria

**Package:** AUTH-001  
**Status:** ✅ Approved with Amendments · Implement 🔒 Locked

---

## A) Design package acceptance (Approve gate)

| ID | Criterion | Status |
|----|-----------|--------|
| D-01 | Docs 00–32 present and internally consistent | ✔ |
| D-02 | Username-as-identity and email-as-contact are explicit | ✔ |
| D-03 | Org Admin vs subaccount recovery split is explicit | ✔ |
| D-04 | Dashboard non-selectability is explicit | ✔ |
| D-05 | Multi-org switching model exists without requiring MVP UX | ✔ |
| D-06 | BILL-001 handoff boundary is explicit | ✔ |
| D-07 | ADR-026 Accepted covers binding architectural decisions | ✔ |
| D-08 | Implementation remains locked until slice unlock | ✔ |
| D-09 | Amendments A01–A08 incorporated | ✔ |
| D-10 | Invitation-only principle documented | ✔ |
| D-11 | Subscription capability matrix documented | ✔ |
| D-12 | Org commercial lifecycle documented | ✔ |
| D-13 | Offboarding + support escalation + slice board documented | ✔ |

---

## B) Product acceptance (post-implement certification)

### Provisioning

| ID | Criterion |
|----|-----------|
| P-01 | Successful SaaS payment creates exactly one Organization |
| P-02 | Plan + modules bound at provision |
| P-03 | Org Admin principal created with MPA-generated username |
| P-04 | Temporary password delivered; only hash retained |
| P-05 | Welcome email sent (or retried with ops visibility) |
| P-06 | Idempotent on billing retries |

### Authentication

| ID | Criterion |
|----|-----------|
| A-01 | Login uses username + password (not email identity) |
| A-02 | Email change does not break login |
| A-03 | Username cannot be changed or reused |
| A-04 | First login enforces verify + terms + password change |
| A-05 | Temporary password cannot be reused after change |
| A-06 | Passwords never exposed to Level 0 tooling |

### Hierarchy & isolation

| ID | Criterion |
|----|-----------|
| H-01 | Org Admin manages subaccounts end-to-end |
| H-02 | M.P.A. does not create day-to-day users after onboarding |
| H-03 | Cross-org reads/writes fail closed under test |
| H-04 | Dashboard surfaces match assignment rules |
| H-05 | Users cannot select arbitrary dashboards |
| H-06 | Organization Administrator authenticated certification PASS (Slice D) — see CORE-003 AMD [33](../113-core-003-implementation-master-plan/33-core-003-amd-m0-auth-role-cert-defer.md) |
| H-07 | Leasing Agent authenticated certification PASS (Slice D) |
| H-08 | Facility Technician authenticated certification PASS (Slice D) |
| H-09 | Slice D role regression: landing, nav, permissions, denied routes, redirects, org isolation |

> **Note:** H-06–H-09 are **AUTH-001 Slice D** COMPLETE gates. They are **not** M0 exit criteria (`CORE-003-AMD-M0-AUTH-ROLE-CERT-DEFER`).

### Recovery

| ID | Criterion |
|----|-----------|
| R-01 | Org Admin self-serve forgot-password is unavailable |
| R-02 | Level 0 can recover Org Admin only after verification |
| R-03 | Org Admin can reset subaccount passwords |
| R-04 | Secondary recovery contact required before `active` |

### Setup

| ID | Criterion |
|----|-----------|
| S-01 | Wizard launches after first-login hardening |
| S-02 | Professional and AI paths both reachable |
| S-03 | Finish Setup marks organization `active` |
| S-04 | Privileged actions emit audit events |

---

### Amendments (product)

| ID | Criterion |
|----|-----------|
| CAP-01… | See [26](./26-subscription-capability-matrix.md) |
| INV-01… | See [27](./27-invitation-only-platform.md) |
| ORG-01… | See [28](./28-organization-status-lifecycle.md) |
| OFF-01… | See [29](./29-employee-offboarding.md) |
| SW-01… | See [18](./18-multi-organization-future.md) |
| SUP-01… | See [30](./30-support-escalation-levels.md) |
| AUD-01… | See [20](./20-audit-compliance.md) |
| SL-01… | See [31](./31-implementation-slices.md) |

---

## Explicit fail conditions

- Email used as primary login identity in commercial path  
- Public Sign Up / Create Free Account / Register Yourself creating principals  
- Org Admin email magic-link reset without Master Admin verification  
- Unpurchased modules shown as available product capabilities  
- Cross-org data returned in any certified scenario  
- Plaintext password stored or shown in admin UI  
- User-facing “choose your dashboard” control shipped  
- Offboarding that deletes operational history  
- Implementation of any slice without `AUTHORIZE AUTH-001 SLICE …`
