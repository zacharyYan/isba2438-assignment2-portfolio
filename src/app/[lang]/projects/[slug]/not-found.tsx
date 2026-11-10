import type { Metadata } from "next";
import Link from "next/link";
import { lang } from "next/root-params";
import { getDictionary, hasLocale } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "404",
};

export default async function ProjectNotFound() {
  const locale = await lang();
  const dict = hasLocale(locale) ? getDictionary(locale) : getDictionary("zh");

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col items-start gap-4 px-6 py-24">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        {dict.projects.notFoundTitle}
      </h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        {dict.projects.notFoundMessage}
      </p>
      <Link
        href={`/${locale}/projects`}
        className="flex h-11 items-center rounded-full bg-zinc-900 px-5 text-sm font-medium text-zinc-50 transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {dict.projects.backToProjects}
      </Link>
    </div>
  );
}
