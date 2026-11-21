import { SLUG_PATTERN } from "./blog-validation";
import type { Localized } from "./i18n";

export type ProjectLinkKind = "source" | "demo";

export type ProjectLink = {
  kind: ProjectLinkKind;
  url: string;
};

export type ProjectRecord = {
  slug: string;
  title: Localized;
  summary: Localized;
  description: Localized;
  role: Localized;
  techStack: string[];
  year?: string;
  links?: ProjectLink[];
  featured?: boolean;
};

export type ProjectFieldErrorKey =
  | "slugEmpty"
  | "slugFormat"
  | "titleZhEmpty"
  | "titleEnEmpty"
  | "summaryZhEmpty"
  | "summaryEnEmpty"
  | "descriptionZhEmpty"
  | "descriptionEnEmpty"
  | "roleZhEmpty"
  | "roleEnEmpty"
  | "techStackEmpty"
  | "yearInvalid"
  | "linkKindInvalid"
  | "linkUrlInvalid"
  | "featuredInvalid";

export type ProjectFieldErrors = {
  slug?: ProjectFieldErrorKey;
  title?: ProjectFieldErrorKey;
  summary?: ProjectFieldErrorKey;
  description?: ProjectFieldErrorKey;
  role?: ProjectFieldErrorKey;
  techStack?: ProjectFieldErrorKey;
  year?: ProjectFieldErrorKey;
  links?: ProjectFieldErrorKey;
  featured?: ProjectFieldErrorKey;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isLocalized(value: unknown): value is Localized {
  return (
    isRecord(value) &&
    typeof value.zh === "string" &&
    value.zh.trim().length > 0 &&
    typeof value.en === "string" &&
    value.en.trim().length > 0
  );
}

function isValidProjectUrl(value: string): boolean {
  if (/\s/.test(value)) return false;
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return false;
  }
  return parsed.protocol === "http:" || parsed.protocol === "https:";
}

export function isProjectLink(value: unknown): value is ProjectLink {
  return (
    isRecord(value) &&
    (value.kind === "source" || value.kind === "demo") &&
    typeof value.url === "string" &&
    isValidProjectUrl(value.url)
  );
}

function validateLocalizedField(
  value: unknown,
  zhKey: ProjectFieldErrorKey,
  enKey: ProjectFieldErrorKey,
  errors: ProjectFieldErrors,
  field: "title" | "summary" | "description" | "role",
) {
  if (!isRecord(value)) {
    errors[field] = zhKey;
    return;
  }
  if (typeof value.zh !== "string" || value.zh.trim().length === 0) {
    errors[field] = zhKey;
  } else if (typeof value.en !== "string" || value.en.trim().length === 0) {
    errors[field] = enKey;
  }
}

export function validateProjectFields(input: {
  title: unknown;
  summary: unknown;
  description: unknown;
  role: unknown;
  techStack: unknown;
  year: unknown;
  links: unknown;
  featured: unknown;
}): ProjectFieldErrors {
  const errors: ProjectFieldErrors = {};

  validateLocalizedField(input.title, "titleZhEmpty", "titleEnEmpty", errors, "title");
  validateLocalizedField(input.summary, "summaryZhEmpty", "summaryEnEmpty", errors, "summary");
  validateLocalizedField(input.description, "descriptionZhEmpty", "descriptionEnEmpty", errors, "description");
  validateLocalizedField(input.role, "roleZhEmpty", "roleEnEmpty", errors, "role");

  if (
    !Array.isArray(input.techStack) ||
    input.techStack.length === 0 ||
    !input.techStack.every(
      (tech) => typeof tech === "string" && tech.trim().length > 0,
    )
  ) {
    errors.techStack = "techStackEmpty";
  }

  if (input.year !== undefined && input.year !== null) {
    if (typeof input.year !== "string" || input.year.trim().length === 0) {
      errors.year = "yearInvalid";
    }
  }

  if (input.links !== undefined && input.links !== null) {
    if (!Array.isArray(input.links)) {
      errors.links = "linkKindInvalid";
    } else {
      for (const link of input.links) {
        if (!isRecord(link)) {
          errors.links = "linkKindInvalid";
          break;
        }
        if (link.kind !== "source" && link.kind !== "demo") {
          errors.links = "linkKindInvalid";
          break;
        }
        if (
          typeof link.url !== "string" ||
          !isValidProjectUrl(link.url)
        ) {
          errors.links = "linkUrlInvalid";
          break;
        }
      }
    }
  }

  if (
    input.featured !== undefined &&
    input.featured !== null &&
    typeof input.featured !== "boolean"
  ) {
    errors.featured = "featuredInvalid";
  }

  return errors;
}

export function validateProjectInput(input: {
  slug: string;
  title: unknown;
  summary: unknown;
  description: unknown;
  role: unknown;
  techStack: unknown;
  year: unknown;
  links: unknown;
  featured: unknown;
}): ProjectFieldErrors {
  const errors = validateProjectFields(input);

  const slug = typeof input.slug === "string" ? input.slug : "";
  if (slug.trim().length === 0) {
    errors.slug = "slugEmpty";
  } else if (!SLUG_PATTERN.test(slug.trim())) {
    errors.slug = "slugFormat";
  }

  return errors;
}

export function isProjectRecord(value: unknown): value is ProjectRecord {
  if (!isRecord(value)) return false;
  const keys = Object.keys(value).sort();
  const allowed = [
    "description",
    "featured",
    "links",
    "role",
    "slug",
    "summary",
    "techStack",
    "title",
    "year",
  ];
  if (!keys.every((key) => allowed.includes(key))) {
    return false;
  }
  const errors = validateProjectInput({
    slug: typeof value.slug === "string" ? value.slug : "",
    title: value.title,
    summary: value.summary,
    description: value.description,
    role: value.role,
    techStack: value.techStack,
    year: value.year,
    links: value.links,
    featured: value.featured,
  });
  return Object.keys(errors).length === 0;
}
