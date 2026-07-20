import type { ReactNode } from "react";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5 text-sm">
      <span className="font-medium text-[var(--mpa-color-text-primary)]">{label}</span>
      {children}
    </label>
  );
}
