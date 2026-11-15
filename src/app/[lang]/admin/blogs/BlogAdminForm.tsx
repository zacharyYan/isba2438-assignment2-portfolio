"use client";

import { useState } from "react";
import Link from "next/link";
import type { Dictionary, Locale } from "@/lib/i18n";
import type { BlogFieldErrorKey } from "@/lib/blog-validation";

const inputClassName =
  "w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-50 dark:focus:border-zinc-400";

type FieldName = "title" | "slug" | "body";

type FieldErrors = Partial<Record<FieldName, BlogFieldErrorKey>>;

type SubmitStatus =
  | { kind: "idle" }
  | { kind: "pending" }
  | { kind: "success"; slug: string }
  | { kind: "validation-error"; errors: FieldErrors }
  | { kind: "invalid-request" }
  | { kind: "duplicate-slug" }
  | { kind: "save-error" }
  | { kind: "network-error" };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFieldErrors(value: unknown): value is FieldErrors {
  if (typeof value !== "object" || value === null) return false;
  const known: BlogFieldErrorKey[] = [
    "titleEmpty",
    "slugEmpty",
    "slugFormat",
    "bodyEmpty",
  ];
  return Object.values(value as Record<string, unknown>).every(
    (key) => typeof key === "string" && known.includes(key as BlogFieldErrorKey),
  );
}

export default function BlogAdminForm({
  dict,
  lang,
}: {
  dict: Dictionary;
  lang: Locale;
}) {
  const [values, setValues] = useState({
    title: "",
    slug: "",
    summary: "",
    body: "",
  });
  const [status, setStatus] = useState<SubmitStatus>({ kind: "idle" });

  const pending = status.kind === "pending";

  function update(field: keyof typeof values) {
    return (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setValues((prev) => ({ ...prev, [field]: event.target.value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus({ kind: "pending" });

    let response: Response;
    try {
      response = await fetch("/api/blogs", {
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

    if (
      response.status === 201 &&
      isRecord(data) &&
      data.status === "success" &&
      isRecord(data.post) &&
      typeof data.post.slug === "string"
    ) {
      setValues({ title: "", slug: "", summary: "", body: "" });
      setStatus({ kind: "success", slug: data.post.slug });
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
    if (response.status === 409 && isRecord(data) && data.status === "duplicate-slug") {
      setStatus({ kind: "duplicate-slug" });
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

  const fieldErrors = status.kind === "validation-error" ? status.errors : {};

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {status.kind === "success" && (
        <p
          role="status"
          aria-live="polite"
          className="flex flex-col gap-1 rounded-md border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-300"
        >
          <span>{dict.blog.success}</span>
          <Link
            href={`/${lang}/blogs/${status.slug}`}
            className="underline underline-offset-4"
          >
            {dict.blog.viewPost}
          </Link>
        </p>
      )}
      {status.kind === "save-error" && (
        <Banner text={dict.blog.saveError} />
      )}
      {status.kind === "network-error" && (
        <Banner text={dict.blog.networkError} />
      )}
      {status.kind === "invalid-request" && (
        <Banner text={dict.blog.invalidRequest} />
      )}
      {status.kind === "duplicate-slug" && (
        <Banner text={dict.blog.duplicateSlug} />
      )}
      {status.kind === "validation-error" && (
        <Banner text={dict.blog.validationError} />
      )}

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="blog-title"
          className="text-sm font-medium text-zinc-900 dark:text-zinc-50"
        >
          {dict.blog.formTitle}
        </label>
        <input
          id="blog-title"
          name="title"
          type="text"
          value={values.title}
          disabled={pending}
          onChange={update("title")}
          aria-invalid={Boolean(fieldErrors.title)}
          aria-describedby={fieldErrors.title ? "blog-title-error" : undefined}
          className={inputClassName}
        />
        {fieldErrors.title && (
          <p id="blog-title-error" className="text-sm text-red-600 dark:text-red-400">
            {dict.errors[fieldErrors.title]}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="blog-slug"
          className="text-sm font-medium text-zinc-900 dark:text-zinc-50"
        >
          {dict.blog.formSlug}
        </label>
        <input
          id="blog-slug"
          name="slug"
          type="text"
          value={values.slug}
          disabled={pending}
          onChange={update("slug")}
          aria-invalid={Boolean(fieldErrors.slug)}
          aria-describedby={fieldErrors.slug ? "blog-slug-error" : undefined}
          className={inputClassName}
        />
        {fieldErrors.slug && (
          <p id="blog-slug-error" className="text-sm text-red-600 dark:text-red-400">
            {dict.errors[fieldErrors.slug]}
          </p>
        )}
        {status.kind === "duplicate-slug" && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {dict.blog.duplicateSlug}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="blog-summary"
          className="text-sm font-medium text-zinc-900 dark:text-zinc-50"
        >
          {dict.blog.formSummary}
        </label>
        <input
          id="blog-summary"
          name="summary"
          type="text"
          value={values.summary}
          disabled={pending}
          onChange={update("summary")}
          className={inputClassName}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="blog-body"
          className="text-sm font-medium text-zinc-900 dark:text-zinc-50"
        >
          {dict.blog.formBody}
        </label>
        <textarea
          id="blog-body"
          name="body"
          rows={8}
          value={values.body}
          disabled={pending}
          onChange={update("body")}
          aria-invalid={Boolean(fieldErrors.body)}
          aria-describedby={fieldErrors.body ? "blog-body-error" : undefined}
          className={inputClassName}
        />
        {fieldErrors.body && (
          <p id="blog-body-error" className="text-sm text-red-600 dark:text-red-400">
            {dict.errors[fieldErrors.body]}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="flex h-11 w-fit items-center rounded-full bg-zinc-900 px-5 text-sm font-medium text-zinc-50 transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {pending ? dict.blog.submitting : dict.blog.submit}
      </button>
    </form>
  );
}

function Banner({ text }: { text: string }) {
  return (
    <p
      role="alert"
      aria-live="assertive"
      className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
    >
      {text}
    </p>
  );
}
