import { PublicIssueDetailScreen } from "@/features/issues/components/public-issue-detail-screen";

type PublicIssueDetailPageProps = Readonly<{
  params: Promise<{ locale: string; issueId: string }>;
}>;

export default async function PublicIssueDetailPage({
  params,
}: PublicIssueDetailPageProps) {
  const { locale, issueId } = await params;

  return (
    <main className="container py-10">
      <PublicIssueDetailScreen locale={locale} issueId={issueId} />
    </main>
  );
}
