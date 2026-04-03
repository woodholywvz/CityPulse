import { AuthScreen } from "@/features/auth/components/auth-screen";

type AuthPageProps = Readonly<{
  params: Promise<{ locale: string }>;
}>;

export default async function AuthPage({ params }: AuthPageProps) {
  const { locale } = await params;

  return (
    <main className="container py-10">
      <AuthScreen locale={locale} />
    </main>
  );
}
