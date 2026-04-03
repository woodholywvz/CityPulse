import type { AppMessages } from "@/messages/en";
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

type AdminCommonCopy = AppMessages["adminConsole"]["common"];

export function formatPercent(value: number) {
  return `${(value * 100).toFixed(0)}%`;
}

export function formatSignedNumber(value: number) {
  if (value > 0) {
    return `+${value.toFixed(1)}`;
  }
  return value.toFixed(1);
}

export function formatAbuseRiskLabel(level: AbuseRiskLevel, copy: AdminCommonCopy) {
  if (level === "high") {
    return copy.high;
  }
  if (level === "medium") {
    return copy.medium;
  }
  return copy.low;
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

export function formatSeverity(level: IntegrityEventSeverity, copy: AdminCommonCopy) {
  if (level === "high") {
    return copy.high;
  }
  if (level === "medium") {
    return copy.medium;
  }
  return copy.low;
}

export function formatMetricValue(value: unknown, copy: AdminCommonCopy) {
  if (typeof value === "number") {
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
  }
  if (typeof value === "boolean") {
    return value ? copy.yes : copy.no;
  }
  if (typeof value === "string") {
    return value;
  }
  if (Array.isArray(value)) {
    return value.length ? value.join(", ") : copy.noData;
  }
  return copy.noData;
}

export function formatDistributionValue(item: AdminDistributionItem) {
  if (typeof item.numeric_value === "number") {
    return item.numeric_value.toFixed(1);
  }
  return formatCompactNumber(item.count);
}

export function getIntegritySummary(
  identity: UserIntegrityCompact | null,
  copy: AdminCommonCopy,
) {
  if (!identity) {
    return copy.noData;
  }
  return `${identity.user.full_name} ${copy.details} ${identity.trust_score.toFixed(1)} ${copy.signal}`;
}
