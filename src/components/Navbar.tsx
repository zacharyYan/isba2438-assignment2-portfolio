import Link from "next/link";
import { Suspense } from "react";
import LocaleToggle from "./LocaleToggle";
import { getDictionary, type Locale } from "@/lib/i18n";

const navItems = [
  { href: "", key: "home" },
  { href: "/projects", key: "projects" },
  { href: "/blogs", key: "blog" },
  { href: "/resources", key: "resources" },
  { href: "/interview-planner", key: "planner" },
  { href: "/manage", key: "manage" },
  { href: "/about-me", key: "about" },
  { href: "/contact-me", key: "contact" },
] as const;

export default function Navbar({ lang }: { lang: Locale }) {
  const dict = getDictionary(lang);

  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-background/80 backdrop-blur dark:border-zinc-800">
      <nav className="mx-auto flex min-h-14 w-full max-w-4xl flex-wrap items-center justify-between gap-x-6 gap-y-1 px-6 py-2">
        <Link
          href={`/${lang}`}
          className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
        >
          Zhike Yan
        </Link>
        <div className="flex flex-1 items-center justify-end gap-5">
          <ul className="flex flex-wrap items-center justify-end gap-x-5 gap-y-1 text-sm text-zinc-600 dark:text-zinc-400">
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
          <Suspense fallback={null}>
            <LocaleToggle lang={lang} />
          </Suspense>
        </div>
      </nav>
    </header>
  );
}
