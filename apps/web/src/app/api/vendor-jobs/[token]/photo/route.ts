import { NextResponse } from "next/server";
import { apiError, apiInternalError } from "../../../../../lib/api/http";
import { uploadVendorJobPhoto } from "../../../../../lib/vendor-jobs/server";

const MAX_BYTES = 8 * 1024 * 1024;

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    if (!token || token.length < 16) {
      return apiError(404, "NOT_FOUND", "Job link not found");
    }

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return apiError(400, "INVALID_PAYLOAD", "Photo file is required");
    }
    if (file.size <= 0 || file.size > MAX_BYTES) {
      return apiError(400, "INVALID_PAYLOAD", "Photo must be under 8MB");
    }
    if (!file.type.startsWith("image/")) {
      return apiError(400, "INVALID_PAYLOAD", "Only image uploads are supported");
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const path = await uploadVendorJobPhoto(token, {
      bytes,
      contentType: file.type || "image/jpeg",
      fileName: file.name || "photo.jpg"
    });

    return NextResponse.json({ path });
  } catch (error) {
    const status = typeof (error as { status?: number }).status === "number" ? (error as { status: number }).status : 500;
    const message = error instanceof Error ? error.message : "Unable to upload photo";
    if (status === 404 || status === 410) {
      return apiError(status, "UPLOAD_FAILED", message);
    }
    return apiInternalError();
  }
}
