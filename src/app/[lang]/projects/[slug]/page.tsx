import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getProjectBySlug } from "@/lib/project-store";
import { getDictionary, hasLocale } from "@/lib/i18n";

// The route has no generateStaticParams: projects are runtime data. Everything
// request-time (the params read and the store read) lives inside the Suspense
// boundary so the shell can still prerender, per the Cache Components guide.
// Deleted slugs resolve to notFound() — no static fallback can resurrect them.
export default function ProjectDetailPage({
  params,
}: PageProps<"/[lang]/projects/[slug]">) {
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
        <ProjectDetailContent params={params} />
      </Suspense>
    </div>
  );
}

async function ProjectDetailContent({
  params,
}: {
  params: PageProps<"/[lang]/projects/[slug]">["params"];
}) {
  const { lang, slug } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = getDictionary(lang);

  let project;
  try {
    project = await getProjectBySlug(slug);
  } catch {
    return (
      <p
        role="alert"
        className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
      >
        {dict.projects.storageError}
      </p>
    );
  }
  if (!project) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <article className="flex flex-col gap-6">
        <header className="flex flex-col gap-3">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {[project.year, project.role[lang]].filter(Boolean).join(" · ")}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
            {project.title[lang]}
          </h1>
          <ul className="flex flex-wrap gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            {project.techStack.map((tech) => (
              <li
                key={tech}
                className="rounded-full bg-zinc-100 px-2 py-0.5 dark:bg-zinc-800"
              >
                {tech}
              </li>
            ))}
          </ul>
        </header>

        <p className="leading-8 text-zinc-600 dark:text-zinc-400">
          {project.description[lang]}
        </p>

        {project.links && project.links.length > 0 ? (
          <ul className="flex flex-wrap gap-3">
            {project.links.map((link) => (
              <li key={link.kind + link.url}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 items-center rounded-full border border-zinc-300 px-5 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-500 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-500"
                >
                  {link.kind === "source"
                    ? dict.projects.linkSource
                    : dict.projects.linkDemo}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p>{dict.projects.linkTbd}</p>
        )}
      </article>

      <div className="mt-12 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <Link
          href={`/${lang}/projects`}
          className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          {dict.projects.backToList}
        </Link>
      </div>
    </div>
  );
}

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/projects/[slug]">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return { title: "404" };
  const dict = getDictionary(lang);
  return { title: dict.projects.title, description: dict.siteDescription };
}
