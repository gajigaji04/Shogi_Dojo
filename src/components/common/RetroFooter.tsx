import { Link } from "react-router-dom";
import { useI18n } from "../../i18n/I18nContext";
import styles from "./RetroFooter.module.css";

export function RetroFooter() {
  const { t } = useI18n();
  return (
    <footer className={styles.footer}>
      <div className={styles.links}>
        <Link to="/about">{t("common.aboutSite")}</Link>
        <Link to="/about-shogi">{t("common.aboutShogi")}</Link>
        <Link to="/contact">{t("common.contact")}</Link>
      </div>
      <div>
        © {new Date().getFullYear()} {t("app.title")} · V.{__APP_VERSION__}
      </div>
    </footer>
  );
}
