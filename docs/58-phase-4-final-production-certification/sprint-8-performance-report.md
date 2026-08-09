# Sprint 8 — Performance Report

| Area | Observation |
| --- | --- |
| Public pages | Fast TTFB on Vercel Production; fonts preloaded |
| Skeletons | Present on Documents / Reports / finance desks |
| Empty states | `@mpa/ui` EmptyState used |
| Errors / retry | API JSON errors surfaced in workspaces |
| Search / tables | Client filters on Documents; directory toolbars on PM |
| PDF generation | `pdf-lib` server/client builders — S6 smoke PASS |
| Document preview | Text/image paths; binary honesty note |
| Demo | Snapshot-derived; no live DB load |

No performance defects opened. Preload console hints are non-blocking.
