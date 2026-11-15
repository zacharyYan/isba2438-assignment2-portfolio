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
