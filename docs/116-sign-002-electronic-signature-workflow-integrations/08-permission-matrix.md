# 08 — Permission Matrix

**Package:** SIGN-002  
**Status:** Draft — Ready for Approval

---

## Principle

Reuse existing `signature:*` and module permissions. **No net-new permission strings for V1.0** unless Approve records a gap.

Existing capabilities ([API-004](../50-api-004-electronic-signatures/06-security-and-compliance.md) · `packages/shared`):

| Capability | Use |
|------------|-----|
| `signature:create` | Create draft packages |
| `signature:update` | Edit draft recipients/docs before send |
| `signature:read` | View status / progress (redacted) |
| `signature:send` | Send / remind / resend |
| `signature:cancel` | Cancel in-flight |
| `signature:read_full` | Download executed PDF + certificate |
| `signature:admin` | Void, retention, break-glass org settings |

---

## Workflow × permission

| Workflow | Create/Send | Cancel/Void | Download | Module gate |
|----------|-------------|-------------|----------|-------------|
| A1 Lease | `signature:create|send` | `signature:cancel` / `admin` void | `signature:read_full` | `lease:read` (+ `lease:update` for status sync actors) |
| A2 Renewal | same | same | same | `lease:read|update` |
| A3 Owner agreement | same | same | same | Owner/property manage as OWNER-001 + `signature:*` |
| A4 Move-in | same | same | same | Lease/resident update |
| A5 Move-out | same | same | same | Lease/resident update |
| B1–B2 Vendor/contractor | same | same | same | `vendor:read|update` |
| B3 Work auth | same | same | same | WO `maintenance:*` / facility WO perms |
| B4 Inspection | same | same | same | `facility:inspection:read|write` |
| B5 Safety | same | same | same | `vendor:update` |
| C1–C4 Org/HR | same | same | same | Org admin / team manage for send; subjects `signature:read` on own |

---

## Recipients

External signers do **not** need M.P.A. permissions to sign. Authenticated portal users viewing their own packages need `signature:read` (or portal-scoped equivalent already used for tenant/owner document views).

---

## Net-new permissions

| Proposed | Decision |
|----------|----------|
| `signature:void` | **Not required** — use `signature:admin` |
| Module-specific `lease:sign` | **Not required** — compose `lease:*` + `signature:*` |

If Approve later requires finer HR-only send, add `signature:send_org_docs` via a documented amendment — not assumed in V1.0.
