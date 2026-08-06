import { AdminWorkspacePage } from "../../../../../components/admin/master-admin-pages";

type PageProps = {
  params: Promise<{ moduleId: string }>;
};

export default async function Page({ params }: PageProps) {
  const { moduleId } = await params;
  return <AdminWorkspacePage moduleId={moduleId} />;
}
