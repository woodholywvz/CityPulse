import dynamic from "next/dynamic";

import type { PublicIssueMapMarker } from "@/lib/api/types";

type IssueMapProps = Readonly<{
  markers: PublicIssueMapMarker[];
  selectedIssueId?: string | null;
  userLocation?: { latitude: number; longitude: number } | null;
  heightClassName?: string;
  onSelectIssue?: (issueId: string) => void;
}>;

const DynamicIssueMapClient = dynamic(
  () =>
    import("@/features/issues/components/issue-map-client").then(
      (module) => module.IssueMapClient,
    ),
  {
    ssr: false,
  },
);

export function IssueMap(props: IssueMapProps) {
  return <DynamicIssueMapClient {...props} />;
}
