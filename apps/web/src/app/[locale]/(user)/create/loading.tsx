import { PageLoading } from "@/components/ui/page-loading";
import { appCopy } from "@/content/copy";

export default function CreateIssueLoading() {
  return <PageLoading title={appCopy.create.title} />;
}
