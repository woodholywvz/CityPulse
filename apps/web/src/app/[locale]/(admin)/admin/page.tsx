import { AdminDashboardScreen } from "@/features/admin-console/components/admin-dashboard-screen";

export default async function AdminDashboardPage({
  params,
}: Readonly<{
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  return <AdminDashboardScreen locale={locale} />;
}
