import type { ConnectProvider } from "./contracts";
import { noopConnectProvider } from "./noop-provider";
import { stripeConnectProvider } from "./stripe-connect-provider";

const providers = new Map<string, ConnectProvider>([
  [noopConnectProvider.id, noopConnectProvider],
  [stripeConnectProvider.id, stripeConnectProvider]
]);

export function resolveDefaultConnectProviderId(): string {
  return process.env["CONNECT_PROVIDER"]?.trim() || "noop";
}

export function isFin003PhaseAEnabled(): boolean {
  const flag = process.env["FIN003_PHASE_A_ENABLED"]?.trim().toLowerCase();
  if (flag === "0" || flag === "false" || flag === "off") return false;
  // Default on in non-production so local/CI can exercise; production requires explicit enable.
  if (process.env["NODE_ENV"] === "production") {
    return flag === "1" || flag === "true" || flag === "on";
  }
  return flag !== "0" && flag !== "false" && flag !== "off";
}

/**
 * FIN-003 Phase C money-out kill switch — independent of onboarding + PAY-001 funding.
 * Production requires explicit enable. Non-prod defaults off (fail closed for transfers).
 */
export function isFin003TransfersEnabled(): boolean {
  const flag = process.env["FIN003_TRANSFERS_ENABLED"]?.trim().toLowerCase();
  return flag === "1" || flag === "true" || flag === "on";
}

export function getConnectProvider(providerId?: string): ConnectProvider {
  if (!isFin003PhaseAEnabled()) {
    return noopConnectProvider;
  }
  const id = providerId?.trim() || resolveDefaultConnectProviderId();
  const provider = providers.get(id);
  if (!provider) {
    throw new Error(`Unknown Connect provider: ${id}`);
  }
  return provider;
}

export function registerConnectProvider(provider: ConnectProvider): () => void {
  providers.set(provider.id, provider);
  return () => providers.delete(provider.id);
}

export function listConnectProviders(): ConnectProvider[] {
  return Array.from(providers.values());
}
