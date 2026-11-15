import { validateContactFields } from "./contact-validation";
import type { ContactFieldErrors } from "./contact-validation";

export type ContactRequestValues = {
  name: string;
  email: string;
  message: string;
};

export type ContactRequestParseResult =
  | { ok: true; values: ContactRequestValues }
  | { ok: false; reason: "not-object" | "invalid-types" }
  | { ok: false; reason: "invalid-fields"; errors: ContactFieldErrors };

export function parseContactRequest(raw: unknown): ContactRequestParseResult {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return { ok: false, reason: "not-object" };
  }
  const { name, email, message } = raw as Record<string, unknown>;
  if (
    typeof name !== "string" ||
    typeof email !== "string" ||
    typeof message !== "string"
  ) {
    return { ok: false, reason: "invalid-types" };
  }
  const values: ContactRequestValues = { name, email, message };
  const errors = validateContactFields(values);
  if (Object.keys(errors).length > 0) {
    return { ok: false, reason: "invalid-fields", errors };
  }
  return { ok: true, values };
}
