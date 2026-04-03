import { PageLoading } from "@/components/ui/page-loading";
import { appCopy } from "@/content/copy";

export default function DiscoverLoading() {
  return <PageLoading title={appCopy.discover.title} />;
}
