import { create } from "zustand";
import type { Locale, Translations } from "@/lib/i18n";
import { getTranslations } from "@/lib/i18n";

interface SettingsState {
  locale: Locale;
  t: Translations;
  autoSave: boolean;
  setLocale: (locale: Locale) => void;
  setAutoSave: (enabled: boolean) => void;
}

const savedLocale = (localStorage.getItem("editormd_locale") as Locale) || "es";
const savedAutoSave = localStorage.getItem("editormd_autosave") !== "false";

export const useSettingsStore = create<SettingsState>((set) => ({
  locale: savedLocale,
  t: getTranslations(savedLocale),
  autoSave: savedAutoSave,

  setLocale: (locale: Locale) => {
    localStorage.setItem("editormd_locale", locale);
    set({ locale, t: getTranslations(locale) });
  },

  setAutoSave: (enabled: boolean) => {
    localStorage.setItem("editormd_autosave", String(enabled));
    set({ autoSave: enabled });
  },
}));
