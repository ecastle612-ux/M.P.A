# 05 — Implementation Workflows

**Package:** COM-001  
**Status:** Draft — Awaiting Approval  
**Related:** AUTH-001 [12 Wizard](../109-auth-001-organization-provisioning-authentication/12-organization-setup-wizard.md) · [13 AI](../109-auth-001-organization-provisioning-authentication/13-ai-guided-onboarding.md) · [14 Professional](../109-auth-001-organization-provisioning-authentication/14-professional-implementation-workflow.md)

---

## Choice (mandatory)

Every customer chooses **one** primary path in the Setup Wizard:

| Option | Summary |
|--------|---------|
| **A — Professional Implementation** | M.P.A. specialists configure the workspace |
| **B — AI Guided Setup** | AI onboarding specialist walks the Org Admin through setup |

Switching paths mid-flight is allowed with CS approval; completion still requires Org Admin **Finish Setup**.

---

## Option A — Professional Implementation

### Responsibilities

| Party | Owns |
|-------|------|
| **M.P.A. Implementation Specialist** | Data collection, imports, configuration, checkpoint prep |
| **Organization Administrator** | Approvals, provider OAuth, Finish Setup, recovery contact |
| **Customer Success** | Timeline, satisfaction, handoff to success motions |
| **Technical Support** | Defects / connector failures |

### Timeline (design target)

| Segment | Target |
|---------|--------|
| Kickoff | ≤ 5 business days from Payment Successful |
| Data collection | 3–10 business days (customer-dependent) |
| Configure + import | 3–15 business days by portfolio size |
| Go-live checkpoint | Scheduled with Org Admin |
| Finish Setup | Org Admin action same day as go-live approval |

Enterprise custom timelines are contractual.

### Deliverables

1. Kickoff agenda + data request list  
2. Imported properties/units/tenants/leases (or explicit deferrals)  
3. Branding + notification defaults  
4. Payments connection guided (customer completes provider auth)  
5. Initial team invites (as requested)  
6. Go-live checklist signed  
7. Active Customer confirmation  

### Completion criteria

- Required wizard steps complete or deferred with acknowledgment  
- Secondary recovery contact verified (AUTH-001)  
- Org Admin clicks Finish Setup  
- Specialist time-boxed access revoked  
- CS 30-day check-in scheduled  

### Escalation

| Issue | Escalate to |
|-------|-------------|
| Customer unresponsive > SLA | CS manager |
| Import / platform defect | Technical Support (L3) |
| Ownership / credential issues | Master Admin (L4) via AUTH recovery |
| Scope creep beyond plan | Sales / CS commercial change order |

---

## Option B — AI Guided Setup

### Responsibilities

| Party | Owns |
|-------|------|
| **AI Onboarding Specialist** | Step guidance, mapping suggestions, duplicate detection |
| **Organization Administrator** | Uploads, confirms mappings, Finish Setup |
| **Customer Success** | Low-adoption watch; rescue to Professional if needed |
| **Technical Support** | AI/runtime failures |

### Timeline (design target)

| Segment | Target |
|---------|--------|
| Start | Immediately after first-login hardening |
| Mid-size portfolio (≤200 units) | Minutes–hours of active work (data-quality dependent) |
| Finish | Same session or resumed within trial/setup window |

### Deliverables

1. Guided completion of wizard checklist  
2. Mapping reports (accepted/rejected)  
3. Duplicate / conflict resolutions log  
4. Invites drafted/sent with Org Admin confirm  
5. Active Customer confirmation  

### Completion criteria

Same Finish Setup gates as Professional; AI cannot mark Active alone.

### Escalation

| Issue | Escalate to |
|-------|-------------|
| Low-confidence imports | Human mapping UI; then CS |
| AI unavailable | Manual wizard; offer Professional |
| Customer stuck / frustrated | CS → optional Professional convert |
| Security / wrong-org suspicion | Technical + Master Admin |

---

## Commercial packaging

| Item | Commercial treatment |
|------|----------------------|
| AI Guided | Included on plans that allow it |
| Professional | Service SKU / Enterprise include / paid add-on |
| Rescue Professional mid-AI | CS-approved convert; may trigger service fee |

---

## Acceptance

| ID | Criterion |
|----|-----------|
| IMP-01 | Every customer chooses Professional or AI Guided |
| IMP-02 | Responsibilities, timeline, deliverables, completion, escalation documented for both |
| IMP-03 | Org Admin Finish Setup remains mandatory |
| IMP-04 | Specialist access is time-boxed after go-live |
