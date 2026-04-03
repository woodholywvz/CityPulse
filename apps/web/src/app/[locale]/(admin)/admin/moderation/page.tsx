import { AdminModerationScreen } from "@/features/admin-moderation/components/admin-moderation-screen";

export default async function AdminModerationPage({
  params,
}: Readonly<{
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  return <AdminModerationScreen locale={locale} />;
}
