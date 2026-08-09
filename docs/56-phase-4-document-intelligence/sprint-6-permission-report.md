# Sprint 6 — Permission Report

| Actor | Access |
| --- | --- |
| Org managers / PM / leasing | Read + write (existing grants) |
| Technicians | Read |
| Owners / vendors / tenants | Read |
| Platform operators | Platform Launch readiness unchanged |

API gates via `requireDocumentPermission`. RLS on documents, links, and versions. Residents only reach resident-permitted surfaces; staff Center respects org membership. No new capability namespace invented.
