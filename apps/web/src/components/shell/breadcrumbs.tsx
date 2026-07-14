import Link from "next/link";

export function Breadcrumbs({
  items
}: {
  items: Array<{ href?: string; label: string }>;
}) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex items-center gap-2 text-sm text-[var(--mpa-color-text-secondary)]">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={item.label} className="flex items-center gap-2">
              {item.href && !isLast ? (
                <Link
                  className="rounded-sm px-1 py-0.5 transition-colors hover:text-[var(--mpa-color-text-primary)]"
                  href={item.href}
                >
                  {item.label}
                </Link>
              ) : (
                <span aria-current={isLast ? "page" : undefined} className={isLast ? "font-medium text-[var(--mpa-color-text-primary)]" : ""}>
                  {item.label}
                </span>
              )}
              {!isLast ? <span aria-hidden className="text-[var(--mpa-color-text-muted)]">/</span> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
