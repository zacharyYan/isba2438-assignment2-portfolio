import { dictionaries } from "@/dictionaries";
import type { Dictionary } from "@/dictionaries/zh";

export const locales = ["zh", "en"] as const;

export type Locale = (typeof locales)[number];

export type Localized = Record<Locale, string>;

export function hasLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export function pick(value: Localized, locale: Locale): string {
  return value[locale];
}

export type { Dictionary };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export function otherLocale(locale: Locale): Locale {
  return locale === "zh" ? "en" : "zh";
}
