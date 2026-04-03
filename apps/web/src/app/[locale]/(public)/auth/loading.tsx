import { LocalizedPageLoading } from "@/components/ui/localized-page-loading";

export default function AuthLoading() {
  return (
    <main className="container py-10">
      <LocalizedPageLoading kind="auth" />
    </main>
  );
}
