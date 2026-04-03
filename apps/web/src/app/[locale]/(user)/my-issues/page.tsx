import { MyIssuesScreen } from "@/features/my-issues/components/my-issues-screen";

type MyIssuesPageProps = Readonly<{
  params: Promise<{ locale: string }>;
}>;

export default async function MyIssuesPage({ params }: MyIssuesPageProps) {
  const { locale } = await params;

  return <MyIssuesScreen locale={locale} />;
}
