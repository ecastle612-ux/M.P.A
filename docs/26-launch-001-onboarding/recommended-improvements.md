# 3 — Recommended Onboarding Improvements

**Status:** Draft  
**Parent:** [LAUNCH-001](./index.md)  
**Constraint:** Design recommendations only — **no implementation** until Approve

---

## Principles

1. **One path** — Guided Setup → Mission Control first win → daily ops  
2. **Value before configuration** — first property before integration maze  
3. **Honest readiness** — never label empty modules as ready  
4. **Purchase is not shopping** — SKU from entitlement/operator, not customer SKU picker  
5. **Reuse FO** — surface money wins; do not rebuild a second ledger  
6. **Facility stays deferred** — do not promise Facility workflows in PM launch  

---

## P0 — Must fix for unaided Customer #1

### P0-1 — Make Mission Control the operational home
- Replace alignment stub with attention queue + **one primary CTA** when setup incomplete (“Add your first property”).
- When setup complete: surface overdue rent, open maintenance, vendor approvals (reuse FO snapshot + future maintenance signals).
- Deep-link into FO / Properties / Maintenance — do not duplicate money systems.

### P0-2 — Extend Guided Setup to operational first wins
Add steps after commercial checklist:
- Create first property (canonical Properties create, FO can share API)
- Invite teammate **or** explicit solo skip
- Payments readiness (Connect **or** “manual collect for now”)
- First lease + resident
- First money action (post rent or record payment)
- Confirm “You’re ready for daily operations”

### P0-3 — Fix invitations end-to-end
- Send invite email with accept link (platform email provider).
- Show pending invite status + **copy link** fallback in Settings.
- Default invite role for PM team = `property_manager` (or staff), not `tenant`.
- After accept: land in correct product home with role clarity.

### P0-4 — Honest module readiness
- Nav / empty states: **Available** only when workflow exists.
- Stubs show “Coming next” with no fake CTAs that 404 into emptiness.
- Properties create lives under Properties; FO remains money Command Center.

### P0-5 — Stripe Connect customer onboarding
- Guided Setup + FO settings: Connect status, start onboarding, hard-block online pay with plain-language empty state.
- Keep SaaS Billing (`/billing`) separate from rent Connect.

### P0-6 — Wire First Five Minutes
- Approve/reconcile `docs/21-experience-architecture/first-five-minutes.md`.
- Mission Control empty-org state matches that script.

---

## P1 — Strongly recommended before broader launch

### P1-1 — Real subscription purchase path (or explicit white-glove)
- **Option A (preferred for scale):** SaaS Checkout → org + SKU assigned automatically.  
- **Option B (acceptable for Customer #1 only):** Master Admin assigns SKU; remove customer SKU picker from Settings create; document white-glove runbook.

### P1-2 — Role management UI
- Change roles on memberships; revoke invites; show last active.

### P1-3 — Residents & Leasing as real modules
- Move resident/lease create out of FO-only desk into PM modules that call shared services.
- FO keeps ledger/collections; modules own CRM-ish lifecycle.

### P1-4 — Maintenance + vendor assignment MVP
- Resident/staff submit request → status → assign vendor → timeline.
- Reuse vendor identity; FO AP remains for invoices (already S2).

### P1-5 — SignWell decision
- Either: configure + send lease for signature in launch scope, **or** explicitly defer e-sign and allow “lease recorded offline” with clear copy.

### P1-6 — Login landing consistency
- Single post-auth destination rule: Setup if incomplete → else Launcher/Mission Control.

### P1-7 — Setup completion soft-gate
- Banner + Mission Control CTA until operational checklist done; optional hard-gate only for money-online features (Connect).

---

## P2 — Portfolio / polish (post–Customer #1 OK)

| Item | Note |
|------|------|
| Property import CSV | After single-property create works |
| Email verification branded UX | Beyond Supabase default |
| Setup digests / reminders | “Finish connecting payments” |
| Complete Platform chooser | “Start with Property Manager vs Facility” |
| Autopay polish | Belongs to FIN-OPS S4 — not this package |
| Facility Guided Setup | Only when Facility features authorized |

---

## Explicit non-goals (improvements must not include)

- General ledger / ERP
- Facility Operations feature build
- FIN-OPS-001 S4+ without separate authorize
- Replacing FO with a second billing system
- Master Admin in customer chrome

---

## Recommended sequencing (after Approve)

```
Approve LAUNCH-001
    ↓
L0  Onboarding foundation (Mission Control CTA, Setup extension design freeze)
    ↓
L1  Invites + roles + landing
    ↓
L2  Property / resident / lease first-win path
    ↓
L3  Stripe Connect onboarding + FO surfacing
    ↓
L4  Maintenance + vendor assignment MVP
    ↓
L5  SignWell (if in scope) + purchase path hardening
    ↓
L6  Certification — unaided Customer #1 walkthrough
```

Slice definitions: [Implementation Slices](./implementation-slices.md).
