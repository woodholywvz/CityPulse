import { AdminHeatmapScreen } from "@/features/admin-console/components/admin-heatmap-screen";

export default async function AdminHeatmapPage({
  params,
}: Readonly<{
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  return <AdminHeatmapScreen locale={locale} />;
}
