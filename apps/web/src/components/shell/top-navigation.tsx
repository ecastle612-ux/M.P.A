import dynamic from "next/dynamic";
import { Input } from "@mpa/ui";
import { OrganizationSwitcher } from "./organization-switcher";
import { RoleSwitcher } from "./role-switcher";
import { NotificationCenter } from "./notification-center";
import { ProfileMenu } from "./profile-menu";

const CommandPalette = dynamic(
  async () => {
    const importedModule = await import("./command-palette");
    return importedModule.CommandPalette;
  },
  {
    ssr: false,
    loading: () => (
      <button
        type="button"
        className="hidden min-h-9 rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-3 py-2 text-sm text-[var(--mpa-color-text-secondary)] xl:inline-flex"
      >
        Command Palette
      </button>
    )
  },
);

export function TopNavigation() {
  return (
    <header className="sticky top-0 z-30 flex min-h-16 items-center gap-2 border-b border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)]/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-[var(--mpa-color-bg-surface)]/85 sm:gap-3 sm:px-4">
      <div className="hidden min-w-0 flex-1 md:block">
        <Input
          aria-label="Search placeholder"
          placeholder="Search workspace..."
          className="max-w-md"
        />
      </div>
      <div className="ml-auto flex min-w-0 flex-wrap items-center justify-end gap-2">
        <OrganizationSwitcher />
        <RoleSwitcher />
        <CommandPalette />
        <NotificationCenter />
        <ProfileMenu />
      </div>
    </header>
  );
}
