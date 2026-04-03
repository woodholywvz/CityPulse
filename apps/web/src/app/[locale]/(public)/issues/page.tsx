import { PublicIssueListScreen } from "@/features/issues/components/public-issue-list-screen";

type PublicIssuesPageProps = Readonly<{
  params: Promise<{ locale: string }>;
}>;

export default async function PublicIssuesPage({ params }: PublicIssuesPageProps) {
  const { locale } = await params;

  return (
    <main className="container py-10">
      <PublicIssueListScreen locale={locale} />
    </main>
  );
}
