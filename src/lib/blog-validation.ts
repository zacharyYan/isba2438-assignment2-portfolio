export type BlogFieldErrorKey =
  | "titleEmpty"
  | "slugEmpty"
  | "slugFormat"
  | "bodyEmpty";

export type BlogFieldErrors = {
  title?: BlogFieldErrorKey;
  slug?: BlogFieldErrorKey;
  body?: BlogFieldErrorKey;
};

export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function validateBlogFields(input: {
  title: string;
  slug: string;
  body: string;
}): BlogFieldErrors {
  const errors: BlogFieldErrors = {};

  if (input.title.trim().length === 0) {
    errors.title = "titleEmpty";
  }

  if (input.slug.trim().length === 0) {
    errors.slug = "slugEmpty";
  } else if (!SLUG_PATTERN.test(input.slug.trim())) {
    errors.slug = "slugFormat";
  }

  if (input.body.trim().length === 0) {
    errors.body = "bodyEmpty";
  }

  return errors;
}
