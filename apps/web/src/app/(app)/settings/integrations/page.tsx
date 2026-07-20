import { ProviderStatusCenter } from "../../../../components/settings/provider-status-center";
import { buildProviderHealthDashboard } from "../../../../lib/integrations/provider-status";

export default async function IntegrationsSettingsPage() {
  const providers = await buildProviderHealthDashboard();
  return <ProviderStatusCenter providers={providers} />;
}
