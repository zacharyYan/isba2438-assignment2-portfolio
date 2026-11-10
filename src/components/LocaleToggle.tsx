"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { otherLocale, type Locale } from "@/lib/i18n";

export default function LocaleToggle({ lang }: { lang: Locale }) {
  const pathname = usePathname();
  const rest = pathname.replace(/^\/(zh|en)/, "") || "";
  const target = otherLocale(lang);

  return (
    <Link
      href={`/${target}${rest}`}
      className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-600 transition-colors hover:border-zinc-500 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-500 dark:hover:text-zinc-50"
    >
      {target === "zh" ? "中文" : "English"}
    </Link>
  );
}
