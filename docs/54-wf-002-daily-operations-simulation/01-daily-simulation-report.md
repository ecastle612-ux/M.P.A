# WF-002 — Daily Simulation Report

## Day 1 — Company setup (live UI)

| Step | Result | Clicks (approx) | Notes |
| --- | --- | --- | --- |
| Complete Profile | Done (pre-existing) | — | Already checked |
| Create Organization | **Pass** | 2 | Created “Canopy Property Partners” |
| Upload Logo | **Missing** | — | No org logo upload UI (product logo only) |
| Invite Staff | **Partial / Bug** | 3+ | Send hung on first compile; no timeout (fixed). Role presets don’t change role labels meaningfully |
| Create Property | **Pass after fix** | 6–10 | Blocked by `gen_random_bytes` until pgcrypto fix; form has many optional fields; default status was Draft (now Active) |
| Create Units | **In progress / reachable** | 3+ | Wizard advanced to Add Units after property |
| Import Residents / Leases | **Partial** | 4+ | Migration Center exists; not completed in this live pass |
| Review Dashboard | **Reachable** | 1 | Ops Center = `/dashboard` |

### Day 1 UX findings (live)

1. React hydration error badge visible in Next.js overlay — unprofessional for partners  
2. Push enrollment banner + sticky Command Center search can intercept clicks  
3. Invite Send stuck on “Sending…” with no timeout (fixed)  
4. Optional Invite step could pull wizard backward after property create (fixed)  
5. Property create failed with raw Postgres error until pgcrypto restored (fixed)  
6. Property form field count is high for first-run (~15 controls)

## Day 2 — Applicant → portal (UI audit + WF-001 paths)

| Step | Via UI? | Friction |
| --- | --- | --- |
| Applicant applies | Partial (PM creates; no public apply) | Large form |
| Review / screening / approve | Yes | Lifecycle actions now filtered to valid transitions (fixed) |
| Lease + e-sign | Partial (sandbox) | Multi-hop; signature notify href was dead (fixed) |
| Activation + portal | Partial | Invite best-effort; welcome notification not auto |
| Welcome notification | No auto | Manual communications only |

## Day 3 — Resident ops

| Step | Via UI? | Notes |
| --- | --- | --- |
| Pay rent | Partial | Sandbox billing portal |
| Upload documents | **No** | Read-only documents page |
| Maintenance request | Yes | Photos supported |
| Messages | Partial | Cannot start thread |
| Announcements / notifications / profile | Yes | |

## Day 4 — Maintenance loop

| Step | Via UI? | Notes |
| --- | --- | --- |
| Assign vendor | Yes | Detail page panel |
| Vendor updates | Yes | Portal status dropdown |
| Upload photos | Partial | Resident/PM edit yes; detail labeling improved; vendor photos no |
| Complete | Partial | Status transitions |
| Resident confirmed | **No** | Missing feature |
| Timeline | Yes | Activity events |

## Day 5 — Financials / ops / search

| Step | Via UI? | Notes |
| --- | --- | --- |
| Financial dashboard / collections | Yes / partial | Collections mostly display |
| Export reports | **No** | Owner statements only |
| Ops + Command Center + search | Yes | Strong |
| Audit trail | **No** | Entity timelines only |
