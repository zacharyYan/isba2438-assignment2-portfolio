export type ResourceReadingStatus = "to-read" | "reading" | "completed";

export const resourceReadingStatuses: ResourceReadingStatus[] = [
  "to-read",
  "reading",
  "completed",
];

export type ResourceRecord = {
  id: string;
  title: string;
  url: string;
  category: string;
  notes: string;
  readingStatus: ResourceReadingStatus;
  createdAt: string;
};

export type ResourceFieldErrorKey =
  | "titleEmpty"
  | "urlEmpty"
  | "urlFormat"
  | "categoryEmpty"
  | "readingStatusInvalid";

export type ResourceFieldErrors = {
  title?: ResourceFieldErrorKey;
  url?: ResourceFieldErrorKey;
  category?: ResourceFieldErrorKey;
  readingStatus?: ResourceFieldErrorKey;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isResourceReadingStatus(
  value: unknown,
): value is ResourceReadingStatus {
  return (
    value === "to-read" || value === "reading" || value === "completed"
  );
}

export function isValidResourceUrl(value: string): boolean {
  if (/\s/.test(value)) return false;
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return false;
  }
  return parsed.protocol === "http:" || parsed.protocol === "https:";
}

export function validateResourceInput(input: {
  title: string;
  url: string;
  category: string;
  readingStatus: string;
}): ResourceFieldErrors {
  const errors: ResourceFieldErrors = {};

  if (input.title.trim().length === 0) {
    errors.title = "titleEmpty";
  }
  if (input.url.trim().length === 0) {
    errors.url = "urlEmpty";
  } else if (!isValidResourceUrl(input.url.trim())) {
    errors.url = "urlFormat";
  }
  if (input.category.trim().length === 0) {
    errors.category = "categoryEmpty";
  }
  if (!isResourceReadingStatus(input.readingStatus)) {
    errors.readingStatus = "readingStatusInvalid";
  }

  return errors;
}

export function isResourceRecord(value: unknown): value is ResourceRecord {
  if (!isRecord(value)) return false;
  const keys = Object.keys(value).sort();
  if (
    keys.length !== 7 ||
    keys.join(",") !==
      "category,createdAt,id,notes,readingStatus,title,url"
  ) {
    return false;
  }
  const { id, title, url, category, notes, readingStatus, createdAt } = value;
  return (
    typeof id === "string" &&
    id.length > 0 &&
    typeof title === "string" &&
    title.trim().length > 0 &&
    typeof url === "string" &&
    isValidResourceUrl(url) &&
    typeof category === "string" &&
    category.trim().length > 0 &&
    typeof notes === "string" &&
    isResourceReadingStatus(readingStatus) &&
    typeof createdAt === "string" &&
    createdAt.length > 0 &&
    !Number.isNaN(Date.parse(createdAt))
  );
}
