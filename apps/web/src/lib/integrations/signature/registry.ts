import type { SignatureProvider } from "./contracts";
import { noopSignatureProvider } from "./noop-provider";
import { signwellProvider } from "./signwell-provider";

const providers = new Map<string, SignatureProvider>([
  [noopSignatureProvider.id, noopSignatureProvider],
  [signwellProvider.id, signwellProvider]
]);

const RETIRED_PROVIDERS = new Set(["dropbox_sign", "hellosign"]);

export function resolveDefaultSignatureProviderId(): string {
  const configured = process.env["SIGNATURE_PROVIDER"]?.trim();
  if (!configured) return "noop";
  if (RETIRED_PROVIDERS.has(configured)) {
    throw new Error(
      `SIGNATURE_PROVIDER=${configured} is retired. Use SIGNATURE_PROVIDER=signwell (ADR-030).`
    );
  }
  return configured;
}

export function getSignatureProvider(providerId?: string): SignatureProvider {
  const raw = providerId?.trim() || resolveDefaultSignatureProviderId();
  if (RETIRED_PROVIDERS.has(raw)) {
    throw new Error(
      `Signature provider "${raw}" is retired. Migrate packages to SignWell (ADR-030).`
    );
  }
  const provider = providers.get(raw);
  if (!provider) {
    throw new Error(`Unknown signature provider: ${raw}`);
  }
  return provider;
}

export function registerSignatureProvider(provider: SignatureProvider): () => void {
  providers.set(provider.id, provider);
  return () => providers.delete(provider.id);
}

export function listSignatureProviders(): SignatureProvider[] {
  return Array.from(providers.values());
}
