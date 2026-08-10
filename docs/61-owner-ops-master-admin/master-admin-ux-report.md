# Master Admin UX Report

**Date:** 2026-08-10

## Design constraints honored

- Redesigned **dashboard experience only** (Command Center)
- Kept existing navigation architecture (`MASTER_ADMIN_NAV`)
- Kept existing routes where possible
- Did not redesign authentication or customer product UIs

## Command Center composition

1. Hero — Owner Operations framing + deploy meta  
2. Platform Health — linked health cards  
3. Customer Search — global search  
4. Needs attention — actionable alerts  
5. Live Activity — orgs / commercial / provisioning / support  
6. Fleet summary — org + user metrics  

## Shell

- Sidebar branding: **Owner Operations · Platform Operations Console**
- Command Center active state no longer marks every `/admin/*` route active
- Exit to customer app retained

## Support diagnosis standard

For each screen: *If a customer calls with a problem, can I solve it from here?*

| Screen | Answer |
|---|---|
| Command Center | Yes for triage start (health + search + activity) |
| Org profile | Yes for subscription/provisioning/invite/users |
| User profile | Yes for auth/roles/memberships/docs |
| Support Center | Yes for fleet lookup + timeline |
| View As | Yes for experiential diagnosis (read-only) |
| System Health | Yes for infra/integration status |
