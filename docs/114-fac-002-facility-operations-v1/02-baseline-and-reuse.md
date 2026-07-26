# 02 — Baseline & Reuse

**Package:** FAC-002  
**Rule:** Search → extend → never build Version 2 beside Version 1.

---

## Already shipped (HEAD) — must reuse

| Capability | Location / package | FAC-002 action |
|------------|-------------------|----------------|
| Work orders | `/maintenance/*`, `lib/maintenance/`, phase6 | Extend fields/UX only |
| Vendors + token jobs | `/vendors/*`, `/v/[token]`, VENDOR-001 | Extend Accept/Decline/SMS gaps |
| Manager invoice approval | `lib/vendor-payments/` | Keep |
| Facility Records | FAC-001 Slice A, `/facility/records/*` | Append on PM/inspection complete |
| Property Timeline | FAC-001 Slice B | Emit events for PM/inspection/inventory significant changes |
| Facility Assets | FAC-001 Slice C, `/facility/assets/*` | Extend profile fields + PM link |
| Media upload | API-002A | Inventory / WO / inspection photos |
| Reporting engine | `lib/reporting/` | New report types — same engine |
| Expenses | `/financials/expenses/*` | Link from WO/receipts — no second ledger |
| Notifications | API-001 / OneSignal stack | PM due, assignment, inspection due (when channels available) |
| Permissions | `evaluatePermission` / roles | New capabilities registered in existing matrix |
| Portal / ops shells | Existing ApplicationShell + PortalShell | Technician uses ops shell with role home — no new shell product |

---

## FAC-001 extension law (binding)

Future features **consume** Facility Records, Timeline, Assets, and Providers.  
**Forbidden:** parallel history DBs inside PM, inventory, or inspections.

---

## Collision boundaries (other agents)

Do **not** change in FAC-002 implement slices:

- `ShellProviders` / `@mpa/ui/shell` / auth-route provider splits  
- AUTH-001 identity / invitations / recovery  
- OPS-001 event bus (consume existing emit patterns only if already on HEAD)  
- COM-001 commercial pipeline  

If a FAC-002 slice needs a capability that only exists in untracked AUTH WIP, **stop and ask** — do not merge foreign WIP.
