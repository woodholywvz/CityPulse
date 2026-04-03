import { AdminIssueDetailScreen } from "@/features/admin-console/components/admin-issue-detail-screen";

export default async function AdminIssueDetailPage({
  params,
}: Readonly<{
  params: Promise<{ locale: string; issueId: string }>;
}>) {
  const { locale, issueId } = await params;

  return <AdminIssueDetailScreen locale={locale} issueId={issueId} />;
}
