import { CitizenShell } from "@/components/layout/citizen-shell";

export default async function UserLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  return <CitizenShell locale={locale}>{children}</CitizenShell>;
}
