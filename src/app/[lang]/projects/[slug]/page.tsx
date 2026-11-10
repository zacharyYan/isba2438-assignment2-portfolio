import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProjectBySlug, projects } from "@/data/projects";
import { getDictionary, hasLocale } from "@/lib/i18n";

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/projects/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!hasLocale(lang)) return { title: "404" };
  const project = getProjectBySlug(slug);
  if (!project) {
    return { title: getDictionary(lang).projects.notFoundTitle };
  }
  return { title: project.title[lang], description: project.summary[lang] };
}

export default async function ProjectDetailPage({
  params,
}: PageProps<"/[lang]/projects/[slug]">) {
  const { lang, slug } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const project = getProjectBySlug(slug);
  if (!project) notFound();

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-16 sm:py-24">
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
