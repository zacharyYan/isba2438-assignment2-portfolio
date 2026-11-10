import Link from "next/link";
import type { Project } from "@/data/projects";
import { getDictionary, type Locale } from "@/lib/i18n";

export default function ProjectCard({
  project,
  lang,
}: {
  project: Project;
  lang: Locale;
}) {
  const dict = getDictionary(lang);
  const techStack = Array.from(new Set(project.techStack));

  return (
    <Link
      href={`/${lang}/projects/${project.slug}`}
      className="group flex flex-col gap-3 rounded-lg border border-zinc-200 p-5 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
    >
      <div className="flex items-center justify-between gap-2 text-sm text-zinc-500 dark:text-zinc-400">
        {project.year ? <span>{project.year}</span> : <span />}
        {project.featured && (
          <span className="rounded-full border border-zinc-300 px-2 py-0.5 text-xs dark:border-zinc-700">
            {dict.projects.featuredBadge}
          </span>
        )}
      </div>
      <h3 className="text-lg font-semibold tracking-tight text-zinc-900 group-hover:underline dark:text-zinc-50">
        {project.title[lang]}
      </h3>
      <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
        {project.summary[lang]}
      </p>
      <ul className="flex flex-wrap gap-2 text-xs text-zinc-500 dark:text-zinc-400">
        {techStack.map((tech) => (
          <li
            key={tech}
            className="rounded-full bg-zinc-100 px-2 py-0.5 dark:bg-zinc-800"
          >
            {tech}
          </li>
        ))}
      </ul>
    </Link>
  );
}
