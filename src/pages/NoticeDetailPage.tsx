import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PageContainer } from "../components/common/PageContainer";
import { RetroButton } from "../components/common/RetroButton";
import { api, ApiError } from "../api/client";
import { noticeContent, noticeTitle } from "../api/notice";
import type { Notice } from "../api/notice";
import { useI18n } from "../i18n/I18nContext";

export function NoticeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t, locale } = useI18n();
  const [notice, setNotice] = useState<Notice | null | undefined>(undefined);

  useEffect(() => {
    if (!id) return;
    setNotice(undefined);
    api
      .get<{ notice: Notice }>(`/api/notices/${id}`)
      .then((res) => setNotice(res.notice))
      .catch((err) => {
        if (err instanceof ApiError) setNotice(null);
      });
  }, [id]);

  if (notice === undefined) {
    return (
      <PageContainer>
        <p style={{ textAlign: "center", color: "var(--ink-500)" }}>{t("loading.notices")}</p>
      </PageContainer>
    );
  }

  if (!notice) {
    return (
      <PageContainer>
        <h1>{t("notice.title")}</h1>
        <p>{t("notice.empty")}</p>
        <Link to="/notice">
          <RetroButton>{t("notice.backToList")}</RetroButton>
        </Link>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div style={{ maxWidth: "68ch", margin: "0 auto" }}>
        <div style={{ textAlign: "center", borderTop: "2px solid var(--ink-900)", borderBottom: "2px solid var(--ink-900)", padding: "24px 0", marginBottom: "24px" }}>
          <h1 style={{ marginBottom: "8px" }}>{noticeTitle(notice, locale)}</h1>
          <div style={{ fontFamily: "var(--mono)", fontSize: "var(--fs-caption)", color: "var(--ink-500)" }}>
            {new Date(notice.publishedAt).toLocaleDateString(locale)}
          </div>
        </div>
        <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.9 }}>{noticeContent(notice, locale)}</p>
        <div style={{ textAlign: "center", marginTop: "32px" }}>
          <Link to="/notice">
            <RetroButton>{t("notice.backToList")}</RetroButton>
          </Link>
        </div>
      </div>
    </PageContainer>
  );
}
