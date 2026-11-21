import { isPlannerItem, type PlannerItem } from "./planner-validation";

export const PLANNER_STORAGE_KEY = "portfolio.interview-planner.v1";
export const PLANNER_STORAGE_VERSION = 1;

export type PlannerLoadResult =
  | { kind: "loaded"; items: PlannerItem[] }
  | { kind: "empty" }
  | { kind: "corrupt"; reason: "parse" | "structure" | "item" | "duplicate" }
  | { kind: "unavailable" };

export type PlannerSaveResult =
  | { kind: "saved" }
  | { kind: "quota" }
  | { kind: "unavailable" };

function isQuotaError(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === "QuotaExceededError" ||
      error.name === "NS_ERROR_DOM_QUOTA_REACHED")
  );
}

function parsePlannerPayload(raw: string): PlannerLoadResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { kind: "corrupt", reason: "parse" };
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return { kind: "corrupt", reason: "structure" };
  }
  const record = parsed as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  if (keys.length !== 2 || keys[0] !== "items" || keys[1] !== "version") {
    return { kind: "corrupt", reason: "structure" };
  }
  if (record.version !== PLANNER_STORAGE_VERSION || !Array.isArray(record.items)) {
    return { kind: "corrupt", reason: "structure" };
  }
  const seenIds = new Set<string>();
  for (const item of record.items) {
    if (!isPlannerItem(item)) {
      return { kind: "corrupt", reason: "item" };
    }
    if (seenIds.has(item.id)) {
      return { kind: "corrupt", reason: "duplicate" };
    }
    seenIds.add(item.id);
  }
  return { kind: "loaded", items: record.items as PlannerItem[] };
}

export function readPlannerStorage(): PlannerLoadResult {
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(PLANNER_STORAGE_KEY);
  } catch {
    return { kind: "unavailable" };
  }
  if (raw === null || raw === "") {
    return { kind: "empty" };
  }
  return parsePlannerPayload(raw);
}

export function writePlannerStorage(items: PlannerItem[]): PlannerSaveResult {
  try {
    window.localStorage.setItem(
      PLANNER_STORAGE_KEY,
      JSON.stringify({ version: PLANNER_STORAGE_VERSION, items }),
    );
    return { kind: "saved" };
  } catch (error) {
    return { kind: isQuotaError(error) ? "quota" : "unavailable" };
  }
}
