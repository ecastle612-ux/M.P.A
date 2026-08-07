# Remaining Production Defects — Property Manager

**Parent:** [Production Certification](./index.md)  
**Also see:** [Launch Stabilization](../launch-stabilization/index.md)  
**Rule:** Defects and friction only. No new-feature recommendations. No scope expansion.  
**Revision:** Post launch-stabilization UX audit  

---

## P0 — Launch blocking

_None remaining._

---

## P1 — Procedural

### DEF-003 — Staging operator Pass still to be recorded
| Field | Detail |
|-------|--------|
| Type | Procedural handoff |
| Symptom | Evidence APIs complete; human MA must execute Pass on staging org and fill sign-off fields. |
| Impact | Formal ops checklist only. |

---

## P2 — UX / navigation / a11y / copy

### DEF-006 — Owner “Document Vault” copy
| Field | Detail |
|-------|--------|
| Status | **Cleared** in launch stabilization |

### DEF-009 — Accessibility / mobile polish gaps
| Field | Detail |
|-------|--------|
| Status | **Partially cleared** — skip link, MA mobile menu, table `scope`, notification width |
| Remaining | Popover focus traps; FO mobile card layouts; a11y suite |

### DEF-010 — NotificationCenter unread badge
| Field | Detail |
|-------|--------|
| Status | **Cleared** — prefetch on mount |

### DEF-008 — Coarse document RLS (org-member read)
| Field | Detail |
|-------|--------|
| Type | Permission least-privilege |
| Impact | Acceptable for small Customer #1 orgs; not redesigned here |

### DEF-011 — Mixed empty-state vocabulary on FO/owner sublists
| Field | Detail |
|-------|--------|
| Type | Visual consistency |
| Symptom | Some lists use `EmptyState`; others plain `<p>` |

### DEF-012 — `/pm/vendors` honesty page feels unfinished vs MCC
| Field | Detail |
|-------|--------|
| Type | UX friction · wording |
| Fix style | Clarify copy/path only — no second vendor product |

---

## Integration failures (config-dependent)

| ID | Integration | Honesty path |
|----|-------------|--------------|
| INT-001 | Resend / Auth SMTP | Operator shares login / magic link |
| INT-002 | SignWell | Record signed offline |
| INT-003 | Stripe | Manual FO payment |
| INT-004 | SignWell webhook | Sync / offline complete |
| INT-005 | `SUPABASE_SERVICE_ROLE_KEY` | Required for portal provisioning |

---

## Explicitly out of scope

- Facility Operations  
- CORE-004 expansion  
- FIN-OPS S4+ / full GL  
- Full leasing marketing/screening pipeline  
- Two-way threaded messaging beyond operational notices  
- Entity-scoped document ACL redesign (beyond noting DEF-008)
