import { CommandCenterPage } from "../../../components/admin/command-center-page";
import { loadCommandCenterSnapshot } from "../../../lib/admin/load-command-center";

export default async function Page() {
  const snapshot = await loadCommandCenterSnapshot();
  return <CommandCenterPage snapshot={snapshot} />;
}
