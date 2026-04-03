import { DiscoverScreen } from "@/features/discover/components/discover-screen";

type DiscoverPageProps = Readonly<{
  params: Promise<{ locale: string }>;
}>;

export default async function DiscoverPage({ params }: DiscoverPageProps) {
  const { locale } = await params;

  return <DiscoverScreen locale={locale} />;
}
