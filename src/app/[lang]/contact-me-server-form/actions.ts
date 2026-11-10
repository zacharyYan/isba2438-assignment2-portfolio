"use server";

import { appendContactMessage } from "@/lib/contact-store";
import { validateContactFields } from "@/lib/contact-validation";
import type { ContactFormState, ContactFormValues } from "./form-state";

export async function submitContactForm(
  _prevState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const values: ContactFormValues = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    message: String(formData.get("message") ?? ""),
  };

  const errors = validateContactFields(values);
  if (Object.keys(errors).length > 0) {
    return { status: "validation-error", errors, values };
  }

  try {
    await appendContactMessage({
      name: values.name.trim(),
      email: values.email,
      message: values.message.trim(),
    });
  } catch {
    return { status: "save-error", errors: {}, values };
  }

  return {
    status: "success",
    errors: {},
    values: { name: "", email: "", message: "" },
  };
}
