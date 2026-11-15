import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary, hasLocale } from "@/lib/i18n";
import BlogAdminForm from "./BlogAdminForm";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/admin/blogs">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return { title: "404" };
  const dict = getDictionary(lang);
  return { title: dict.blog.adminTitle, description: dict.blog.adminIntro };
}

export default async function BlogAdminPage({
  params,
}: PageProps<"/[lang]/admin/blogs">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = getDictionary(lang);

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-16 sm:py-24">
      <section className="flex flex-col gap-6">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {dict.blog.adminTitle}
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          {dict.blog.adminIntro}
        </p>
        <BlogAdminForm dict={dict} lang={lang} />
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          <Link
            href={`/${lang}/blogs`}
            className="underline underline-offset-4 hover:text-zinc-900 dark:hover:text-zinc-50"
          >
            {dict.blog.backToBlogs}
          </Link>
        </p>
      </section>
    </div>
  );
}
