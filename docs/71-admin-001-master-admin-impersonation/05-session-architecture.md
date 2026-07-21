# 05 — Session Architecture

**Package:** ADMIN-001  
**Status:** Draft

## Invariants

1. **One Auth session** — Supabase session = Master Admin only.  
2. **Effective subject stored separately** — server-readable cookie or encrypted server session store (prefer httpOnly cookie + server validation).  
3. **No second password** — never prompt for target credentials.  
4. **No second browser profile required** — same tab / same login.  
5. **Fail closed** — missing/invalid effective subject → treat as not impersonating.

## Proposed context shape (logical)

```ts
type MasterAdminEffectiveContext =
  | { mode: "none" }
  | {
      mode: "portal_test";
      portal: "resident" | "vendor" | "owner" | "manager";
      organizationId: string;
      demoSeedId?: string;
      startedAt: string;
      auditSessionId: string;
    }
  | {
      mode: "impersonate";
      targetUserId: string;
      organizationId: string;
      startedAt: string;
      auditSessionId: string;
    };
```

Exact storage mechanism is an implementation detail; must be server-validated on every request that trusts effective permissions.

## Request resolution order

1. Authenticate Supabase user.  
2. If `master_admin` and effective context present → resolve target membership/roles for UI + authorization helpers.  
3. Else → normal authorization path.

## Return to My Session / Exit Test Mode

- Clear effective context cookie/store.  
- Close audit session (end time, duration).  
- Redirect to `/dashboard` (or Impersonation Center if exit originated there — default Operations Center per product requirement).

## Future expansion

Same architecture supports Customer Support, QA, Design Partner demos, training, bug reproduction, and enterprise support **without** redesigning the permission capability model — only Master Admin may set effective context.
