import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import ko from "./locales/ko.json";
import ja from "./locales/ja.json";
import en from "./locales/en.json";
import { flatten } from "./flatten";
import type { Tree } from "./flatten";

export type Locale = "ko" | "ja" | "en";

const DICTIONARIES: Record<Locale, Record<string, string>> = {
  ko: flatten(ko as Tree),
  ja: flatten(ja as Tree),
  en: flatten(en as Tree),
};

export const LOCALES: Locale[] = ["ko", "ja", "en"];

const STORAGE_KEY = "shogi-dojo.locale";

function detectInitialLocale(): Locale {
  if (typeof window === "undefined") return "ko";
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === "ko" || saved === "ja" || saved === "en") return saved;
  const nav = window.navigator.language.toLowerCase();
  if (nav.startsWith("ja")) return "ja";
  if (nav.startsWith("ko")) return "ko";
  return "en";
}

type TranslateVars = Record<string, string | number>;

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, vars?: TranslateVars) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function interpolate(template: string, vars?: TranslateVars): string {
  if (!vars) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (match, name) => {
    const value = vars[name];
    return value === undefined ? match : String(value);
  });
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(detectInitialLocale);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, next);
    if (typeof document !== "undefined") document.documentElement.lang = next;
  }, []);

  const t = useCallback(
    (key: string, vars?: TranslateVars) => {
      const dict = DICTIONARIES[locale];
      const template = dict[key] ?? DICTIONARIES.en[key] ?? key;
      return interpolate(template, vars);
    },
    [locale]
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within an I18nProvider");
  return ctx;
}
