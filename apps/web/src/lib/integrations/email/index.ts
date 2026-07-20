export type {
  EmailConfigValidation,
  EmailHealthResult,
  EmailProvider,
  EmailProviderKey,
  EmailTemplateKey,
  SendEmailInput,
  SendEmailResult
} from "./contracts";
export { EMAIL_TEMPLATE_KEYS } from "./contracts";
export {
  getEmailEnvironment,
  getEmailFrom,
  getEmailProviderKey,
  getEmailReplyTo,
  validateEmailConfiguration,
  validateEmailConfigurationOnBoot
} from "./config";
export { getEmailDeliveryTelemetry } from "./audit";
export { getEmailProvider } from "./registry";
export {
  sendInvitationEmail,
  sendWorkflowEmail,
  templateKeyForNotify,
  type WorkflowEmailInput
} from "./delivery";
export { isValidEmailAddress, resolveUserEmailAddress } from "./resolve-recipient";
export {
  invitationEmailContent,
  passwordResetAuthTemplateHtml,
  renderMpaEmail,
  renderTransactionalEmail
} from "./render";
