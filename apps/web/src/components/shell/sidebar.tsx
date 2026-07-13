import Link from "next/link";

const NAV_GROUPS = [
  {
    title: "Operations",
    items: [
      { href: "/dashboard", label: "Dashboard" },
      { href: "#", label: "Queue (placeholder)" },
      { href: "#", label: "Search (placeholder)" }
    ]
  },
  {
    title: "Platform",
    items: [
      { href: "#", label: "Notifications (placeholder)" },
      { href: "#", label: "Settings (placeholder)" }
    ]
  }
];

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-[var(--mpa-color-border-sidebar)] bg-[var(--mpa-color-bg-sidebar)] text-[var(--mpa-color-text-sidebar)] lg:block">
      <div className="border-b border-[var(--mpa-color-border-sidebar)] px-4 py-4">
        <p className="font-display text-lg font-semibold text-[var(--mpa-color-text-sidebar-active)]">M.P.A.</p>
        <p className="text-xs text-[var(--mpa-color-text-sidebar)]">Foundation shell</p>
      </div>
      <nav className="space-y-6 px-3 py-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.title}>
            <p className="mb-2 px-2 text-xs uppercase tracking-wide text-[var(--mpa-color-text-sidebar)]/80">
              {group.title}
            </p>
            <ul className="space-y-1">
              {group.items.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="block rounded-md px-2 py-2 text-sm hover:bg-[var(--mpa-color-bg-sidebar-elevated)] hover:text-[var(--mpa-color-text-sidebar-active)]"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
