import { Ma1OverviewPage } from "../../../components/admin/ma1-overview-page";
import { loadMa1OverviewSnapshot } from "../../../lib/admin/load-ma1-overview";

export default async function Page() {
  const snapshot = await loadMa1OverviewSnapshot();
  return <Ma1OverviewPage snapshot={snapshot} />;
}
