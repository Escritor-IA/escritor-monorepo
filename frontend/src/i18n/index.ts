import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import ptBR from "./locales/pt-BR.json";
import en from "./locales/en.json";
import fr from "./locales/fr.json";
import es from "./locales/es.json";

export const SUPPORTED_LANGUAGES = ["pt-br", "en", "fr", "es"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

// Map browser locale codes to our supported codes
const LOCALE_MAP: Record<string, SupportedLanguage> = {
  "pt": "pt-br",
  "pt-BR": "pt-br",
  "pt-br": "pt-br",
  "en": "en",
  "en-US": "en",
  "en-GB": "en",
  "fr": "fr",
  "fr-FR": "fr",
  "es": "es",
  "es-ES": "es",
  "es-419": "es",
};

export function normalizeLanguage(lang: string): SupportedLanguage {
  return LOCALE_MAP[lang] ?? LOCALE_MAP[lang.split("-")[0]] ?? "pt-br";
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      // Register both casings so the browser locale "pt-BR" and our internal
      // "pt-br" key both resolve to the same translations.
      "pt-br": { translation: ptBR },
      "pt-BR": { translation: ptBR },
      pt:      { translation: ptBR },
      en:      { translation: en },
      "en-US": { translation: en },
      "en-GB": { translation: en },
      fr:      { translation: fr },
      "fr-FR": { translation: fr },
      es:      { translation: es },
      "es-ES": { translation: es },
      "es-419":{ translation: es },
    },
    fallbackLng: "pt-br",
    // No supportedLngs filter — let fallbackLng handle unknown locales instead.
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "escritor_lang",
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
