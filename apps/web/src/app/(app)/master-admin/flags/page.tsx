import { Card } from "@mpa/ui";
import { getMasterAdminFlagSnapshot } from "../../../../lib/master-admin/flags";

export default function MasterAdminFlagsPage() {
  const flags = getMasterAdminFlagSnapshot();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-xl font-semibold text-[var(--mpa-color-text-primary)]">
          Feature flags
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--mpa-color-text-secondary)]">
          Read-only public flags and whether provider environment variables are set (boolean only —
          values are never shown).
        </p>
      </div>

      <Card className="space-y-3">
        <h2 className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">Public flags</h2>
        <ul className="space-y-2 text-sm">
          <li className="flex justify-between gap-4">
            <span className="text-[var(--mpa-color-text-secondary)]">
              NEXT_PUBLIC_DESIGN_PARTNER_MODE
            </span>
            <span className="font-medium text-[var(--mpa-color-text-primary)]">
              {flags.public.NEXT_PUBLIC_DESIGN_PARTNER_MODE ?? "unset"}
            </span>
          </li>
          <li className="flex justify-between gap-4">
            <span className="text-[var(--mpa-color-text-secondary)]">NEXT_PUBLIC_MPA_ENV</span>
            <span className="font-medium text-[var(--mpa-color-text-primary)]">
              {flags.public.NEXT_PUBLIC_MPA_ENV ?? "unset"}
            </span>
          </li>
        </ul>
      </Card>

      <Card className="space-y-3">
        <h2 className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">
          Provider env presence
        </h2>
        <ul className="space-y-2 text-sm">
          {Object.entries(flags.providerEnvPresent).map(([key, value]) => (
            <li key={key} className="flex justify-between gap-4">
              <span className="text-[var(--mpa-color-text-secondary)]">{key}</span>
              <span
                className={
                  value
                    ? "font-medium text-[var(--mpa-color-feedback-success,#15803d)]"
                    : "font-medium text-[var(--mpa-color-text-tertiary)]"
                }
              >
                {value ? "present" : "missing"}
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
