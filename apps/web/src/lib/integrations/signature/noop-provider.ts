import type { SignatureProvider, SignatureProviderResult } from "./contracts";

export const noopSignatureProvider: SignatureProvider = {
  id: "noop",
  async createSignatureRequest({ requestNumber }): Promise<SignatureProviderResult> {
    return {
      externalReference: `noop-sig-${requestNumber}`,
      status: "pending"
    };
  }
};
