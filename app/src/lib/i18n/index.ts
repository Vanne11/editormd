import { es } from "./es";
import { en } from "./en";

export type Locale = "es" | "en";

type DeepStringify<T> = {
  [K in keyof T]: T[K] extends string ? string : DeepStringify<T[K]>;
};

export type Translations = DeepStringify<typeof es>;

const locales: Record<Locale, Translations> = { es, en };

export function getTranslations(locale: Locale): Translations {
  return locales[locale];
}

export { es, en };
