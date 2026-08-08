import type { Locale } from "../i18n/I18nContext";

export interface Notice {
  id: string;
  titleKo: string;
  titleJa: string;
  titleEn: string;
  contentKo: string;
  contentJa: string;
  contentEn: string;
  publishedAt: string;
}

const SUFFIX: Record<Locale, "Ko" | "Ja" | "En"> = { ko: "Ko", ja: "Ja", en: "En" };

export function noticeTitle(notice: Notice, locale: Locale): string {
  return notice[`title${SUFFIX[locale]}`];
}

export function noticeContent(notice: Notice, locale: Locale): string {
  return notice[`content${SUFFIX[locale]}`];
}
