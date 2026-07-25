import { BrandedLoadingScreen } from "../components/branding/branded-loading-screen";
import { brandSurfaceToneForMode } from "../lib/theme/theme-sync";
import { readServerThemeState } from "../lib/theme/read-theme-cookies";

export default async function GlobalLoading() {
  const theme = await readServerThemeState();
  return (
    <BrandedLoadingScreen
      tone={brandSurfaceToneForMode(theme.mode)}
      message="Loading your workspace…"
    />
  );
}
