import { AdminShell } from "@/components/layout/admin-shell";

export default async function AdminLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  return <AdminShell locale={locale}>{children}</AdminShell>;
}
