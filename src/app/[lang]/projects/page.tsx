import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import ProjectCard from "@/components/ProjectCard";
import { listProjects } from "@/lib/project-store";
import { getDictionary, hasLocale } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/projects">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return { title: "404" };
  const dict = getDictionary(lang);
  return { title: dict.projects.title, description: dict.siteDescription };
}

export default async function ProjectsPage({
  params,
}: PageProps<"/[lang]/projects">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = getDictionary(lang);

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-16 sm:py-24">
      <section className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {dict.projects.title}
        </h1>
        <Suspense
          fallback={
            <div
              aria-hidden
              className="h-4 w-40 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800"
            />
          }
        >
          <ProjectsListContent lang={lang} dict={dict} />
        </Suspense>
      </section>
    </div>
  );
}

async function ProjectsListContent({
  lang,
  dict,
}: {
  lang: "zh" | "en";
  dict: ReturnType<typeof getDictionary>;
}) {
  let projects;
  try {
    projects = await listProjects();
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

  return (
    <>
      <p className="text-zinc-600 dark:text-zinc-400">
        {dict.projects.count.replace("{n}", String(projects.length))}
      </p>
      <div className="grid gap-4 pt-8 sm:grid-cols-2">
        {projects.map((project) => (
          <ProjectCard key={project.slug} project={project} lang={lang} />
        ))}
      </div>
    </>
  );
}
