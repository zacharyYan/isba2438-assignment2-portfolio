import { validateResourceInput } from "./resource-validation";
import type { ResourceFieldErrors } from "./resource-validation";

export type ResourceRequestValues = {
  title: string;
  url: string;
  category: string;
  notes: string;
  readingStatus: string;
};

export type ResourceRequestParseResult =
  | { ok: true; values: ResourceRequestValues }
  | {
      ok: false;
      reason:
        | "not-object"
        | "invalid-types"
        | "unexpected-field";
    }
  | { ok: false; reason: "invalid-fields"; errors: ResourceFieldErrors };

const allowedFields = new Set([
  "title",
  "url",
  "category",
  "notes",
  "readingStatus",
]);

export function parseResourceRequest(raw: unknown): ResourceRequestParseResult {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return { ok: false, reason: "not-object" };
  }
  const record = raw as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    if (!allowedFields.has(key)) {
      return { ok: false, reason: "unexpected-field" };
    }
  }
  const { title, url, category, notes, readingStatus } = record;
  if (
    typeof title !== "string" ||
    typeof url !== "string" ||
    typeof category !== "string" ||
    typeof readingStatus !== "string" ||
    (notes !== undefined && typeof notes !== "string")
  ) {
    return { ok: false, reason: "invalid-types" };
  }
  const values: ResourceRequestValues = {
    title,
    url,
    category,
    notes: typeof notes === "string" ? notes : "",
    readingStatus,
  };
  const errors = validateResourceInput(values);
  if (Object.keys(errors).length > 0) {
    return { ok: false, reason: "invalid-fields", errors };
  }
  return { ok: true, values };
}
