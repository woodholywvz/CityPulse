import { LocalizedPageLoading } from "@/components/ui/localized-page-loading";

export default function PublicIssuesLoading() {
  return (
    <main className="container py-10">
      <LocalizedPageLoading kind="issues" />
    </main>
  );
}
