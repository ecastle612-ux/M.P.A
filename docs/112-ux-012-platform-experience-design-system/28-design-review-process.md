# 28 — Design Review Process

**Package:** UX-012  
**Amendment:** A07  
**Status:** Binding (Approved with Amendments)

---

## Binding rule

**No screen should bypass review.**

Every future UI implementation must pass the full gate before Validation / merge to production-facing release.

---

## Gate sequence

```
Design Review
  → Accessibility Review
  → Mobile Review
  → PWA Review
  → Regression Review
  → Approval
```

---

## Stage definitions

### 1) Design Review

| Checks |
|--------|
| Principles ([01](./01-design-principles.md)) |
| Token governance ([22](./22-design-token-governance.md)) |
| Quality standards ([25](./25-design-quality-standards.md)) |
| Role playbook fit ([23](./23-role-experience-playbooks.md)) |
| Command Center / pattern compliance when applicable |

**Owner:** Product Design / UX  
**Fail:** Visual clutter, one-offs, wrong homepage patterns  

### 2) Accessibility Review

| Checks |
|--------|
| WCAG 2.2 AA ([12](./12-accessibility.md)) |
| Keyboard, focus, contrast, SR labels |
| Reduced motion |

**Owner:** Design + Eng a11y  
**Fail:** Color-only status, missing labels, focus traps  

### 3) Mobile Review

| Checks |
|--------|
| 44px targets, bottom nav, safe areas ([06](./06-mobile-ux.md)) |
| No hover-only critical actions |
| No page-level horizontal scroll |

**Owner:** Mobile UX / Eng  
**Fail:** Unusable primary path on phone  

### 4) PWA Review

| Checks |
|--------|
| PMX-004 standalone / install / offline expectations for surface |
| Display mode safe; no broken chrome |
| Push/permission UX not regressing |

**Owner:** PWA owner  
**Fail:** Standalone broken; install regress  

### 5) Regression Review

| Checks |
|--------|
| Adjacent journeys still work |
| Visual regressions vs Canopy |
| Entitlement/authz UI not leaked |

**Owner:** QA / Eng  
**Fail:** Broken prior certified path  

### 6) Approval

| Outcome |
|---------|--------|
| Record pass in slice Validation / PR |
| Or return with defects list |

**Owner:** Gate owners (Product + UX + Architect as needed)

---

## Scope scaling

| Change size | Process |
|-------------|---------|
| Token-only / copy | Abbreviated Design + a11y spot check |
| New screen / pattern | Full sequence |
| Command Center / shell | Full + Architect |

Silence is not approval.

---

## Acceptance (A07)

| ID | Criterion |
|----|-----------|
| DR-01 | Full review sequence mandatory |
| DR-02 | Stage owners and fail conditions defined |
| DR-03 | No production UI bypass |
| DR-04 | Scaled path for tiny changes documented |
