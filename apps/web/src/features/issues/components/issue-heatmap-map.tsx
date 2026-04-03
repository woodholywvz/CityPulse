import dynamic from "next/dynamic";

import type { AdminHeatPoint, PublicHeatPoint } from "@/lib/api/types";
import type { HeatPointLike } from "@/features/issues/components/issue-heatmap-map-client";

type IssueHeatmapMapProps = Readonly<{
  points: Array<AdminHeatPoint | PublicHeatPoint>;
  selectedAreaKey?: string | null;
  heightClassName?: string;
  issueCountLabel: string;
  secondaryLine?: (point: HeatPointLike) => string | null;
  onSelectPoint?: (areaKey: string) => void;
}>;

const DynamicIssueHeatmapMapClient = dynamic(
  () =>
    import("@/features/issues/components/issue-heatmap-map-client").then(
      (module) => module.IssueHeatmapMapClient,
    ),
  {
    ssr: false,
  },
);

export function IssueHeatmapMap(props: IssueHeatmapMapProps) {
  return <DynamicIssueHeatmapMapClient {...props} />;
}
