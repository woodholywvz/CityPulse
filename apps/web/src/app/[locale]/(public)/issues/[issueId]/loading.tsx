import { PageLoading } from "@/components/ui/page-loading";
import { appCopy } from "@/content/copy";

export default function PublicIssueDetailLoading() {
  return (
    <main className="container py-10">
      <PageLoading title={appCopy.issueViews.detailMeta} />
    </main>
  );
}
