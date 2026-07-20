import {
  getEmailProviderKey,
  isKnownEmailProviderKey,
  validateEmailConfigurationOnBoot
} from "./config";
import type { EmailProvider } from "./contracts";
import { noopEmailProvider } from "./noop-provider";
import { resendProvider } from "./resend-provider";

export { getEmailProviderKey } from "./config";

/**
 * Email Provider Registry — sole factory for transactional email adapters.
 * Business modules must call getEmailProvider() / sendWorkflowEmail(), never Resend directly.
 */
export function getEmailProvider(): EmailProvider {
  validateEmailConfigurationOnBoot();
  const key = getEmailProviderKey();
  switch (key) {
    case "resend":
      return resendProvider;
    case "noop":
      return noopEmailProvider;
    default:
      if (!isKnownEmailProviderKey(key)) {
        console.warn("[email] unknown EMAIL_PROVIDER — refusing silent success", { provider: key });
      }
      return {
        key,
        async sendEmail() {
          return {
            status: "failed",
            providerKey: key,
            errorCode: "unknown_provider",
            errorMessage: `Unsupported EMAIL_PROVIDER="${key}"`
          };
        },
        async health() {
          return {
            ok: false,
            providerKey: key,
            detail: `Unsupported EMAIL_PROVIDER="${key}"`
          };
        },
        async validateConfiguration() {
          return {
            valid: false,
            missing: [],
            warnings: [`Unknown EMAIL_PROVIDER="${key}"`]
          };
        }
      };
  }
}
