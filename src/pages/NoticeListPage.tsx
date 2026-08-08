import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageContainer } from "../components/common/PageContainer";
import { api } from "../api/client";
import { noticeTitle } from "../api/notice";
import type { Notice } from "../api/notice";
import { useI18n } from "../i18n/I18nContext";
import styles from "./NoticeListPage.module.css";

export function NoticeListPage() {
  const { t, locale } = useI18n();
  const [notices, setNotices] = useState<Notice[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    api
      .get<{ notices: Notice[] }>("/api/notices")
      .then((res) => setNotices(res.notices))
      .catch(() => setError(true));
  }, []);

  return (
    <PageContainer>
      <h1 style={{ textAlign: "center" }}>{t("notice.title")}</h1>

      {notices === null && !error && (
        <p style={{ textAlign: "center", color: "var(--ink-500)" }}>{t("loading.notices")}</p>
      )}
      {error && <p style={{ textAlign: "center", color: "var(--shu-700)" }}>{t("errors.illegalMove")}</p>}
      {notices?.length === 0 && <p style={{ textAlign: "center", color: "var(--ink-500)" }}>{t("notice.empty")}</p>}

      {notices && notices.length > 0 && (
        <ul className={styles.list}>
          {notices.map((n) => (
            <li key={n.id}>
              <Link to={`/notice/${n.id}`} className={styles.item}>
                <span className={styles.date}>{new Date(n.publishedAt).toLocaleDateString(locale)}</span>
                <span className={styles.title}>{noticeTitle(n, locale)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PageContainer>
  );
}
