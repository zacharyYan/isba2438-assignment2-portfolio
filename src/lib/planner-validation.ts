export type PlannerItemStatus = "pending" | "completed";

export const plannerStatuses: PlannerItemStatus[] = [
  "pending",
  "completed",
];

export type PlannerItem = {
  id: string;
  topic: string;
  targetDate: string;
  notes: string;
  status: PlannerItemStatus;
};

export type PlannerFieldErrorKey = "topicEmpty" | "dateEmpty" | "dateInvalid";

export type PlannerFieldErrors = {
  topic?: PlannerFieldErrorKey;
  targetDate?: PlannerFieldErrorKey;
};

export const PLANNER_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isPlannerStatus(value: unknown): value is PlannerItemStatus {
  return value === "pending" || value === "completed";
}

export function isPlannerDate(value: string): boolean {
  if (!PLANNER_DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function validatePlannerInput(input: {
  topic: string;
  targetDate: string;
}): PlannerFieldErrors {
  const errors: PlannerFieldErrors = {};

  if (input.topic.trim().length === 0) {
    errors.topic = "topicEmpty";
  }

  const date = input.targetDate.trim();
  if (date.length === 0) {
    errors.targetDate = "dateEmpty";
  } else if (!isPlannerDate(date)) {
    errors.targetDate = "dateInvalid";
  }

  return errors;
}

export function isPlannerItem(value: unknown): value is PlannerItem {
  if (!isRecord(value)) return false;
  const keys = Object.keys(value).sort();
  if (keys.length !== 5 || keys.join(",") !== "id,notes,status,targetDate,topic") {
    return false;
  }
  const { id, topic, targetDate, notes, status } = value;
  return (
    typeof id === "string" &&
    id.length > 0 &&
    typeof topic === "string" &&
    topic.trim().length > 0 &&
    typeof targetDate === "string" &&
    isPlannerDate(targetDate) &&
    typeof notes === "string" &&
    isPlannerStatus(status)
  );
}
