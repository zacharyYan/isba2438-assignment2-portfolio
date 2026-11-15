import Link from "next/link";
import { lang } from "next/root-params";
import { getDictionary, hasLocale } from "@/lib/i18n";

export default async function BlogPostNotFound() {
  const locale = await lang();
  const dict = hasLocale(locale) ? getDictionary(locale) : getDictionary("en");

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-16 sm:py-24">
      <section className="flex flex-col gap-4">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {dict.blog.notFoundTitle}
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          {dict.blog.notFoundMessage}
        </p>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          <Link
            href={`/${locale}/blogs`}
            className="underline underline-offset-4 hover:text-zinc-900 dark:hover:text-zinc-50"
          >
            {dict.blog.backToBlogs}
          </Link>
        </p>
      </section>
    </div>
  );
}
