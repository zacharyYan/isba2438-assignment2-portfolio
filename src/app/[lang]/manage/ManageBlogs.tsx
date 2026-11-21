"use client";

import { useCallback, useEffect, useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import type { BlogFieldErrorKey } from "@/lib/blog-validation";

type Post = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  body: string;
  createdAt: string;
};

type FieldErrors = Partial<Record<BlogFieldErrorKey | string, string>>;

type LoadState =
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "ready" };

type Feedback =
  | { kind: "idle" }
  | { kind: "added" }
  | { kind: "updated" }
  | { kind: "deleted" }
  | { kind: "stale" }
  | { kind: "save-error" }
  | { kind: "network-error" }
  | { kind: "invalid-request" }
  | { kind: "validation-error" };

const bannerErrorClassName =
  "rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300";
const bannerSuccessClassName =
  "rounded-md border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-300";
const inputClassName =
  "w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:text-zinc-50 dark:focus:border-zinc-400";
const smallButtonClassName =
  "rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:border-zinc-500 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-500 dark:hover:text-zinc-50";
const dangerButtonClassName =
  "rounded-full bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-red-900 dark:hover:bg-red-800";
const primarySmallClassName =
  "flex h-9 w-fit items-center rounded-full bg-zinc-900 px-4 text-xs font-medium text-zinc-50 transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPostList(value: unknown): value is Post[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        isRecord(item) &&
        typeof item.id === "string" &&
        typeof item.slug === "string" &&
        typeof item.title === "string" &&
        typeof item.summary === "string" &&
        typeof item.body === "string" &&
        typeof item.createdAt === "string",
    )
  );
}

const emptyForm = { title: "", slug: "", summary: "", body: "" };

export default function ManageBlogs({ dict }: { dict: Dictionary }) {
  const manage = dict.manage;
  const [loadState, setLoadState] = useState<LoadState>({ kind: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [posts, setPosts] = useState<Post[]>([]);
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>({ kind: "idle" });
  const [formErrors, setFormErrors] = useState<FieldErrors>({});
  const [newValues, setNewValues] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ title: "", summary: "", body: "" });
  const [draftErrors, setDraftErrors] = useState<FieldErrors>({});
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/blogs")
      .then(async (response) => {
        const data = await response.json().catch(() => null);
        if (!response.ok || !data || data.status !== "success") {
          throw new Error("list request failed");
        }
        return data;
      })
      .then((data: { posts: unknown }) => {
        if (cancelled) return;
        if (!isPostList(data.posts)) throw new Error("bad list shape");
        setPosts(data.posts);
        setLoadState({ kind: "ready" });
      })
      .catch(() => {
        if (!cancelled) setLoadState({ kind: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retryLoad = useCallback(() => {
    setLoadState({ kind: "loading" });
    setAttempt((n) => n + 1);
  }, []);

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setFeedback({ kind: "idle" });
    let response: Response;
    try {
      response = await fetch("/api/blogs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(newValues),
      });
    } catch {
      setFeedback({ kind: "network-error" });
      setPending(false);
      return;
    }
    const data = await response.json().catch(() => null);
    if (response.status === 201 && isRecord(data) && data.status === "success") {
      setNewValues(emptyForm);
      setFormErrors({});
      setFeedback({ kind: "added" });
      setPending(false);
      retryLoad();
      return;
    }
    if (response.status === 400 && isRecord(data)) {
      if (data.status === "validation-error") {
        setFormErrors((data.errors ?? {}) as FieldErrors);
        setFeedback({ kind: "validation-error" });
      } else {
        setFeedback({ kind: "invalid-request" });
      }
      setPending(false);
      return;
    }
    setFeedback({ kind: "save-error" });
    setPending(false);
  }

  function startEdit(post: Post) {
    setEditingId(post.id);
    setDraft({
      title: post.title,
      summary: post.summary,
      body: post.body,
    });
    setDraftErrors({});
    setConfirmingDeleteId(null);
    setFeedback({ kind: "idle" });
  }

  async function handleEditSave() {
    if (editingId === null) return;
    setPending(true);
    setFeedback({ kind: "idle" });
    let response: Response;
    try {
      response = await fetch(`/api/blogs/${encodeURIComponent(editingId)}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(draft),
      });
    } catch {
      setFeedback({ kind: "network-error" });
      setPending(false);
      return;
    }
    const data = await response.json().catch(() => null);
    if (response.status === 200 && isRecord(data) && data.status === "success") {
      setPosts((prev) =>
        prev.map((item) => (item.id === editingId ? (data.post as Post) : item)),
      );
      setEditingId(null);
      setDraftErrors({});
      setFeedback({ kind: "updated" });
      setPending(false);
      return;
    }
    if (response.status === 404) {
      setPosts((prev) => prev.filter((item) => item.id !== editingId));
      setEditingId(null);
      setFeedback({ kind: "stale" });
      setPending(false);
      return;
    }
    if (response.status === 400 && isRecord(data)) {
      if (data.status === "validation-error") {
        setDraftErrors((data.errors ?? {}) as FieldErrors);
        setFeedback({ kind: "validation-error" });
      } else {
        setFeedback({ kind: "invalid-request" });
      }
      setPending(false);
      return;
    }
    setFeedback({ kind: "save-error" });
    setPending(false);
  }

  async function handleDelete(id: string) {
    setConfirmingDeleteId(null);
    setPending(true);
    setFeedback({ kind: "idle" });
    let response: Response;
    try {
      response = await fetch(`/api/blogs/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
    } catch {
      setFeedback({ kind: "network-error" });
      setPending(false);
      return;
    }
    if (response.status === 200) {
      setPosts((prev) => prev.filter((item) => item.id !== id));
      setFeedback({ kind: "deleted" });
      setPending(false);
      return;
    }
    if (response.status === 404) {
      setPosts((prev) => prev.filter((item) => item.id !== id));
      setFeedback({ kind: "stale" });
      setPending(false);
      return;
    }
    setFeedback({ kind: "save-error" });
    setPending(false);
  }

  const errorText = (key: string | undefined) =>
    key ? (dict.manage.errors as Record<string, string>)[key] : undefined;

  if (loadState.kind === "loading") {
    return (
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {manage.blogsTitle}
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400">{manage.loading}</p>
      </section>
    );
  }
  if (loadState.kind === "error") {
    return (
      <section className="flex flex-col items-start gap-3">
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {manage.blogsTitle}
        </h2>
        <p role="alert" className={bannerErrorClassName}>
          {manage.listError}
        </p>
        <button type="button" onClick={retryLoad} className={smallButtonClassName}>
          {manage.retry}
        </button>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {manage.blogsTitle}
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {manage.count.replace("{n}", String(posts.length))}
        </p>
      </div>

      {feedback.kind === "added" && (
        <p role="status" aria-live="polite" className={bannerSuccessClassName}>
          {manage.added}
        </p>
      )}
      {feedback.kind === "updated" && (
        <p role="status" aria-live="polite" className={bannerSuccessClassName}>
          {manage.updated}
        </p>
      )}
      {feedback.kind === "deleted" && (
        <p role="status" aria-live="polite" className={bannerSuccessClassName}>
          {manage.deleted}
        </p>
      )}
      {feedback.kind === "stale" && (
        <p role="status" aria-live="polite" className={bannerSuccessClassName}>
          {manage.staleEntry}
        </p>
      )}
      {feedback.kind === "validation-error" && (
        <p role="alert" className={bannerErrorClassName}>
          {manage.validationError}
        </p>
      )}
      {feedback.kind === "invalid-request" && (
        <p role="alert" className={bannerErrorClassName}>
          {manage.invalidRequest}
        </p>
      )}
      {feedback.kind === "save-error" && (
        <p role="alert" className={bannerErrorClassName}>
          {manage.saveError}
        </p>
      )}
      {feedback.kind === "network-error" && (
        <p role="alert" className={bannerErrorClassName}>
          {manage.networkError}
        </p>
      )}

      <form
        onSubmit={handleCreate}
        noValidate
        className="flex flex-col gap-4 rounded-lg border border-zinc-200 p-5 dark:border-zinc-800"
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor="manage-blog-title" className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
            {manage.formBlogTitle}
          </label>
          <input
            id="manage-blog-title"
            type="text"
            value={newValues.title}
            disabled={pending}
            onChange={(event) => setNewValues((prev) => ({ ...prev, title: event.target.value }))}
            aria-invalid={Boolean(formErrors.title)}
            className={inputClassName}
          />
          {formErrors.title && (
            <p className="text-sm text-red-600 dark:text-red-400">{errorText(formErrors.title)}</p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="manage-blog-slug" className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
            {manage.formSlug}
          </label>
          <input
            id="manage-blog-slug"
            type="text"
            value={newValues.slug}
            disabled={pending}
            onChange={(event) => setNewValues((prev) => ({ ...prev, slug: event.target.value }))}
            aria-invalid={Boolean(formErrors.slug)}
            className={inputClassName}
          />
          {formErrors.slug && (
            <p className="text-sm text-red-600 dark:text-red-400">{errorText(formErrors.slug)}</p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="manage-blog-summary" className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
            {manage.formSummary}
          </label>
          <input
            id="manage-blog-summary"
            type="text"
            value={newValues.summary}
            disabled={pending}
            onChange={(event) => setNewValues((prev) => ({ ...prev, summary: event.target.value }))}
            className={inputClassName}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="manage-blog-body" className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
            {manage.formBody}
          </label>
          <textarea
            id="manage-blog-body"
            rows={5}
            value={newValues.body}
            disabled={pending}
            onChange={(event) => setNewValues((prev) => ({ ...prev, body: event.target.value }))}
            aria-invalid={Boolean(formErrors.body)}
            className={inputClassName}
          />
          {formErrors.body && (
            <p className="text-sm text-red-600 dark:text-red-400">{errorText(formErrors.body)}</p>
          )}
        </div>
        <button
          type="submit"
          disabled={pending}
          className="flex h-10 w-fit items-center rounded-full bg-zinc-900 px-5 text-sm font-medium text-zinc-50 transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {manage.create}
        </button>
      </form>

      {posts.length === 0 ? (
        <p className="text-zinc-600 dark:text-zinc-400">{manage.empty}</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {posts.map((post) =>
            editingId === post.id ? (
              <li
                key={post.id}
                className="flex flex-col gap-4 rounded-lg border border-zinc-900 p-5 dark:border-zinc-50"
              >
                <p className="text-xs text-zinc-500 dark:text-zinc-500">
                  {manage.slugFixed}: {post.slug}
                </p>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="manage-blog-edit-title" className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {manage.formBlogTitle}
                  </label>
                  <input
                    id="manage-blog-edit-title"
                    type="text"
                    value={draft.title}
                    disabled={pending}
                    onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))}
                    aria-invalid={Boolean(draftErrors.title)}
                    className={inputClassName}
                  />
                  {draftErrors.title && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errorText(draftErrors.title)}</p>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="manage-blog-edit-summary" className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {manage.formSummary}
                  </label>
                  <input
                    id="manage-blog-edit-summary"
                    type="text"
                    value={draft.summary}
                    disabled={pending}
                    onChange={(event) => setDraft((prev) => ({ ...prev, summary: event.target.value }))}
                    className={inputClassName}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="manage-blog-edit-body" className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {manage.formBody}
                  </label>
                  <textarea
                    id="manage-blog-edit-body"
                    rows={5}
                    value={draft.body}
                    disabled={pending}
                    onChange={(event) => setDraft((prev) => ({ ...prev, body: event.target.value }))}
                    aria-invalid={Boolean(draftErrors.body)}
                    className={inputClassName}
                  />
                  {draftErrors.body && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errorText(draftErrors.body)}</p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button type="button" onClick={handleEditSave} disabled={pending} className={primarySmallClassName}>
                    {manage.save}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    disabled={pending}
                    className={smallButtonClassName}
                  >
                    {manage.cancel}
                  </button>
                </div>
              </li>
            ) : (
              <li
                key={post.id}
                className={`flex flex-col gap-2 rounded-lg border border-zinc-200 p-5 dark:border-zinc-800 ${
                  pending ? "opacity-60" : ""
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                    {post.title}
                  </p>
                  <span className="text-xs text-zinc-500 dark:text-zinc-500">
                    {dict.blog.createdAt}:{" "}
                    <time dateTime={post.createdAt}>{post.createdAt.slice(0, 10)}</time>
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-500">{post.slug}</p>
                {post.summary && (
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">{post.summary}</p>
                )}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => startEdit(post)}
                    disabled={pending}
                    className={smallButtonClassName}
                  >
                    {manage.edit}
                  </button>
                  {confirmingDeleteId === post.id ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleDelete(post.id)}
                        disabled={pending}
                        className={dangerButtonClassName}
                      >
                        {manage.deleteConfirm}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmingDeleteId(null)}
                        disabled={pending}
                        className={smallButtonClassName}
                      >
                        {manage.cancel}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmingDeleteId(post.id)}
                      disabled={pending}
                      className="rounded-full border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
                    >
                      {manage.delete}
                    </button>
                  )}
                </div>
              </li>
            ),
          )}
        </ul>
      )}
    </section>
  );
}
