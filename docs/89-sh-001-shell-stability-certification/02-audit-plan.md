# 02 — Audit Plan

| Surface | Probe |
| --- | --- |
| Mobile drawer | Open/close filmstrip; measure content height change in first 500ms |
| BrandLogo (drawer/header/sidebar) | Count src + layout mode changes after mount |
| Theme | Light/Dark/System hard refresh; logo asset must match first paint |
| Permissions | Time from drawer open → nav item count change |
| Ops Score / badges | Height/structure change when `/api/dashboard` returns |
| Favorites / Recents | Presence on first paint vs after effect |
| Expanded section | Section open state before vs after effect |
| Drawer mount model | Unmount vs keep-mounted |
| AI Copilot | Late appearance shifting bottom chrome |
| Sidebar collapsed | SSR width vs client localStorage |
| React | Profiler on ApplicationShell during drawer open |
