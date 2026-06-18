import { AdminSpaceView } from "@/components/views/admin-space-view";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminSpaceView page="pharmacy-medicaments" pharmacyId={id} />;
}
