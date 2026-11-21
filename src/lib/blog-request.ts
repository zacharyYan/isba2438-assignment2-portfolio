import { validateBlogFields } from "./blog-validation";
import type { BlogFieldErrors } from "./blog-validation";

export type BlogRequestValues = {
  title: string;
  slug: string;
  summary: string;
  body: string;
};

export type BlogRequestParseResult =
  | { ok: true; values: BlogRequestValues }
  | { ok: false; reason: "not-object" | "invalid-types" }
  | { ok: false; reason: "invalid-fields"; errors: BlogFieldErrors };

export function parseBlogRequest(raw: unknown): BlogRequestParseResult {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return { ok: false, reason: "not-object" };
  }
  const { title, slug, summary, body } = raw as Record<string, unknown>;
  if (
    typeof title !== "string" ||
    typeof slug !== "string" ||
    typeof body !== "string" ||
    (summary !== undefined && typeof summary !== "string")
  ) {
    return { ok: false, reason: "invalid-types" };
  }
  const values: BlogRequestValues = {
    title,
    slug,
    summary: typeof summary === "string" ? summary : "",
    body,
  };
  const errors = validateBlogFields(values);
  if (Object.keys(errors).length > 0) {
    return { ok: false, reason: "invalid-fields", errors };
  }
  return { ok: true, values };
}

export type BlogUpdateValues = {
  title: string;
  summary: string;
  body: string;
};

export type BlogUpdateParseResult =
  | { ok: true; values: BlogUpdateValues }
  | {
      ok: false;
      reason: "not-object" | "invalid-types" | "unexpected-field";
    }
  | { ok: false; reason: "invalid-fields"; errors: BlogFieldErrors };

const updateAllowedFields = new Set(["title", "summary", "body"]);

export function parseBlogUpdateRequest(raw: unknown): BlogUpdateParseResult {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return { ok: false, reason: "not-object" };
  }
  const record = raw as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    if (!updateAllowedFields.has(key)) {
      return { ok: false, reason: "unexpected-field" };
    }
  }
  const { title, summary, body } = record;
  if (
    typeof title !== "string" ||
    typeof body !== "string" ||
    (summary !== undefined && typeof summary !== "string")
  ) {
    return { ok: false, reason: "invalid-types" };
  }
  const values: BlogUpdateValues = {
    title,
    summary: typeof summary === "string" ? summary : "",
    body,
  };
  const errors = validateBlogFields({
    title: values.title,
    slug: "not-checked",
    body: values.body,
  });
  if (errors.title || errors.body) {
    return { ok: false, reason: "invalid-fields", errors };
  }
  return { ok: true, values };
}
