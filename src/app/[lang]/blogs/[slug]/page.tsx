import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getBlogPost } from "@/lib/blog-store";
import { getDictionary, hasLocale } from "@/lib/i18n";

// The route has no generateStaticParams: posts are runtime data. Everything
// request-time (the params read and the store read) lives inside the Suspense
// boundary so the shell can still prerender, per the Cache Components guide.
export default function BlogPostPage({
  params,
}: PageProps<"/[lang]/blogs/[slug]">) {
  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-16 sm:py-24">
      <Suspense
        fallback={
          <div
            aria-hidden
            className="h-4 w-40 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800"
          />
        }
      >
        <BlogPostContent params={params} />
      </Suspense>
    </div>
  );
}

async function BlogPostContent({
  params,
}: {
  params: PageProps<"/[lang]/blogs/[slug]">["params"];
}) {
  const { lang, slug } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = getDictionary(lang);

  let post;
  try {
    post = await getBlogPost(slug);
  } catch {
    return (
      <p
        role="alert"
        className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
      >
        {dict.blog.storageError}
      </p>
    );
  }
  if (!post) {
    notFound();
  }
  return (
    <article className="flex flex-col gap-5">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        {post.title}
      </h1>
      <p className="text-xs text-zinc-500 dark:text-zinc-500">
        {dict.blog.createdAt}: {post.createdAt.slice(0, 10)}
      </p>
      {post.summary && (
        <p className="text-base text-zinc-600 dark:text-zinc-400">
          {post.summary}
        </p>
      )}
      <div className="flex flex-col gap-4 text-base leading-relaxed text-zinc-800 dark:text-zinc-200">
        {post.body.split("\n").map((paragraph, index) =>
          paragraph.trim().length > 0 ? (
            <p key={index}>{paragraph}</p>
          ) : null,
        )}
      </div>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        <Link
          href={`/${lang}/blogs`}
          className="underline underline-offset-4 hover:text-zinc-900 dark:hover:text-zinc-50"
        >
          {dict.blog.backToList}
        </Link>
      </p>
    </article>
  );
}

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/blogs/[slug]">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return { title: "404" };
  const dict = getDictionary(lang);
  return { title: dict.blog.title, description: dict.blog.empty };
}
