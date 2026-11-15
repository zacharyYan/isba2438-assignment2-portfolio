"use client";

import { useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import type { ContactFieldErrorKey } from "@/lib/contact-validation";

const inputClassName =
  "w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:text-zinc-50 dark:focus:border-zinc-400";

type FieldName = "name" | "email" | "message";

type FieldErrors = Partial<Record<FieldName, ContactFieldErrorKey>>;

type SubmitStatus =
  | { kind: "idle" }
  | { kind: "pending" }
  | { kind: "success" }
  | { kind: "validation-error"; errors: FieldErrors }
  | { kind: "invalid-request" }
  | { kind: "save-error" }
  | { kind: "network-error" };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFieldErrors(value: unknown): value is FieldErrors {
  if (typeof value !== "object" || value === null) return false;
  const known: ContactFieldErrorKey[] = [
    "nameEmpty",
    "emailWhitespace",
    "emailSingleAt",
    "emailLocalEmpty",
    "emailDomainDot",
    "emailDomainSegment",
    "messageEmpty",
  ];
  return Object.values(value as Record<string, unknown>).every(
    (key) => typeof key === "string" && known.includes(key as ContactFieldErrorKey),
  );
}

export default function ContactApiForm({ dict }: { dict: Dictionary }) {
  const [values, setValues] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<SubmitStatus>({ kind: "idle" });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus({ kind: "pending" });

    let response: Response;
    try {
      response = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      });
    } catch {
      setStatus({ kind: "network-error" });
      return;
    }

    let data: unknown = null;
    try {
      data = await response.json();
    } catch {
      setStatus({ kind: "network-error" });
      return;
    }

    if (response.status === 201 && isRecord(data) && data.status === "success") {
      setValues({ name: "", email: "", message: "" });
      setStatus({ kind: "success" });
      return;
    }
    if (
      response.status === 400 &&
      isRecord(data) &&
      data.status === "validation-error" &&
      isFieldErrors(data.errors)
    ) {
      setStatus({ kind: "validation-error", errors: data.errors });
      return;
    }
    if (response.status === 500 && isRecord(data) && data.status === "save-error") {
      setStatus({ kind: "save-error" });
      return;
    }
    if (response.status === 400) {
      setStatus({ kind: "invalid-request" });
      return;
    }
    setStatus({ kind: "network-error" });
  }

  const fieldErrors =
    status.kind === "validation-error" ? status.errors : {};
  const pending = status.kind === "pending";

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {status.kind === "success" && (
        <p
          role="status"
          aria-live="polite"
          className="rounded-md border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-300"
        >
          {dict.contact.success}
        </p>
      )}
      {status.kind === "save-error" && (
        <p
          role="alert"
          aria-live="assertive"
          className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
        >
          {dict.contact.saveError}
        </p>
      )}
      {status.kind === "network-error" && (
        <p
          role="alert"
          aria-live="assertive"
          className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
        >
          {dict.contact.networkError}
        </p>
      )}
      {status.kind === "invalid-request" && (
        <p
          role="alert"
          aria-live="assertive"
          className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
        >
          {dict.contact.invalidRequest}
        </p>
      )}
      {status.kind === "validation-error" && (
        <p
          role="alert"
          aria-live="assertive"
          className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
        >
          {dict.contact.validationError}
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="api-contact-name"
          className="text-sm font-medium text-zinc-900 dark:text-zinc-50"
        >
          {dict.contact.formName}
        </label>
        <input
          id="api-contact-name"
          name="name"
          type="text"
          value={values.name}
          disabled={pending}
          onChange={(event) =>
            setValues((prev) => ({ ...prev, name: event.target.value }))
          }
          aria-invalid={Boolean(fieldErrors.name)}
          aria-describedby={fieldErrors.name ? "api-contact-name-error" : undefined}
          className={inputClassName}
        />
        {fieldErrors.name && (
          <p
            id="api-contact-name-error"
            className="text-sm text-red-600 dark:text-red-400"
          >
            {dict.errors[fieldErrors.name]}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="api-contact-email"
          className="text-sm font-medium text-zinc-900 dark:text-zinc-50"
        >
          {dict.contact.formEmail}
        </label>
        <input
          id="api-contact-email"
          name="email"
          type="email"
          value={values.email}
          disabled={pending}
          onChange={(event) =>
            setValues((prev) => ({ ...prev, email: event.target.value }))
          }
          aria-invalid={Boolean(fieldErrors.email)}
          aria-describedby={fieldErrors.email ? "api-contact-email-error" : undefined}
          className={inputClassName}
        />
        {fieldErrors.email && (
          <p
            id="api-contact-email-error"
            className="text-sm text-red-600 dark:text-red-400"
          >
            {dict.errors[fieldErrors.email]}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="api-contact-message"
          className="text-sm font-medium text-zinc-900 dark:text-zinc-50"
        >
          {dict.contact.formMessage}
        </label>
        <textarea
          id="api-contact-message"
          name="message"
          rows={5}
          value={values.message}
          disabled={pending}
          onChange={(event) =>
            setValues((prev) => ({ ...prev, message: event.target.value }))
          }
          aria-invalid={Boolean(fieldErrors.message)}
          aria-describedby={fieldErrors.message ? "api-contact-message-error" : undefined}
          className={inputClassName}
        />
        {fieldErrors.message && (
          <p
            id="api-contact-message-error"
            className="text-sm text-red-600 dark:text-red-400"
          >
            {dict.errors[fieldErrors.message]}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="flex h-11 w-fit items-center rounded-full bg-zinc-900 px-5 text-sm font-medium text-zinc-50 transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {pending ? dict.contact.submitting : dict.contact.submit}
      </button>
    </form>
  );
}
