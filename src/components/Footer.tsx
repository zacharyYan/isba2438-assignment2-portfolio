import Link from "next/link";
import { profile } from "@/data/profile";
import { getDictionary, type Locale } from "@/lib/i18n";

async function FooterYear() {
  "use cache";
  return new Date().getFullYear();
}

export default function Footer({ lang }: { lang: Locale }) {
  const dict = getDictionary(lang);

  return (
    <footer className="border-t border-zinc-200 py-8 dark:border-zinc-800">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-3 px-6 text-sm text-zinc-600 sm:flex-row sm:items-center sm:justify-between dark:text-zinc-400">
        <p>
          © <FooterYear /> {profile.name}
        </p>
        {profile.links.length > 0 ? (
          <ul className="flex items-center gap-4">
            {profile.links.map((link) => (
              <li key={link.url}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-50"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        ) : null}
        <Link
          href={`/${lang}/contact-me-server-form`}
          className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-50"
        >
          {dict.footer.contactMe}
        </Link>
      </div>
    </footer>
  );
}
