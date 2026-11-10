import type { Metadata } from "next";
import { profile } from "@/data/profile";
import { getDictionary, hasLocale } from "@/lib/i18n";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/about-me">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return { title: "404" };
  const dict = getDictionary(lang);
  return {
    title: dict.about.title,
    description:
      lang === "zh"
        ? "Zhike Yan 的简介、教育经历、实习经历与技能。"
        : "Zhike Yan's introduction, education, experience, and skills.",
  };
}

export default async function AboutMePage({
  params,
}: PageProps<"/[lang]/about-me">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = getDictionary(lang);

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-16 sm:py-24">
      <section className="flex flex-col gap-4">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {dict.about.title}
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          {profile.name} · {profile.location}
        </p>
        <p className="leading-8 text-zinc-600 dark:text-zinc-400">
          {profile.intro[lang]}
        </p>
      </section>

      <section className="flex flex-col gap-4 pt-12">
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {dict.about.education}
        </h2>
        <ul className="flex flex-col gap-4">
          {profile.education.map((item) => (
            <li
              key={item.school + item.degree}
              className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
            >
              <p className="font-medium text-zinc-900 dark:text-zinc-50">
                {item.school}
              </p>
              <p className="text-zinc-600 dark:text-zinc-400">{item.degree}</p>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {item.location} · {item.period[lang]}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-4 pt-12">
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {dict.about.experience}
        </h2>
        <ul className="flex flex-col gap-4">
          {profile.experience.map((item) => (
            <li
              key={item.company + item.period.en}
              className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-medium text-zinc-900 dark:text-zinc-50">
                  {item.company}
                </p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {item.period[lang]}
                </p>
              </div>
              <p className="text-zinc-600 dark:text-zinc-400">
                {item.role[lang]}
              </p>
              <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                {item.points.map((point) => (
                  <li key={point.en}>{point[lang]}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-4 pt-12">
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {dict.about.skills}
        </h2>
        <ul className="flex flex-col gap-3">
          {profile.skills.map((group) => (
            <li
              key={group.category.en}
              className="flex flex-col gap-1 sm:flex-row sm:gap-3"
            >
              <span className="w-fit rounded-full bg-zinc-100 px-2 py-0.5 text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                {group.category[lang]}
              </span>
              <span className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                {group.items[lang]}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3 pt-12">
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {dict.about.misc}
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400">
          {dict.about.languages}：{profile.languages[lang]}
        </p>
        <p className="text-zinc-600 dark:text-zinc-400">
          {dict.about.interests}：{profile.interests[lang]}
        </p>
      </section>
    </div>
  );
}
