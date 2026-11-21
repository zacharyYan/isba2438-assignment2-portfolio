import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary, hasLocale } from "@/lib/i18n";
import ManageContacts from "./ManageContacts";
import ManageBlogs from "./ManageBlogs";
import ManageProjects from "./ManageProjects";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/manage">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return { title: "404" };
  const dict = getDictionary(lang);
  return { title: dict.manage.title, description: dict.manage.intro };
}

export default async function ManagePage({
  params,
}: PageProps<"/[lang]/manage">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = getDictionary(lang);

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-16 sm:py-24">
      <div className="flex flex-col gap-12">
        <section className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {dict.manage.title}
          </h1>
          <p className="max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
            {dict.manage.intro}
          </p>
        </section>
        <ManageContacts dict={dict} />
        <ManageBlogs dict={dict} />
        <ManageProjects dict={dict} lang={lang} />
      </div>
    </div>
  );
}
