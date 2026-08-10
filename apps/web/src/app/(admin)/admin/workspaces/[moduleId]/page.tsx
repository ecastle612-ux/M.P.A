import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ moduleId: string }>;
};

/** Workspace mirrors removed from Owner Operations nav — send operators to Command Center. */
export default async function Page({ params }: PageProps) {
  await params;
  redirect("/admin");
}
