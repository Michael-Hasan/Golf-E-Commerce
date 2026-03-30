import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import ko from "./locales/ko.json";
import uz from "./locales/uz.json";
import enCompany from "./locales/company.en.json";
import koCompany from "./locales/company.ko.json";
import uzCompany from "./locales/company.uz.json";
import enSupport from "./locales/support.en.json";
import koSupport from "./locales/support.ko.json";
import uzSupport from "./locales/support.uz.json";

export const APP_LANGS = ["en", "ko", "uz"] as const;
export type AppLang = (typeof APP_LANGS)[number];

export const LANG_STORAGE_KEY = "golf-lang";

export function normalizeLang(lng: string): AppLang {
  const base = lng.split("-")[0]?.toLowerCase() ?? "en";
  if (base === "ko") return "ko";
  if (base === "uz") return "uz";
  return "en";
}

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: { ...en, ...enCompany, ...enSupport } },
      ko: { translation: { ...ko, ...koCompany, ...koSupport } },
      uz: { translation: { ...uz, ...uzCompany, ...uzSupport } },
    },
    fallbackLng: "en",
    supportedLngs: [...APP_LANGS],
    nonExplicitSupportedLngs: true,
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: LANG_STORAGE_KEY,
    },
    interpolation: { escapeValue: false },
  });

function syncHtmlLang(lng: string) {
  document.documentElement.lang = normalizeLang(lng);
}

syncHtmlLang(i18n.language);
i18n.on("languageChanged", syncHtmlLang);

export default i18n;
