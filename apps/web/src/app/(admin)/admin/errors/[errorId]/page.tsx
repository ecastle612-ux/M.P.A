import { PlatformErrorDetailPage } from "../../../../../components/admin/platform-errors-page";
import { loadPlatformErrorDetail } from "../../../../../lib/admin/load-platform-errors";

export default async function Page({
  params
}: {
  params: Promise<{ errorId: string }> | { errorId: string };
}) {
  const { errorId } = await Promise.resolve(params);
  const result = await loadPlatformErrorDetail(errorId);
  const props: {
    error: typeof result.error;
    degraded: boolean;
    detail?: string;
  } = {
    error: result.error,
    degraded: result.degraded
  };
  if (result.detail) props.detail = result.detail;
  return <PlatformErrorDetailPage {...props} />;
}
