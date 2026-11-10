export type ContactFieldErrorKey =
  | "nameEmpty"
  | "emailWhitespace"
  | "emailSingleAt"
  | "emailLocalEmpty"
  | "emailDomainDot"
  | "emailDomainSegment"
  | "messageEmpty";

export type ContactFieldErrors = {
  name?: ContactFieldErrorKey;
  email?: ContactFieldErrorKey;
  message?: ContactFieldErrorKey;
};

export function validateContactFields(input: {
  name: string;
  email: string;
  message: string;
}): ContactFieldErrors {
  const errors: ContactFieldErrors = {};

  if (input.name.trim().length === 0) {
    errors.name = "nameEmpty";
  }

  const emailError = validateEmail(input.email);
  if (emailError) {
    errors.email = emailError;
  }

  if (input.message.trim().length === 0) {
    errors.message = "messageEmpty";
  }

  return errors;
}

function validateEmail(email: string): ContactFieldErrorKey | undefined {
  if (/\s/.test(email)) {
    return "emailWhitespace";
  }
  const parts = email.split("@");
  if (parts.length !== 2) {
    return "emailSingleAt";
  }
  const [local, domain] = parts;
  if (local.length === 0) {
    return "emailLocalEmpty";
  }
  if (!domain.includes(".")) {
    return "emailDomainDot";
  }
  if (domain.split(".").some((segment) => segment.length === 0)) {
    return "emailDomainSegment";
  }
  return undefined;
}
