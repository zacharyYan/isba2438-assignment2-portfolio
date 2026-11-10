import type { ContactFieldErrors } from "@/lib/contact-validation";

export type ContactFormStatus = "idle" | "success" | "validation-error" | "save-error";

export type ContactFormValues = {
  name: string;
  email: string;
  message: string;
};

export type ContactFormState = {
  status: ContactFormStatus;
  errors: ContactFieldErrors;
  values: ContactFormValues;
};

export const initialContactFormState: ContactFormState = {
  status: "idle",
  errors: {},
  values: { name: "", email: "", message: "" },
};
