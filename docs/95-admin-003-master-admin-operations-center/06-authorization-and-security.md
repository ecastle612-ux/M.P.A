# 06 — Authorization and Security

**Package:** ADMIN-003  
**Status:** Draft  
**Depends on:** [ADMIN-001 authorization](../71-admin-001-master-admin-impersonation/02-authorization-model.md) · [ADMIN-001 security](../71-admin-001-master-admin-impersonation/08-security.md)

---

## Invariants

1. Only users with capability `master_admin` may access the Operations Center (`/master-admin` and Master Admin APIs introduced for this package).  
2. No email allowlists or hardcoded founder emails for access.  
3. Production permission outcomes for users **without** `master_admin` remain unchanged.  
4. Impersonation and Portal Test Mode continue to use ADMIN-001 session + audit APIs — ADMIN-003 does not invent a second “act as” path.  
5. Cross-org reads for HQ (directories, platform KPIs, search) are Master Admin–only, server-enforced, and auditable where they expose sensitive customer data.  
6. RLS is not globally disabled. Prefer existing Master Admin–approved server patterns from Slice A / ADMIN-001.

---

## Capability model

| Capability | Grants |
| --- | --- |
| `master_admin` | HQ, workspaces, Quick Actions, Global Search (Master Admin scope), Support tools |

No new capability keys are required for Slice A. If Slice D (Sales notes / CRM-like lists) needs finer splits later, that is a separate design decision — default remains `master_admin` only.

---

## Cross-org vs active-org

| Mode | Examples | Rule |
| --- | --- | --- |
| Platform (cross-org) | Attention aggregates, org directory, Sales lists, platform KPIs | Allowed for Master Admin; label results with organization |
| Active organization | Seed, migration jobs, setup, create property/resident/WO, announcements | Use shell org context; block with clear prompt if missing |

Switching active org must never silently run a Quick Action against the wrong customer.

---

## Audit expectations

| Event class | Expectation |
| --- | --- |
| Impersonation / Portal Test | Existing ADMIN-001 audit trail |
| New Client Wizard steps | Log org id, actor, step transitions (Slice B) |
| Cross-org search of sensitive entities | Prefer audit or rate-limit sensitive exports; browse is OK with Master Admin gate |
| Seed / reset demo | Existing testing utilities audit/logging patterns |
| Customer notes (Slice D) | Actor + org + timestamp |

Audit Viewer (New) is a read UI over these events — not a reason to weaken write-path integrity.

---

## Threat notes

| Risk | Mitigation |
| --- | --- |
| HQ becomes a privilege trampoline | Every action re-checks `master_admin` server-side |
| Accidental action on wrong org | Active-org chip + confirmations on high-impact actions |
| Search as data exfil | Master Admin only; no anonymous/client bypass; avoid bulk export in v1 |
| Confused demo vs real customer | Demo / Test Mode banners from ADMIN-001 remain mandatory |

---

## Explicit non-goals

- Granting Operations Center to org admins or “support” roles without `master_admin`  
- Client-supplied “act as” without ADMIN-001 verification  
- Turning off RLS for convenience queries  
