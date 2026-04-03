import { PublicIssueMapScreen } from "@/features/issues/components/public-issue-map-screen";

type PublicIssueMapPageProps = Readonly<{
  params: Promise<{ locale: string }>;
}>;

export default async function PublicIssueMapPage({ params }: PublicIssueMapPageProps) {
  const { locale } = await params;

  return (
    <main className="container py-10">
      <PublicIssueMapScreen locale={locale} />
    </main>
  );
}
