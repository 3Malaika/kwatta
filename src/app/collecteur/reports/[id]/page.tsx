import { Mission } from "@/front/features/collector/Mission";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <Mission id={id} />;
}
