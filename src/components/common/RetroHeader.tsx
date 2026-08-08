import { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { useI18n } from "../../i18n/I18nContext";
import { LanguageSwitch } from "./LanguageSwitch";
import styles from "./RetroHeader.module.css";

const NAV_ITEMS: { to: string; key: string }[] = [
  { to: "/", key: "nav.home" },
  { to: "/learn", key: "nav.learn" },
  { to: "/play", key: "nav.play" },
  { to: "/replay", key: "nav.replay" },
  { to: "/profile", key: "nav.profile" },
];

export function RetroHeader() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <header className={styles.header}>
      <div className={styles.top}>
        <Link to="/" className={styles.brand}>
          <span className={styles.brandTitle}>{t("app.title")}</span>
          <span className={styles.brandSub}>{t("app.subtitle")}</span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <LanguageSwitch />
          <button
            type="button"
            className={styles.menuToggle}
            aria-expanded={open}
            aria-controls="primary-nav"
            onClick={() => setOpen((v) => !v)}
          >
            ☰
          </button>
        </div>
      </div>
      <nav className={`${styles.nav} ${open ? styles.navOpen : ""}`} id="primary-nav" aria-label="Primary">
        <div className={styles.navInner}>
          {NAV_ITEMS.map((item, i) => (
            <span key={item.to} style={{ display: "contents" }}>
              {i > 0 && <span className={styles.navSep} aria-hidden="true">｜</span>}
              <NavLink
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ""}`}
                onClick={() => setOpen(false)}
              >
                {t(item.key)}
              </NavLink>
            </span>
          ))}
        </div>
      </nav>
    </header>
  );
}
