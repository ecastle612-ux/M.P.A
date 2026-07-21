# 10 — Pass Criteria

**Package:** ADMIN-001  
**Status:** Draft

## Hard PASS (all required)

| # | Criterion |
| --- | --- |
| 1 | Master Admin can enter every portal (Resident, Vendor, Owner, Manager) |
| 2 | No additional accounts required for that test |
| 3 | No manual database edits required for routine portal QA |
| 4 | No fake login / second password |
| 5 | One account can exercise the entire platform surface covered by this package |
| 6 | Existing permissions unchanged for everyone without `master_admin` |
| 7 | Every major role can be impersonated (PM, Resident, Vendor, Owner) |
| 8 | Audit logs capture each session (admin, target, org, start/end, duration, pages, sensitive actions) |
| 9 | Return to original session is one click |
| 10 | Banners leave no ambiguity about Test Mode vs Impersonation vs real user |

## Fail if

- Email allowlists in code  
- Impersonation without audit  
- Missing banner  
- Non–Master Admin can enter Test Mode or Impersonation APIs  
- Empty primary portal pages in Test Mode when seed should apply  

## PASS authority

Record evidence in a certification report after Approve + implement. Chat confirmation alone is not enough; attach Preview URL + checklist ticks.
