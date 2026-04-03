import { PageLoading } from "@/components/ui/page-loading";
import { appCopy } from "@/content/copy";

export default function MyIssuesLoading() {
  return <PageLoading title={appCopy.myIssues.title} />;
}
