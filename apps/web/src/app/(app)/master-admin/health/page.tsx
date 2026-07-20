import { Card } from "@mpa/ui";
import { createAuthServerComponentClient } from "../../../../lib/auth/server";
import { getMasterAdminHealthChecks } from "../../../../lib/master-admin/health";
import { requireMasterAdminPageAccess } from "../../../../lib/master-admin/access";

export default async function MasterAdminHealthPage() {
  const { organizationId } = await requireMasterAdminPageAccess();
  const supabase = await createAuthServerComponentClient();
  const checks = await getMasterAdminHealthChecks(supabase, organizationId);
  const allOk = checks.every((check) => check.ok);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-xl font-semibold text-[var(--mpa-color-text-primary)]">
          System health
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--mpa-color-text-secondary)]">
          Read-only table reachability and counts for the active organization. No secrets are exposed.
        </p>
      </div>

      <Card className="space-y-3">
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          Overall:{" "}
          <span
            className={
              allOk
                ? "font-medium text-[var(--mpa-color-feedback-success,#15803d)]"
                : "font-medium text-[var(--mpa-color-feedback-danger,#b91c1c)]"
            }
          >
            {allOk ? "Healthy" : "Issues detected"}
          </span>
        </p>
        <ul className="divide-y divide-[var(--mpa-color-border-default)]">
          {checks.map((check) => (
            <li key={check.table} className="flex items-center justify-between gap-4 py-2.5 text-sm">
              <span className="font-medium text-[var(--mpa-color-text-primary)]">{check.table}</span>
              {check.ok ? (
                <span className="text-[var(--mpa-color-text-secondary)]">count {check.count}</span>
              ) : (
                <span className="text-[var(--mpa-color-feedback-danger,#b91c1c)]">
                  {check.error ?? "Failed"}
                </span>
              )}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
