import { createHmac, timingSafeEqual } from "crypto";
import { serverEnv } from "../env/server-env";

const SIGNWELL_BASE = "https://www.signwell.com/api/v1";

export type SignWellRecipient = {
  id: string;
  name: string;
  email: string;
  placeholder_name?: string;
};

export type SignWellDocument = {
  id: string;
  status: string;
  name?: string;
  test_mode?: boolean;
  recipients?: Array<{
    id: string;
    name: string;
    email: string;
    status?: string;
  }>;
  error_message?: string | null;
};

export function isSignWellConfigured(): boolean {
  return Boolean(serverEnv.SIGNWELL_API_KEY);
}

export async function createAndSendSignWellDocument(input: {
  name: string;
  subject: string;
  message: string;
  fileName: string;
  fileBase64: string;
  recipients: SignWellRecipient[];
  metadata?: Record<string, string>;
  applySigningOrder?: boolean;
}): Promise<SignWellDocument> {
  if (!serverEnv.SIGNWELL_API_KEY) {
    throw new Error("SIGNWELL_API_KEY is not configured.");
  }

  const response = await fetch(`${SIGNWELL_BASE}/documents`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": serverEnv.SIGNWELL_API_KEY
    },
    body: JSON.stringify({
      test_mode: serverEnv.SIGNWELL_TEST_MODE !== "false",
      draft: false,
      with_signature_page: true,
      apply_signing_order: input.applySigningOrder ?? true,
      name: input.name,
      subject: input.subject,
      message: input.message,
      files: [
        {
          name: input.fileName,
          file_base64: input.fileBase64
        }
      ],
      recipients: input.recipients.map((recipient) => ({
        id: recipient.id,
        name: recipient.name,
        email: recipient.email,
        placeholder_name: recipient.placeholder_name ?? recipient.name
      })),
      metadata: input.metadata ?? {}
    })
  });

  const payload = (await response.json().catch(() => ({}))) as SignWellDocument & {
    error?: string;
    message?: string;
  };
  if (!response.ok) {
    throw new Error(
      payload.error_message ||
        payload.error ||
        payload.message ||
        `SignWell create failed (${response.status})`
    );
  }
  return payload;
}

export async function getSignWellDocument(documentId: string): Promise<SignWellDocument> {
  if (!serverEnv.SIGNWELL_API_KEY) {
    throw new Error("SIGNWELL_API_KEY is not configured.");
  }

  const response = await fetch(`${SIGNWELL_BASE}/documents/${documentId}`, {
    headers: {
      "X-Api-Key": serverEnv.SIGNWELL_API_KEY
    }
  });
  const payload = (await response.json().catch(() => ({}))) as SignWellDocument & {
    error?: string;
    message?: string;
  };
  if (!response.ok) {
    throw new Error(
      payload.error_message ||
        payload.error ||
        payload.message ||
        `SignWell get failed (${response.status})`
    );
  }
  return payload;
}

/** Verify SignWell webhook hash when SIGNWELL_WEBHOOK_ID is configured. */
export function verifySignWellWebhook(input: {
  eventType: string;
  eventTime: string;
  hash: string;
}): boolean {
  const webhookId = serverEnv.SIGNWELL_WEBHOOK_ID;
  if (!webhookId) {
    return true;
  }
  const digest = createHmac("sha256", webhookId)
    .update(`${input.eventType}@${input.eventTime}`)
    .digest("hex");
  try {
    return timingSafeEqual(Buffer.from(digest), Buffer.from(input.hash));
  } catch {
    return false;
  }
}

export function isSignWellCompletedStatus(status: string | null | undefined): boolean {
  if (!status) {
    return false;
  }
  const normalized = status.toLowerCase();
  return normalized === "completed" || normalized === "complete";
}
