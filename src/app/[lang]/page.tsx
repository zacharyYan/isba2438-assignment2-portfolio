import Link from "next/link";
import ProjectCard from "@/components/ProjectCard";
import { getFeaturedProjects } from "@/data/projects";
import { profile } from "@/data/profile";
import { getDictionary, hasLocale } from "@/lib/i18n";
import { notFound } from "next/navigation";

export default async function HomePage({
  params,
}: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const featured = getFeaturedProjects();

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-16 sm:py-24">
      <section className="flex flex-col gap-4">
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl dark:text-zinc-50">
          {profile.name}
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          {profile.tagline[lang]}
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href={`/${lang}/projects`}
            className="flex h-11 items-center rounded-full bg-zinc-900 px-5 text-sm font-medium text-zinc-50 transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            {dict.home.viewProjects}
          </Link>
          <Link
            href={`/${lang}/about-me`}
            className="flex h-11 items-center rounded-full border border-zinc-300 px-5 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-500 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-500"
          >
            {dict.home.aboutMe}
          </Link>
        </div>
      </section>

      <section className="flex flex-col gap-6 pt-16">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {dict.home.featured}
          </h2>
          <Link
            href={`/${lang}/projects`}
            className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            {dict.home.allProjects}
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {featured.map((project) => (
            <ProjectCard key={project.slug} project={project} lang={lang} />
          ))}
        </div>
      </section>
    </div>
  );
}
