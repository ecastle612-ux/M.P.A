# 04 — Reuse Existing Systems

**Package:** OWNER-001  
**Status:** Approved · Phase 1 ✅ COMPLETE  
**Section:** §7 Reuse Existing Systems

---

## Binding rule

> The Owner Portal **MUST** reuse existing platform systems.  
> Do **NOT** redesign architecture.  
> Do **NOT** invent parallel reporting, messaging, vault, notification, RBAC, or AI stacks.

OWNER-001 is primarily a **role-framed composition and routing** problem on top of systems that already exist.

---

## Mandatory reuse map

| System | What to reuse | Owner Portal obligation | Forbidden |
|--------|---------------|-------------------------|-----------|
| **Reporting Engine (FIN-001 `ReportingService`)** | Report catalog, generate/preview jobs, PDF renderer, vault versions | Consume owner-appropriate reports/statements; download via existing version/download paths | Parallel PDF pipeline inside Owner Portal |
| **Financial Module (Phase 10 + related)** | Owner statements, charges/payments/expenses read models, financial activity | Drive Financial Summary, Statements, Receipts, Payment History, vendor expense visibility | New ledger, new accounting engine, owner-side financial writes |
| **Messaging** | Threads/inbox APIs and UI patterns | Owner Messages list/thread/reply | Separate owner chat product |
| **Notification Service** | In-app notifications, preferences, push enrollment foundation (API-001 / OneSignal path) | Home attention + notification center + prefs | New notification provider or parallel inbox |
| **Document Vault** | `vault_documents`, signed download, versioning, entity linkage | Documents library categories + statement PDFs | Second document store for owners |
| **RBAC** | Role `property_owner`, capability grants, portal role guards | Gate all screens; least privilege | Ad-hoc owner bypasses, hard-coded email allowlists |
| **AI services** | Existing `ai:read` / `ai:use` shell assistants if present | Optional assistive search/navigation only | Owner-specific forecasting, investment AI, tax AI |

---

## Additional reuse (supporting)

| System | Reuse |
|--------|-------|
| **Portal shell (Phase 3)** | `/portal/owner` layout, `RolePortalFrame`, auth/org/role guards, unauthorized/not-found |
| **Property / unit / tenant / lease / maintenance read models** | Property View sections |
| **Vendor payment / expense records (VENDOR-001 / financial ops)** | Automatic vendor expense appearance on Home + Financials + Property View |
| **Master Admin Portal Test Mode (ADMIN-001)** | Demo preview only; never for production owners |
| **Canopy / Experience architecture** | Visual + interaction patterns |

---

## Architecture stance (non-negotiable)

```
Existing Accounting / Ops data (read)
        ↓
Existing Financial + ReportingService + Vault + Messaging + Notifications
        ↓
Owner Portal composition (role-framed UI)
```

- Owner Portal is a **consumer**, not a producer of financial truth.  
- Vendor expenses **appear automatically** because they are already recorded upstream — the portal reads them.  
- Payout execution remains FIN-003; this package only reserves UI placeholders.

---

## As-built gaps acknowledged (design, not silent invent)

These are known platform facts; resolving them is part of Approve / Implement planning, not an excuse to redesign:

1. **Owner–property access plane** (`owner_accounts` / `owner_property_access`) is documented in database architecture but not fully present as migrated tables; today ownership is often org-level `property_owner` membership + property contact metadata + statement placeholders.  
2. **Announcements / communication grants** for owners may need a least-privilege read path without granting PM broadcast capabilities.  
3. **Message reply** may require granting `message:create` (or equivalent) to `property_owner` — product decision in Open Questions.  
4. **FIN-003 package** missing on disk — payout placeholders must not pretend Connect exists.

Any schema/capability change required to close these gaps must be called out at Approve and remain minimal.
