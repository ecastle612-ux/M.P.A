import { NextResponse } from "next/server";
import { apiError, parseJsonBody } from "../../../../../lib/api/http";
import { getConsentByToken, grantConsentByToken } from "../../../../../lib/screening/server";

type RouteContext = { params: Promise<{ token: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { token } = await context.params;
    const bundle = await getConsentByToken(token);
    if (!bundle) return apiError(404, "NOT_FOUND", "Consent link not found");
    if (bundle.expired) return apiError(410, "EXPIRED", "Consent link expired");

    const version = bundle.consentVersion as {
      id: string;
      version: number;
      disclosure_title: string;
      disclosure_body: string;
      authorization_body: string;
    } | null;

    return NextResponse.json(
      {
        alreadyGranted: bundle.alreadyGranted,
        party: {
          id: bundle.party.id,
          fullName: bundle.party.fullName,
          role: bundle.party.role,
          email: bundle.party.email
        },
        case: bundle.case
          ? {
              id: bundle.case.id,
              caseNumber: bundle.case.caseNumber,
              status: bundle.case.status,
              packageCode: bundle.case.packageCode
            }
          : null,
        disclosure: version
          ? {
              versionId: version.id,
              version: version.version,
              title: version.disclosure_title,
              body: version.disclosure_body,
              authorization: version.authorization_body
            }
          : null
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Consent lookup failed";
    return apiError(400, "CONSENT_LOOKUP_FAILED", message);
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { token } = await context.params;
    const parsed = await parseJsonBody(request);
    if (!parsed.ok) return parsed.response;
    const payload = parsed.payload as Record<string, unknown>;

    const signedName = typeof payload["signedName"] === "string" ? payload["signedName"] : "";
    const attestedDisclosure = payload["attestedDisclosure"] === true;
    const attestedAuthorization = payload["attestedAuthorization"] === true;

    const forwarded = request.headers.get("x-forwarded-for");
    const result = await grantConsentByToken(token, {
      signedName,
      attestedDisclosure,
      attestedAuthorization,
      ipAddress: forwarded?.split(",")[0]?.trim() ?? null,
      userAgent: request.headers.get("user-agent")
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Consent grant failed";
    return apiError(400, "CONSENT_GRANT_FAILED", message);
  }
}
