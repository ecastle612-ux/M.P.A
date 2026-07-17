import Link from "next/link";

export function Breadcrumbs({
  items
}: {
  items: Array<{ href?: string; label: string }>;
}) {
  return (
    <nav aria-label="Breadcrumb" className="mb-1">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-[var(--mpa-color-text-muted)]">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
              {item.href && !isLast ? (
                <Link
                  className="rounded-[var(--mpa-radius-sm)] px-1 py-0.5 transition-colors hover:text-[var(--mpa-color-text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--mpa-color-border-focus)]"
                  href={item.href}
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className={isLast ? "font-medium text-[var(--mpa-color-text-primary)]" : ""}
                >
                  {item.label}
                </span>
              )}
              {!isLast ? (
                <svg
                  aria-hidden="true"
                  className="h-3.5 w-3.5 text-[var(--mpa-color-border-strong)]"
                  viewBox="0 0 16 16"
                  fill="none"
                >
                  <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
