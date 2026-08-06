# Remaining Production Defects — Property Manager

**Parent:** [Production Certification](./index.md)  
**Rule:** Defects and friction only. No new-feature recommendations. No scope expansion.

---

## P0 — Launch blocking

### DEF-001 — Resident portal access not provisioned on lease activation
| Field | Detail |
|-------|--------|
| Type | Broken workflow · Permission bug |
| Scenarios | 5, 6, 7 |
| Symptom | After lease activation, `portal_status=active` but user cannot open `/portal/tenant` (requires `tenant` role). Resident Pay Now / maintenance submit/confirm cannot run unaided. |
| Evidence | `activateSignedLease` updates `pm_residents` only; `portal/tenant/layout.tsx` checks `availableRoles.includes("tenant")`; `tenant` excluded from `LAUNCH_INVITE_ROLES`. |
| Impact | Customer #1 cannot complete advertised resident portal lifecycle without engineering/manual membership surgery. |

### DEF-002 — Vendor portal access not provisioned on vendor assign
| Field | Detail |
|-------|--------|
| Type | Broken workflow · Permission bug |
| Scenarios | 7 |
| Symptom | Vendor Operations UI exists, but login requires `vendor` role + `vendor_vendors.user_id` link. Assignment alone does not guarantee portal reachability. |
| Evidence | `portal/vendor/layout.tsx` role gate; assign path may notify when `user_id` present only. |
| Impact | Vendor completion via portal is not unaided for Customer #1 unless vendor users are pre-linked. |

---

## P1 — High friction / evidence quality

### DEF-003 — Master Admin Pass scripts not executed on staging
| Field | Detail |
|-------|--------|
| Type | Missing production polish · Audit gap |
| Symptom | J2–J8 + Documents + Communications panels exist; operator sign-off still open. |
| Impact | Formal production GO cannot be signed even after DEF-001/002 fixed. |

### DEF-004 — Soft / hardcoded structural checks in Docs & Comms evidence APIs
| Field | Detail |
|-------|--------|
| Type | Missing production polish |
| Symptom | Several evidence booleans always `true`; Docs `auditEvent` can pass with zero uploads. |
| Impact | MA panel can overstate readiness. |

### DEF-005 — No J0 Launch Readiness evidence API/panel
| Field | Detail |
|-------|--------|
| Type | Missing production polish |
| Symptom | J0 relies on certification script + subscription console only. |
| Impact | Purchase→Setup path less uniformly auditable than J1–J8. |

---

## P2 — UX / navigation / a11y / copy

### DEF-006 — Owner property drill-down still mentions “Document Vault”
| Field | Detail |
|-------|--------|
| Type | UX friction · Stale copy |
| Scenario | 8 |
| Symptom | Documents remediation shipped; drill-down honesty text outdated. |

### DEF-007 — Stale certification docs contradict GO/NO-GO
| Field | Detail |
|-------|--------|
| Type | Missing production polish |
| Symptom | `launch-readiness-gate.md` header still said overall NO-GO while body claimed journey GO; some journey notes still “comms out of sequence.” |
| Impact | Operator confusion during certification. |

### DEF-008 — Coarse document RLS (org-member read)
| Field | Detail |
|-------|--------|
| Type | Permission bug (least-privilege) |
| Scenario | 9 |
| Symptom | APIs capability-gated; DB select allows any org member. |
| Impact | Acceptable for small Customer #1 orgs; not least-privilege. |

### DEF-009 — Accessibility / mobile polish gaps
| Field | Detail |
|-------|--------|
| Type | Accessibility · Mobile |
| Symptom | No skip-to-content; FO/desks rely on horizontal scroll tables; no dedicated a11y suite for lifecycle. |
| Impact | Non-blocking for Customer #1 if operators use desktop; polish debt. |

### DEF-010 — NotificationCenter unread badge loads only on open
| Field | Detail |
|-------|--------|
| Type | UX friction |
| Scenario | 10 |
| Symptom | Unread count may show `0` until first open. |
| Impact | Low — Communications page remains source of truth. |

---

## Integration failures (config-dependent, not code-absent)

| ID | Integration | Failure mode if misconfigured | Honesty path |
|----|-------------|-------------------------------|--------------|
| INT-001 | Resend | Invite email skipped | In-app accept URL |
| INT-002 | SignWell | Cannot send e-sign | Record signed offline |
| INT-003 | Stripe | No resident Pay Now | Manual FO payment |
| INT-004 | SignWell webhook URL | No auto-activate from provider | Sync / offline complete |

These are **not** listed as code blockers when honesty paths are used and advertise copy matches.

---

## Explicitly out of scope (not defects)

- Facility Operations  
- CORE-004 expansion  
- FIN-OPS S4+ / full GL  
- Full leasing marketing/screening pipeline  
- Two-way threaded messaging product beyond operational notices  
- Entity-scoped document ACL redesign (beyond noting DEF-008)
