import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary, hasLocale } from "@/lib/i18n";
import InterviewPlanner from "./InterviewPlanner";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/interview-planner">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return { title: "404" };
  const dict = getDictionary(lang);
  return { title: dict.planner.title, description: dict.planner.intro };
}

export default async function InterviewPlannerPage({
  params,
}: PageProps<"/[lang]/interview-planner">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = getDictionary(lang);

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-16 sm:py-24">
      <section className="flex flex-col gap-6">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {dict.planner.title}
        </h1>
        <p className="max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
          {dict.planner.intro}
        </p>
        <InterviewPlanner dict={dict.planner} />
      </section>
    </div>
  );
}
