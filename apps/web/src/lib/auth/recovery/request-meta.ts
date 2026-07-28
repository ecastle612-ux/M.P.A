export function readRequestMeta(request: Request): {
  ipAddress: string | null;
  device: string | null;
} {
  const forwarded = request.headers.get("x-forwarded-for");
  const ipAddress = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip");
  const device = request.headers.get("user-agent");
  return {
    ipAddress: ipAddress || null,
    device: device ? device.slice(0, 240) : null
  };
}
