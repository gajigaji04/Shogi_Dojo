import { useI18n } from "../../i18n/I18nContext";
import styles from "./RetroFooter.module.css";

export function RetroFooter() {
  const { t } = useI18n();
  return (
    <footer className={styles.footer}>
      <div className={styles.links}>
        <a href="#about-site">{t("common.aboutSite")}</a>
        <a href="#about-shogi">{t("common.aboutShogi")}</a>
        <a href="#contact">{t("common.contact")}</a>
      </div>
      <div>{t("home.footerNote")}</div>
      <div>© {new Date().getFullYear()} {t("app.title")}</div>
    </footer>
  );
}
