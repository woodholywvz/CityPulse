import { PageLoading } from "@/components/ui/page-loading";
import { adminConsoleCopy } from "@/content/admin-console";

export default function AdminTicketsLoading() {
  return <PageLoading title={adminConsoleCopy.common.loading} />;
}
