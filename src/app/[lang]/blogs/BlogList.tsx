"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { Dictionary, Locale } from "@/lib/i18n";

type Post = {
  slug: string;
  title: string;
  summary: string;
  createdAt: string;
};

type ListState =
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "empty" }
  | { kind: "ready"; posts: Post[] };

export default function BlogList({
  dict,
  lang,
}: {
  dict: Dictionary;
  lang: Locale;
}) {
  const [state, setState] = useState<ListState>({ kind: "loading" });
  const [attempt, setAttempt] = useState(0);

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
      .then((data: { posts: Post[] }) => {
        if (cancelled) return;
        if (Array.isArray(data.posts) && data.posts.length > 0) {
          setState({ kind: "ready", posts: data.posts });
        } else {
          setState({ kind: "empty" });
        }
      })
      .catch(() => {
        if (!cancelled) setState({ kind: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = useCallback(() => {
    setState({ kind: "loading" });
    setAttempt((n) => n + 1);
  }, []);

  if (state.kind === "loading") {
    return <p className="text-zinc-600 dark:text-zinc-400">{dict.blog.loading}</p>;
  }
  if (state.kind === "error") {
    return (
      <div className="flex flex-col items-start gap-3">
        <p
          role="alert"
          className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
        >
          {dict.blog.listError}
        </p>
        <button
          type="button"
          onClick={retry}
          className="flex h-10 w-fit items-center rounded-full bg-zinc-900 px-5 text-sm font-medium text-zinc-50 transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {dict.blog.retry}
        </button>
      </div>
    );
  }
  if (state.kind === "empty") {
    return <p className="text-zinc-600 dark:text-zinc-400">{dict.blog.empty}</p>;
  }
  return (
    <ul className="flex flex-col gap-6">
      {state.posts.map((post) => (
        <li
          key={post.slug}
          className="flex flex-col gap-1.5 rounded-lg border border-zinc-200 p-5 dark:border-zinc-800"
        >
          <Link
            href={`/${lang}/blogs/${post.slug}`}
            className="text-lg font-semibold text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-50"
          >
            {post.title}
          </Link>
          {post.summary && (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {post.summary}
            </p>
          )}
          <p className="text-xs text-zinc-500 dark:text-zinc-500">
            {dict.blog.createdAt}: {post.createdAt.slice(0, 10)}
          </p>
        </li>
      ))}
    </ul>
  );
}
