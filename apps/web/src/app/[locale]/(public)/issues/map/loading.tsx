import { PageLoading } from "@/components/ui/page-loading";
import { appCopy } from "@/content/copy";

export default function PublicIssueMapLoading() {
  return (
    <main className="container py-10">
      <PageLoading title={appCopy.issueViews.loadingTitle} />
    </main>
  );
}
