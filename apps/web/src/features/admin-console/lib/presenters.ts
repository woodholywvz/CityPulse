import { adminConsoleCopy } from "@/content/admin-console";
import {
  formatCompactNumber,
  formatIssueDate,
  formatIssueStatus,
} from "@/features/issues/lib/presenters";
import type {
  AbuseRiskLevel,
  AdminDistributionItem,
  IntegrityEventSeverity,
  IssueStatus,
  ModerationState,
  UserIntegrityCompact,
} from "@/lib/api/types";

export { formatCompactNumber, formatIssueDate, formatIssueStatus };

export function formatPercent(value: number) {
  return `${(value * 100).toFixed(0)}%`;
}

export function formatSignedNumber(value: number) {
  if (value > 0) {
    return `+${value.toFixed(1)}`;
  }
  return value.toFixed(1);
}

export function formatAbuseRiskLabel(level: AbuseRiskLevel) {
  if (level === "high") {
    return adminConsoleCopy.common.high;
  }
  if (level === "medium") {
    return adminConsoleCopy.common.medium;
  }
  return adminConsoleCopy.common.low;
}

export function formatLifecycleLabel(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatModerationState(state: ModerationState) {
  return formatLifecycleLabel(state);
}

export function formatStatusTone(
  status: IssueStatus | ModerationState | AbuseRiskLevel | string,
): "subtle" | "primary" | "accent" {
  if (
    status === "rejected" ||
    status === "archived" ||
    status === "high" ||
    status === "under_review"
  ) {
    return "accent";
  }
  if (
    status === "published" ||
    status === "approved" ||
    status === "completed" ||
    status === "medium"
  ) {
    return "primary";
  }
  return "subtle";
}

export function formatSeverity(level: IntegrityEventSeverity) {
  if (level === "high") {
    return adminConsoleCopy.common.high;
  }
  if (level === "medium") {
    return adminConsoleCopy.common.medium;
  }
  return adminConsoleCopy.common.low;
}

export function formatMetricValue(value: unknown) {
  if (typeof value === "number") {
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
  }
  if (typeof value === "boolean") {
    return value ? adminConsoleCopy.common.yes : adminConsoleCopy.common.no;
  }
  if (typeof value === "string") {
    return value;
  }
  if (Array.isArray(value)) {
    return value.length ? value.join(", ") : adminConsoleCopy.common.noData;
  }
  return adminConsoleCopy.common.noData;
}

export function formatDistributionValue(item: AdminDistributionItem) {
  if (typeof item.numeric_value === "number") {
    return item.numeric_value.toFixed(1);
  }
  return formatCompactNumber(item.count);
}

export function getIntegritySummary(identity: UserIntegrityCompact | null) {
  if (!identity) {
    return adminConsoleCopy.common.noData;
  }
  return `${identity.user.full_name} · ${identity.trust_score.toFixed(1)} trust`;
}
