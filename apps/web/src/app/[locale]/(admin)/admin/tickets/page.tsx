import { AdminTicketsScreen } from "@/features/admin-console/components/admin-tickets-screen";

export default async function AdminTicketsPage({
  params,
}: Readonly<{
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  return <AdminTicketsScreen locale={locale} />;
}
