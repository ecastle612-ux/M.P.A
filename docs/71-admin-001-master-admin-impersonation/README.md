# ADMIN-001 — Master Admin Portal Access & Impersonation Center

**Status:** Design ✔ · Document ✔ · **Approved** · Implement unlocked  
**Initiative ID:** ADMIN-001 (Slice B + expansion)  
**Approval:** 2026-07-21 — [11-approval.md](./11-approval.md)  
**Depends on:** UX-001 Master Admin Slice A (`master_admin` capability + `/master-admin/*` console)  
**Informal alias:** Chat “DPX-003 Master Admin…” — **not** roadmap DPX-003 Leasing ([DPX-002 freeze](../93-dpx-002-complete-daily-workflow/12-reference-workflow-freeze.md))

---

## Objective

Give authorized Master Admins a permanent, auditable way to:

1. Enter every portal (Resident / Vendor / Owner / Manager) without linked tenancy or assignment.
2. Impersonate any user while remaining authenticated as Master Admin.
3. Browse orgs, properties, residents, owners, vendors, and managers from an Impersonation Center.
4. Use Emergency Support / demo seed data so portal pages are never empty during QA, demos, or Design Partner testing.

**Non-goals:** Fake logins, hardcoded emails, new browser sessions, weakening production permissions for non–Master Admin users.

---

## Why this exists

| Audience | Need |
| --- | --- |
| Development / QA | One account exercises every portal and role |
| Design Partner demos | Show resident/vendor/owner without staging fake accounts |
| Customer / enterprise support | Reproduce bugs and walk workflows as the user |
| Training | Safe exploration with clear “not the real user” chrome |

Production users without `master_admin` keep today’s rules: Portals stay gated on linked roles/assignments.

---

## Documents

| Doc | Purpose |
| --- | --- |
| [01-problem-and-goals.md](./01-problem-and-goals.md) | Current friction + success definition |
| [02-authorization-model.md](./02-authorization-model.md) | `master_admin` only; no email hardcodes; effective permissions |
| [03-portal-test-mode.md](./03-portal-test-mode.md) | Portals page CTAs + MASTER ADMIN TEST MODE banner |
| [04-impersonation-center.md](./04-impersonation-center.md) | Directory + View Profile / Impersonate / Return |
| [05-session-architecture.md](./05-session-architecture.md) | Auth vs effective subject; cookies; no second login |
| [06-demo-data-seeding.md](./06-demo-data-seeding.md) | Temporary demo records when portal would be empty |
| [07-audit-trail.md](./07-audit-trail.md) | Session start/end, pages, sensitive actions |
| [08-security.md](./08-security.md) | Threat model + invariants |
| [09-certification-protocol.md](./09-certification-protocol.md) | Desktop/mobile verification script |
| [10-pass-criteria.md](./10-pass-criteria.md) | Hard PASS gates |
| [11-approval.md](./11-approval.md) | Sign-off template (empty until Approve) |

---

## Relationship to Slice A

| Slice A (shipped) | ADMIN-001 (this package) |
| --- | --- |
| Capability `master_admin` | Reuses same capability — **no fake permissions** |
| `/master-admin/*` console | Adds Impersonation Center + portal test entry |
| Org / dashboard switchers | Impersonation is separate from org switch |
| Testing utilities | Emergency portal launch may live adjacent; not a replacement |

---

## Gate

```
Design → Document → Approve → Implement
```

**Approved** — implement only documented scope; material changes restart the gate.
