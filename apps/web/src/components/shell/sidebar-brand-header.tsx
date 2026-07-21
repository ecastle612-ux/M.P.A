import { BrandLogo } from "../branding/brand-logo";

export function SidebarBrandHeader({ collapsed }: { collapsed: boolean }) {
  return (
    <div className={collapsed ? "flex items-center justify-center" : "flex min-w-0 items-center"}>
      <BrandLogo purpose="sidebar" collapsed={collapsed} priority />
    </div>
  );
}
