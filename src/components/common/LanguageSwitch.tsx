import { LOCALES, useI18n } from "../../i18n/I18nContext";
import type { Locale } from "../../i18n/I18nContext";
import styles from "./LanguageSwitch.module.css";

export function LanguageSwitch() {
  const { locale, setLocale, t } = useI18n();

  return (
    <div className={styles.switch} role="group" aria-label="Language">
      {LOCALES.map((code: Locale, i) => (
        <span key={code} style={{ display: "contents" }}>
          {i > 0 && <span className={styles.sep} aria-hidden="true">|</span>}
          <button
            type="button"
            className={[styles.btn, locale === code ? styles.active : ""].join(" ")}
            aria-pressed={locale === code}
            onClick={() => setLocale(code)}
          >
            {t(`lang.${code}`)}
          </button>
        </span>
      ))}
    </div>
  );
}
