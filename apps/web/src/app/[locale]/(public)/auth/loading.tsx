import { PageLoading } from "@/components/ui/page-loading";
import { appCopy } from "@/content/copy";

export default function AuthLoading() {
  return (
    <main className="container py-10">
      <PageLoading title={appCopy.auth.title} />
    </main>
  );
}
