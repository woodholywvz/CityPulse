import { AdminUserProfileScreen } from "@/features/admin-console/components/admin-user-profile-screen";

export default async function AdminUserIntegrityPage({
  params,
}: Readonly<{
  params: Promise<{ locale: string; userId: string }>;
}>) {
  const { locale, userId } = await params;

  return <AdminUserProfileScreen locale={locale} userId={userId} />;
}
