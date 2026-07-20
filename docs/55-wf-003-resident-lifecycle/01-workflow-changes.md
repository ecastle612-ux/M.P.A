# WF-003 — Workflow Changes

## Move-In Wizard (`/residents/move-in`)

1. **Source** — Existing approved applicant **or** create resident directly  
2. **Unit** — Property → Unit with occupancy, rent, deposit; occupied units blocked unless `lease:update` override  
3. **Details** — Auto-fill name/email/phone/lease/rent/deposit/emergency/pets/vehicles/co-residents/guarantors  
4. **Checklist** — Screening, lease, deposit, portal, welcome email/SMS, push, documents (missing items highlighted)  
5. **Activate** — One action: resident + lease link/activate, document folder marker, portal invite, welcome notify, occupancy, lifecycle events, ops metrics refresh

## Move-Out Wizard (`/residents/move-out`)

1. **Select** — Resident with property/unit/lease/balance  
2. **Details** — Move-out date, reason, forwarding address, deposit disposition, final charges  
3. **Checklist** — Inspection, photos, keys, balance, deposit, archive, access  
4. **Complete** — Close lease, vacate unit, disable portal, archive threads/docs, preserve history, lifecycle → former

## Lifecycle statuses (`tenants.lifecycle_status`)

`awaiting_move_in` → `awaiting_signature` → `active` → `notice_given` → `moving_out` → `former`

Auto-synced from lease actions: sign, activate, give_notice, move_out, terminate, expire.

Applicant → Approved remains on the applicant record; conversion + move-in wizard bridges into resident lifecycle.

## Dashboard / ops

Operations Center widget: pending move-ins/outs, awaiting invitation, missing lease/deposit/docs, units becoming vacant, upcoming lease expirations.

Quick actions: Move In / Move Out.

## Bulk + Migration

`/residents/bulk` — bulk invites, portal activation, mark awaiting move-in.  
Migration Center links to bulk ops; imported tenants land as `awaiting_move_in`.
