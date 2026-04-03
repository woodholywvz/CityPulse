import { AdminIssuesScreen } from "@/features/admin-console/components/admin-issues-screen";

export default async function AdminIssuesPage({
  params,
}: Readonly<{
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  return <AdminIssuesScreen locale={locale} />;
}
