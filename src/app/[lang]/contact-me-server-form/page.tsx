import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { profile } from "@/data/profile";
import { getDictionary, hasLocale } from "@/lib/i18n";
import ContactForm from "./ContactForm";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/contact-me-server-form">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return { title: "404" };
  const dict = getDictionary(lang);
  return { title: dict.contact.title, description: dict.contact.intro };
}

export default async function ContactMePage({
  params,
}: PageProps<"/[lang]/contact-me-server-form">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = getDictionary(lang);

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-16 sm:py-24">
      <section className="flex flex-col gap-4">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {dict.contact.title}
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">{dict.contact.intro}</p>
        <ul className="flex flex-col gap-1 text-zinc-600 dark:text-zinc-400">
          {profile.email && (
            <li>
              {dict.contact.email}：
              <a
                href={`mailto:${profile.email}`}
                className="underline underline-offset-4 hover:text-zinc-900 dark:hover:text-zinc-50"
              >
                {profile.email}
              </a>
            </li>
          )}
          {profile.phone && (
            <li>
              {dict.contact.phone}：{profile.phone}
            </li>
          )}
          {profile.links.map((link) => (
            <li key={link.url}>
              {link.label}：
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-4 hover:text-zinc-900 dark:hover:text-zinc-50"
              >
                {link.url.replace(/^https?:\/\//, "")}
              </a>
            </li>
          ))}
        </ul>
        <ContactForm dict={dict} />
      </section>
    </div>
  );
}
