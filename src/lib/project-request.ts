import {
  validateProjectFields,
  validateProjectInput,
} from "./project-validation";
import type { ProjectFieldErrors } from "./project-validation";

export type ProjectRequestValues = {
  slug: string;
  title: unknown;
  summary: unknown;
  description: unknown;
  role: unknown;
  techStack: unknown;
  year: unknown;
  links: unknown;
  featured: unknown;
};

export type ProjectRequestParseResult =
  | { ok: true; values: ProjectRequestValues }
  | {
      ok: false;
      reason: "not-object" | "invalid-shape" | "unexpected-field";
    }
  | { ok: false; reason: "invalid-fields"; errors: ProjectFieldErrors };

const createAllowedFields = new Set([
  "slug",
  "title",
  "summary",
  "description",
  "role",
  "techStack",
  "year",
  "links",
  "featured",
]);

const updateAllowedFields = new Set([
  "title",
  "summary",
  "description",
  "role",
  "techStack",
  "year",
  "links",
  "featured",
]);

function checkKeys(record: Record<string, unknown>, allowed: Set<string>) {
  for (const key of Object.keys(record)) {
    if (!allowed.has(key)) {
      return false;
    }
  }
  return true;
}

export function parseProjectCreateRequest(
  raw: unknown,
): ProjectRequestParseResult {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return { ok: false, reason: "not-object" };
  }
  const record = raw as Record<string, unknown>;
  if (!checkKeys(record, createAllowedFields)) {
    return { ok: false, reason: "unexpected-field" };
  }
  if (typeof record.slug !== "string") {
    return { ok: false, reason: "invalid-shape" };
  }
  const values: ProjectRequestValues = {
    slug: record.slug,
    title: record.title,
    summary: record.summary,
    description: record.description,
    role: record.role,
    techStack: record.techStack,
    year: record.year,
    links: record.links,
    featured: record.featured,
  };
  const errors = validateProjectInput(values);
  if (Object.keys(errors).length > 0) {
    return { ok: false, reason: "invalid-fields", errors };
  }
  return { ok: true, values };
}

export function parseProjectUpdateRequest(
  raw: unknown,
): ProjectRequestParseResult {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return { ok: false, reason: "not-object" };
  }
  const record = raw as Record<string, unknown>;
  if (!checkKeys(record, updateAllowedFields)) {
    return { ok: false, reason: "unexpected-field" };
  }
  const values: ProjectRequestValues = {
    slug: "",
    title: record.title,
    summary: record.summary,
    description: record.description,
    role: record.role,
    techStack: record.techStack,
    year: record.year,
    links: record.links,
    featured: record.featured,
  };
  // Update validation covers the editable fields only; the slug in the path
  // is fixed and never re-validated here.
  const errors = validateProjectFields(values);
  if (Object.keys(errors).length > 0) {
    return { ok: false, reason: "invalid-fields", errors };
  }
  return { ok: true, values };
}
