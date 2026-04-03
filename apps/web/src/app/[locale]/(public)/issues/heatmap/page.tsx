import { PublicIssueHeatmapScreen } from "@/features/issues/components/public-issue-heatmap-screen";

type PublicIssueHeatmapPageProps = Readonly<{
  params: Promise<{ locale: string }>;
}>;

export default async function PublicIssueHeatmapPage({
  params,
}: PublicIssueHeatmapPageProps) {
  const { locale } = await params;

  return (
    <main className="container py-10">
      <PublicIssueHeatmapScreen locale={locale} />
    </main>
  );
}
