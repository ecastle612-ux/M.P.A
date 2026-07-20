import { getEmailDeliveryTelemetry } from "./audit";
import type {
  EmailConfigValidation,
  EmailHealthResult,
  EmailProvider,
  SendEmailResult
} from "./contracts";

export const noopEmailProvider: EmailProvider = {
  key: "noop",

  async sendEmail(): Promise<SendEmailResult> {
    return {
      status: "skipped",
      providerKey: "noop",
      errorCode: "provider_noop",
      errorMessage: "EMAIL_PROVIDER=noop — outbound email disabled"
    };
  },

  async health(): Promise<EmailHealthResult> {
    const telemetry = getEmailDeliveryTelemetry();
    return {
      ok: true,
      providerKey: "noop",
      detail: "Noop email provider — no outbound mail.",
      verifiedDomain: null,
      domainName: null,
      lastSuccessAt: telemetry.lastSuccessAt,
      lastFailureAt: telemetry.lastFailureAt,
      lastFailureMessage: telemetry.lastFailureMessage,
      lastDeliveryAt: telemetry.lastDeliveryAt
    };
  },

  async validateConfiguration(): Promise<EmailConfigValidation> {
    return { valid: true, missing: [], warnings: [] };
  }
};
