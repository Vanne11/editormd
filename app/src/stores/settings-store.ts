import { create } from "zustand";
import type { Locale, Translations } from "@/lib/i18n";
import { getTranslations } from "@/lib/i18n";

interface SettingsState {
  locale: Locale;
  t: Translations;
  setLocale: (locale: Locale) => void;
}

const savedLocale = (localStorage.getItem("editormd_locale") as Locale) || "es";

export const useSettingsStore = create<SettingsState>((set) => ({
  locale: savedLocale,
  t: getTranslations(savedLocale),

  setLocale: (locale: Locale) => {
    localStorage.setItem("editormd_locale", locale);
    set({ locale, t: getTranslations(locale) });
  },
}));
