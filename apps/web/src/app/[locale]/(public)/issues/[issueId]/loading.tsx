import { LocalizedPageLoading } from "@/components/ui/localized-page-loading";

export default function PublicIssueDetailLoading() {
  return (
    <main className="container py-10">
      <LocalizedPageLoading kind="issue-detail" />
    </main>
  );
}
