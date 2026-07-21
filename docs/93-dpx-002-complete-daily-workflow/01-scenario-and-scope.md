# 01 — Scenario and Scope

**Package:** DPX-002  
**Status:** Draft

---

## Certified path (ordered)

| Step | Goal | Primary surface (existing) | Entry method (prefer) |
| --- | --- | --- | --- |
| S1 | Review today’s priorities | `/dashboard` | Land after login |
| S2 | Locate a property | Property list / Search M.P.A. / dashboard link | Search or priority card |
| S3 | Open a resident | Resident detail | From property → resident, or Search |
| S4 | View lease status | Resident detail / lease deep link | Toolbelt or one-glance |
| S5 | Collect payment information | Resident / financial charges path | Toolbelt “Collect rent” / charges |
| S6 | Review maintenance | Work order list or detail | From resident/property or dashboard urgent |
| S7 | Assign a vendor | Work order detail | Toolbelt Assign |
| S8 | Communicate with resident | Messages / resident Message action | Toolbelt Message |
| S9 | Notify owner if necessary | Communications / announcement or message path | Existing comms only |
| S10 | Return to dashboard | `/dashboard` | Logo / Ops / Search “dashboard” |

## Surface allowlist

Only existing authenticated PM surfaces. Prefer:

- Dashboard (Operations Center)  
- Search M.P.A. (drawer / command)  
- Property detail  
- Resident (tenant) detail  
- Lease (open/status — existing routes)  
- Financial charge / payment attention (existing)  
- Maintenance list + work order detail  
- Communications / messaging (existing)  
- Floating AI Copilot (shell)

## Not in this sprint

- New nav items, new modules, new settings areas  
- Applicant → lease creation (leasing day is DPX-001 Amendment B — **later**)  
- Full owner-statement generation as a separate product track (may touch existing path only if needed for S9 — do not invent)  
- EP-019 performance deep-dives  

## Continuity rule

Every transition must prefer:

1. **In-context next action** (toolbelt / predicted action)  
2. **Search M.P.A.**  
3. **Floating AI** (suggest + deep link)  
4. Global nav / drawer — last resort  

If the operator must “go home and hunt,” that step **fails** until fixed.
