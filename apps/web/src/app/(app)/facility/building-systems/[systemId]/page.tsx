import { SystemCommandCenter } from "../../../../../components/facility/system-command-center";

type Params = { params: Promise<{ systemId: string }> };

export default async function Page({ params }: Params) {
  const { systemId } = await params;
  return <SystemCommandCenter systemId={systemId} />;
}
