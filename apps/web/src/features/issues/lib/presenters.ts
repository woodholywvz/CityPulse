import type { Issue, IssueStatus, PublicIssueDetail, PublicIssueSummary } from "@/lib/api/types";

export const DEFAULT_MAP_CENTER = {
  latitude: 39.8283,
  longitude: -98.5795,
};

export function formatIssueDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en", {
    notation: value > 999 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatCoordinates(latitude: number, longitude: number) {
  return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
}

export function formatIssueStatus(status: IssueStatus) {
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getIssueLocationSnippet(
  issue: Pick<
    PublicIssueSummary | PublicIssueDetail | Issue,
    "location_snippet" | "latitude" | "longitude"
  >,
) {
  return issue.location_snippet || formatCoordinates(issue.latitude, issue.longitude);
}

export function getIssueSignalLabel(
  issue: Pick<PublicIssueSummary | PublicIssueDetail, "support_count" | "importance_label">,
) {
  return issue.importance_label ?? "Public signal building";
}
