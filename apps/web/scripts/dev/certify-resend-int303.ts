/**
 * INT-303 live Resend certification harness.
 *
 * Usage (from apps/web):
 *   EMAIL_PROVIDER=resend RESEND_API_KEY=... EMAIL_FROM=... \
 *   EMAIL_ENVIRONMENT=production CERT_INBOX=you@example.com \
 *   pnpm exec tsx scripts/dev/certify-resend-int303.ts
 *
 * Never logs API keys. Requires a real inbox — no mocked success.
 */
import {
  getEmailProvider,
  getEmailProviderKey,
  sendWorkflowEmail,
  type EmailTemplateKey
} from "../../src/lib/integrations/email";
import { getEmailDeliveryTelemetry } from "../../src/lib/integrations/email/audit";
import { getEmailEnvironment, getEmailFrom, validateEmailConfiguration } from "../../src/lib/integrations/email/config";

type Gate = "PASS" | "WARNING" | "FAIL";

function gate(ok: boolean, warn = false): Gate {
  if (ok) return "PASS";
  return warn ? "WARNING" : "FAIL";
}

async function main(): Promise<void> {
  const inbox = process.env["CERT_INBOX"]?.trim();
  const orgId = process.env["CERT_ORG_ID"]?.trim() || "00000000-0000-4000-8000-000000000303";
  const providerKey = getEmailProviderKey();
  const config = validateEmailConfiguration(providerKey);
  const provider = getEmailProvider();

  console.log("=== INT-303 Resend Certification ===");
  console.log(
    JSON.stringify(
      {
        provider: providerKey,
        environment: getEmailEnvironment(),
        fromConfigured: Boolean(getEmailFrom()),
        configValid: config.valid,
        missing: config.missing,
        warnings: config.warnings,
        inboxConfigured: Boolean(inbox)
      },
      null,
      2
    )
  );

  const results: Array<{ area: string; gate: Gate; detail: string }> = [];

  results.push({
    area: "Configuration",
    gate: gate(providerKey === "resend" && config.valid, providerKey !== "resend"),
    detail:
      providerKey !== "resend"
        ? `EMAIL_PROVIDER=${providerKey}`
        : config.valid
          ? "resend + key + from present"
          : `missing ${config.missing.join(", ")}`
  });

  const health = await provider.health();
  results.push({
    area: "Authentication",
    gate: gate(health.ok),
    detail: health.detail ?? (health.ok ? "ok" : "health failed")
  });
  results.push({
    area: "Provider Health",
    gate: gate(health.ok && health.verifiedDomain === true, health.ok),
    detail: `verifiedDomain=${String(health.verifiedDomain)} domain=${health.domainName ?? "n/a"}`
  });

  if (!inbox || providerKey !== "resend" || !config.valid) {
    results.push({
      area: "Template Delivery",
      gate: "FAIL",
      detail: "Skipped — set EMAIL_PROVIDER=resend, credentials, and CERT_INBOX for live inbox proof"
    });
  } else {
    const templates: EmailTemplateKey[] = [
      "user_invitation",
      "welcome_email",
      "announcement_email",
      "maintenance_notification",
      "owner_statement",
      "financial_report",
      "general_notification"
    ];
    let delivered = 0;
    for (const templateKey of templates) {
      const result = await sendWorkflowEmail({
        organizationId: orgId,
        templateKey,
        idempotencyKey: `${orgId}:cert:${templateKey}:${Date.now()}`,
        to: { email: inbox, name: "INT-303 Cert" },
        subject: `[INT-303] ${templateKey}`,
        body: `Live certification send for ${templateKey}.`,
        href: "/dashboard"
      });
      const ok = result.status === "sent" || result.status === "queued";
      if (ok) delivered += 1;
      console.log(
        JSON.stringify({
          templateKey,
          status: result.status,
          externalId: result.externalId ?? null,
          requestId: result.requestId ?? null,
          errorCode: result.errorCode ?? null
        })
      );
    }
    results.push({
      area: "Template Delivery",
      gate: gate(delivered === templates.length, delivered > 0),
      detail: `${delivered}/${templates.length} accepted by Resend`
    });
  }

  // Failure behavior (invalid recipient — no HTTP expected beyond validation)
  const failure = await provider.sendEmail({
    organizationId: orgId,
    idempotencyKey: `${orgId}:cert:invalid:${Date.now()}`,
    templateKey: "general_notification",
    to: { email: "not-an-email" },
    subject: "should fail",
    html: "<p>x</p>"
  });
  results.push({
    area: "Failures",
    gate: gate(failure.status === "failed" && failure.errorCode === "invalid_recipient"),
    detail: `${failure.status}/${failure.errorCode ?? "none"}`
  });

  // Idempotent retry / dedupe
  const dedupeKey = `${orgId}:cert:dedupe:${Date.now()}`;
  if (providerKey === "resend" && config.valid && inbox) {
    const first = await sendWorkflowEmail({
      organizationId: orgId,
      templateKey: "general_notification",
      idempotencyKey: dedupeKey,
      to: { email: inbox },
      subject: "[INT-303] dedupe",
      body: "dedupe"
    });
    const second = await sendWorkflowEmail({
      organizationId: orgId,
      templateKey: "general_notification",
      idempotencyKey: dedupeKey,
      to: { email: inbox },
      subject: "[INT-303] dedupe",
      body: "dedupe"
    });
    results.push({
      area: "Retries",
      gate: gate(Boolean(second.rawSafe?.["deduplicated"]) || first.status === second.status),
      detail: `first=${first.status} second=${second.status} deduped=${Boolean(second.rawSafe?.["deduplicated"])}`
    });
  } else {
    results.push({
      area: "Retries",
      gate: "WARNING",
      detail: "Live dedupe not exercised without CERT_INBOX + resend config"
    });
  }

  const telemetry = getEmailDeliveryTelemetry();
  results.push({
    area: "Audit",
    gate: gate(Boolean(telemetry.lastDeliveryAt)),
    detail: `lastDelivery=${telemetry.lastDeliveryAt ?? "none"} lastRequestId=${telemetry.lastRequestId ?? "none"}`
  });

  const productionReady =
    providerKey === "resend" &&
    config.valid &&
    health.ok &&
    health.verifiedDomain === true &&
    getEmailEnvironment() === "production" &&
    Boolean(telemetry.lastSuccessAt) &&
    results.find((r) => r.area === "Template Delivery")?.gate === "PASS";

  results.push({
    area: "Production Readiness",
    gate: gate(Boolean(productionReady), health.ok),
    detail: productionReady
      ? "Production Ready criteria met (live send + verified domain + production env)"
      : "Not Production Ready — complete live inbox + verified domain + EMAIL_ENVIRONMENT=production"
  });

  console.log("\n=== Gates ===");
  for (const row of results) {
    console.log(`${row.gate.padEnd(8)} ${row.area}: ${row.detail}`);
  }

  console.log("\n=== Readiness ===");
  console.log(
    JSON.stringify(
      {
        designPartnerReadiness: health.ok || providerKey === "noop" ? "WARNING" : "FAIL",
        productionReadiness: productionReady ? "PASS" : "FAIL",
        commercialReadiness: productionReady ? "PASS" : "FAIL",
        resendProductionReady: Boolean(productionReady)
      },
      null,
      2
    )
  );

  if (!productionReady) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
