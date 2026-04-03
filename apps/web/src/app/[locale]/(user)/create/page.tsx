import { CreateIssueScreen } from "@/features/create-issue/components/create-issue-screen";

type CreateIssuePageProps = Readonly<{
  params: Promise<{ locale: string }>;
}>;

export default async function CreateIssuePage({ params }: CreateIssuePageProps) {
  const { locale } = await params;

  return <CreateIssueScreen locale={locale} />;
}
