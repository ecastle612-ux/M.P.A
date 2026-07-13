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
                <Link className="hover:text-[var(--mpa-color-text-primary)]" href={item.href}>
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? "text-[var(--mpa-color-text-primary)]" : ""}>{item.label}</span>
              )}
              {!isLast ? <span aria-hidden>/</span> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
