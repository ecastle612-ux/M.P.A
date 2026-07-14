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
        className="rounded-md border border-[var(--mpa-color-border-default)] bg-white px-3 py-2 text-sm text-[var(--mpa-color-text-secondary)]"
      >
        Command Palette
      </button>
    )
  },
);

export function TopNavigation() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-4">
      <div className="hidden min-w-[260px] flex-1 md:block">
        <Input aria-label="Search placeholder" placeholder="Search placeholder..." />
      </div>
      <OrganizationSwitcher />
      <RoleSwitcher />
      <CommandPalette />
      <NotificationCenter />
      <ProfileMenu />
    </header>
  );
}
