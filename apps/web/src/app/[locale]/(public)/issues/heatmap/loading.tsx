import { PageLoading } from "@/components/ui/page-loading";
import { appCopy } from "@/content/copy";

export default function PublicIssueHeatmapLoading() {
  return <PageLoading title={appCopy.issueViews.loadingTitle} />;
}
