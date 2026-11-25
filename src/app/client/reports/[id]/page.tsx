import { ClientReport } from "@/front/features/client/ClientReport";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ClientReport id={id} />;
}
