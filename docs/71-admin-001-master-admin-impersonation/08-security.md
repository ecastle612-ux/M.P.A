# 08 — Security

**Package:** ADMIN-001  
**Status:** Draft

## Invariants

1. Only `master_admin` may start/stop Test Mode or Impersonation.  
2. Authentication identity never becomes the target user.  
3. No API accepts client-supplied “act as” without server-side Master Admin verification.  
4. Production permission outcomes for users without `master_admin` are unchanged.  
5. Banners are mandatory while effective context is active.  
6. Audit session opens before first privileged page render under effective context.

## Threat notes

| Threat | Mitigation |
| --- | --- |
| Stolen Master Admin session | Existing auth; short-lived effective context; audit |
| Privilege confusion | Dual-label banner; separate auth vs effective planes |
| Cross-org leakage | Effective context always bound to organization id; validate target membership |
| Accidental irreversible action | Simulate-by-default in Test Mode; confirm + audit for commits |
| Capability spoofing via cookie | Sign/encrypt server-side; re-check `master_admin` every request |

## RLS

Impersonation does **not** turn off RLS globally. Server loaders use Master Admin–approved service patterns already used by Slice A **or** constrained queries that still scope by organization. Document exact helper at implement time; do not open anon/client bypasses.
