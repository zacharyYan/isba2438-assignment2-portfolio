"use client";

import { useActionState } from "react";
import { submitContactForm } from "./actions";
import { initialContactFormState } from "./form-state";
import type { Dictionary } from "@/lib/i18n";

const inputClassName =
  "w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:text-zinc-50 dark:focus:border-zinc-400";

export default function ContactForm({ dict }: { dict: Dictionary }) {
  const [state, formAction, pending] = useActionState(
    submitContactForm,
    initialContactFormState,
  );

  return (
    <form action={formAction} noValidate className="flex flex-col gap-5">
      {state.status === "success" && (
        <p
          role="status"
          aria-live="polite"
          className="rounded-md border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-300"
        >
          {dict.contact.success}
        </p>
      )}
      {state.status === "save-error" && (
        <p
          role="alert"
          aria-live="assertive"
          className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
        >
          {dict.contact.saveError}
        </p>
      )}
      {state.status === "validation-error" && (
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
          htmlFor="name"
          className="text-sm font-medium text-zinc-900 dark:text-zinc-50"
        >
          {dict.contact.formName}
        </label>
        <input
          id="name"
          name="name"
          type="text"
          defaultValue={state.values.name}
          aria-invalid={Boolean(state.errors.name)}
          aria-describedby={state.errors.name ? "name-error" : undefined}
          className={inputClassName}
        />
        {state.errors.name && (
          <p id="name-error" className="text-sm text-red-600 dark:text-red-400">
            {dict.errors[state.errors.name]}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="email"
          className="text-sm font-medium text-zinc-900 dark:text-zinc-50"
        >
          {dict.contact.formEmail}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          defaultValue={state.values.email}
          aria-invalid={Boolean(state.errors.email)}
          aria-describedby={state.errors.email ? "email-error" : undefined}
          className={inputClassName}
        />
        {state.errors.email && (
          <p
            id="email-error"
            className="text-sm text-red-600 dark:text-red-400"
          >
            {dict.errors[state.errors.email]}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="message"
          className="text-sm font-medium text-zinc-900 dark:text-zinc-50"
        >
          {dict.contact.formMessage}
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          defaultValue={state.values.message}
          aria-invalid={Boolean(state.errors.message)}
          aria-describedby={state.errors.message ? "message-error" : undefined}
          className={inputClassName}
        />
        {state.errors.message && (
          <p
            id="message-error"
            className="text-sm text-red-600 dark:text-red-400"
          >
            {dict.errors[state.errors.message]}
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
