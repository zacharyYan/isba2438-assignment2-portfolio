import Link from "next/link";
import LocaleToggle from "./LocaleToggle";
import { getDictionary, type Locale } from "@/lib/i18n";

const navItems = [
  { href: "", key: "home" },
  { href: "/projects", key: "projects" },
  { href: "/about-me", key: "about" },
  { href: "/contact-me-server-form", key: "contact" },
] as const;

export default function Navbar({ lang }: { lang: Locale }) {
  const dict = getDictionary(lang);

  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-background/80 backdrop-blur dark:border-zinc-800">
      <nav className="mx-auto flex h-14 w-full max-w-4xl items-center justify-between px-6">
        <Link
          href={`/${lang}`}
          className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
        >
          Zhike Yan
        </Link>
        <div className="flex items-center gap-5">
          <ul className="flex items-center gap-5 text-sm text-zinc-600 dark:text-zinc-400">
            {navItems.map((item) => (
              <li key={item.key}>
                <Link
                  href={`/${lang}${item.href}`}
                  className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-50"
                >
                  {dict.nav[item.key]}
                </Link>
              </li>
            ))}
          </ul>
          <LocaleToggle lang={lang} />
        </div>
      </nav>
    </header>
  );
}
