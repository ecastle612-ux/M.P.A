# 12 — Reports

**Package:** FAC-002  
**Rule:** Use existing ReportingService — printable + exportable.

---

## V1.0 facility report types

| Report | Audience | Content |
|--------|----------|---------|
| Technician activity | Managers / techs | Completed/open WOs by assignee, period |
| Inventory status | Managers | Counts by status/property; list export |
| Asset register | Managers | Assets with warranty/expected life flags |
| Monthly building | Managers / owners (if shared later) | Period WOs, PM compliance, inspections, notable expenses |

---

## Delivery

- Generate via ReportingService patterns (async or sync as existing).  
- Store versions in Document Vault where existing reports do.  
- Print CSS / PDF export parity with financial reports.

---

## Non-goals

- New BI warehouse  
- Owner portal report generation (owners consume allow-listed outputs only)  
