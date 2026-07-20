# WF-001 — Workflow Completion Report

## Company Setup

| Step | Status | Notes |
| --- | --- | --- |
| Profile | Complete | Existing wizard |
| Organization | Complete | Existing wizard |
| Invite | Complete (optional) | Skip no longer blocks `isComplete` / SetupGate |
| Property → Units → Tenant → Lease | Complete | Existing create flows + setup redirects |

**Result:** Setup can finish without invite; gate no longer loops after lease.

## Applicant Workflow

| Step | Status | Notes |
| --- | --- | --- |
| Application | Complete | Manager-created applicant |
| Background check | Complete (sandbox/noop) | Existing screening |
| Consent / review / approval | Complete | Lifecycle actions |
| Lease | Complete | “Create lease →” CTA with prefills |
| E-signature | Complete (sandbox/noop) | Existing signatures |
| Resident activation | Complete | Convert creates tenant + portal invite; invite accept links `tenants.user_id` |
| Resident portal | Complete | Portal hub + modules |

**Remaining:** No public `/apply` self-serve intake (manager-created only).

## Resident Workflow

| Step | Status | Notes |
| --- | --- | --- |
| Login | Complete | Auth + tenant role |
| Messages / announcements | Complete | Existing |
| Maintenance | Complete | New portal list/create/detail + photos |
| Documents | Complete | New portal documents (scoped RLS) |
| Payments | Complete | Existing API-005 portal |
| Notifications | Complete | New portal inbox |
| Profile | Complete | `/profile` |

## Maintenance Workflow

| Step | Status | Notes |
| --- | --- | --- |
| Resident request + photos | Complete | Portal form + MediaUpload |
| Manager review / vendor assign | Complete | Existing PM + vendor assign |
| Vendor updates | Complete | Vendor portal work queue status updates |
| Completion + resident notify | Complete | Notify includes tenant `user_id` + portal href |
| Timeline | Complete | Activity events |

## Payments Workflow

| Step | Status | Notes |
| --- | --- | --- |
| Rent charge | Complete | Existing |
| Resident notification | Complete | Charge-created notify to tenant user |
| Payment / receipt / ledger | Complete | Existing billing + financial activity |
| Ops / Command Center | Complete | Existing activity feeds |

## Migration Workflow

| Step | Status | Notes |
| --- | --- | --- |
| Upload → map → validate → preview → import → review → done | Complete | Lease rows import when property/unit/tenant resolve |

## Broken Workflow Inventory (post-fix)

| ID | Severity | Item | State |
| --- | --- | --- | --- |
| B1 | P0 | Setup invite skip trap | **Fixed** |
| B2 | P0 | Tenant portal shell | **Fixed** |
| B3 | P0 | No resident maintenance | **Fixed** |
| B4 | P0 | Convert ≠ portal activation | **Fixed** (invite + user_id link) |
| B5 | P0 | Approve → lease dead handoff | **Fixed** |
| B6 | P0 | Completion/charge notify gaps | **Fixed** |
| B7 | P1 | Vendor portal shell | **Fixed** |
| B8 | P1 | Migration leases always review | **Fixed** |
| B9 | P1 | Public applicant intake | **Open** (out of “finish existing” unless required) |
| B10 | P2 | Tenant document:read scoping | **Mitigated** via RLS |
