import { Breadcrumbs } from "../../../../components/shell/breadcrumbs";
import { TeamInvitePanel } from "../../../../components/team/team-invite-panel";

export default function TeamSettingsPage() {
  return (
    <main className="flex-1 space-y-6 bg-[var(--mpa-color-bg-app)] p-4 md:p-6">
      <Breadcrumbs
        items={[
          { href: "/pm/mission-control", label: "Mission Control" },
          { href: "/settings/organization", label: "Settings" },
          { label: "Team" }
        ]}
      />
      <header className="max-w-2xl space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          Build your team
        </p>
        <h1 className="font-display text-3xl font-semibold text-[var(--mpa-color-text-primary)]">
          Invite users
        </h1>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          Invite teammates, assign a role, and get everyone into the correct workspace — without
          admin assistance.
        </p>
      </header>
      <TeamInvitePanel />
    </main>
  );
}
