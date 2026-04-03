import { AdminTicketDetailScreen } from "@/features/admin-console/components/admin-ticket-detail-screen";

export default async function AdminTicketDetailPage({
  params,
}: Readonly<{
  params: Promise<{ locale: string; ticketId: string }>;
}>) {
  const { locale, ticketId } = await params;

  return <AdminTicketDetailScreen locale={locale} ticketId={ticketId} />;
}
