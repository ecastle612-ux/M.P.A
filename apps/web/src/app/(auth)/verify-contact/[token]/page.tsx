import { VerifyContactCard } from "../../../../components/auth/verify-contact-card";

export default async function VerifyContactPage({
  params
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4 py-10">
      <VerifyContactCard token={token} />
    </main>
  );
}
