import Link from "next/link";

export type RelationshipLink = {
  href?: string;
  label: string;
};

export function EntityRelationshipChain({ links }: { links: RelationshipLink[] }) {
  const visible = links.filter((link) => link.label.trim().length > 0);
  if (visible.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label="Entity relationships"
      className="flex flex-wrap items-center gap-1.5 rounded-[var(--mpa-radius-lg)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface-muted)]/50 px-3 py-2 text-sm"
    >
      {visible.map((link, index) => (
        <span key={`${link.label}-${index}`} className="inline-flex items-center gap-1.5">
          {index > 0 ? (
            <span className="text-[var(--mpa-color-text-muted)]" aria-hidden>
              /
            </span>
          ) : null}
          {link.href ? (
            <Link
              href={link.href}
              className="font-medium text-[var(--mpa-color-brand-primary)] hover:underline"
            >
              {link.label}
            </Link>
          ) : (
            <span className="font-medium text-[var(--mpa-color-text-primary)]">{link.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
