# Remaining Production Defects — Property Manager

**Parent:** [Production Certification](./index.md)  
**Rule:** Defects and friction only. No new-feature recommendations. No scope expansion.  
**Revision:** Post P0 production remediation — **P0 items cleared.**

---

## P0 — Launch blocking

_None remaining._

| Former ID | Resolution |
|-----------|------------|
| DEF-001 | Cleared — lease activation provisions tenant portal access |
| DEF-002 | Cleared — vendor assignment provisions vendor portal access |

---

## P1 — High friction / evidence quality

### DEF-003 — Staging operator Pass still to be recorded
| Field | Detail |
|-------|--------|
| Type | Procedural handoff |
| Symptom | Code/evidence APIs complete; human MA must still execute Pass on staging org and fill sign-off fields. |
| Impact | Formal ops checklist; does not reopen product P0. |

---

## P2 — UX / navigation / a11y / copy

### DEF-006 — Owner property drill-down still mentions “Document Vault”
| Field | Detail |
|-------|--------|
| Type | UX friction · Stale copy |
| Scenario | 8 |
| Symptom | Documents remediation shipped; drill-down honesty text may still say Document Vault. |

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
| INT-001 | Resend / Auth SMTP | Invite email may not deliver | Operator shares login / magic link; Auth invite when SMTP configured |
| INT-002 | SignWell | Cannot send e-sign | Record signed offline |
| INT-003 | Stripe | No resident Pay Now | Manual FO payment |
| INT-004 | SignWell webhook URL | No auto-activate from provider | Sync / offline complete |
| INT-005 | `SUPABASE_SERVICE_ROLE_KEY` | Portal provisioning cannot create/link auth users | Required for production activation/assign |

These are **not** listed as code blockers when honesty paths are used and advertise copy matches.

---

## Explicitly out of scope (not defects)

- Facility Operations  
- CORE-004 expansion  
- FIN-OPS S4+ / full GL  
- Full leasing marketing/screening pipeline  
- Two-way threaded messaging product beyond operational notices  
- Entity-scoped document ACL redesign (beyond noting DEF-008)
