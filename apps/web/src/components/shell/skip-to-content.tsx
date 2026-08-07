export function SkipToContent({ href = "#main-content" }: { href?: string }) {
  return (
    <a
      href={href}
      className="absolute left-4 top-4 z-50 -translate-y-[200%] rounded-md bg-[var(--mpa-color-bg-surface)] px-3 py-2 text-sm font-medium text-[var(--mpa-color-text-primary)] shadow-lg outline outline-2 outline-[var(--mpa-color-brand-primary)] transition focus:translate-y-0"
    >
      Skip to content
    </a>
  );
}
