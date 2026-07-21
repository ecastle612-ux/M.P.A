# 06 — Demo Data Seeding

**Package:** ADMIN-001  
**Status:** Draft

## Rule

Master Admin Portal Test Mode must **never** land on empty primary portal pages when demo seed can satisfy the empty state.

User Impersonation of a real user should show **that user’s** data (including empty). Optional explicit “overlay demo data” is out of v1 unless needed for Owner/Manager unfinished shells.

## Seed profiles (temporary / clearly labeled)

### Resident Portal

- Demo lease (active)  
- Demo balance / charges summary  
- Demo maintenance request  

### Vendor Portal

- Demo work order assignment(s)  
- Demo schedule / due window  

### Owner Portal

- Demo portfolio (property + unit summary)  
- Demo financial summary  

### Manager Portal

- Reuse Operations sample widgets or link into existing demo org data; no empty dashboard for Test Mode.

## Constraints

| Constraint | Detail |
| --- | --- |
| Isolation | Seeds tagged `master_admin_demo` (or equivalent) + organization scoped |
| Cleanup | Soft-deletable / purgeable; never pollute partner production orgs without opt-in org flag |
| Mutations | Banner: “Actions are simulated unless explicitly committed.” Committing real writes requires explicit confirm and audit |
| Prefer | Read-only fixtures when possible; write seeds only when portal loaders require DB rows |

## Non-goals

- Seeding fake Auth users for every portal  
- Manual SQL by operators for routine QA  
- Showing demo data to non–Master Admin users  
