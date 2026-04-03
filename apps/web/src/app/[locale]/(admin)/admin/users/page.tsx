import { AdminUsersScreen } from "@/features/admin-console/components/admin-users-screen";

export default async function AdminUsersPage({
  params,
}: Readonly<{
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  return <AdminUsersScreen locale={locale} />;
}
