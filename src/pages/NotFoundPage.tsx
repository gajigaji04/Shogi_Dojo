import { Link } from "react-router-dom";
import { PageContainer } from "../components/common/PageContainer";
import { RetroButton } from "../components/common/RetroButton";
import { useI18n } from "../i18n/I18nContext";

export function NotFoundPage() {
  const { t } = useI18n();
  return (
    <PageContainer>
      <div style={{ textAlign: "center", padding: "64px 0" }}>
        <div style={{ fontFamily: "var(--serif)", fontSize: "var(--fs-display)", color: "var(--shu-700)", marginBottom: "8px" }}>
          {t("notFound.title")}
        </div>
        <p style={{ color: "var(--ink-700)", marginBottom: "24px" }}>{t("notFound.body")}</p>
        <Link to="/">
          <RetroButton variant="primary">{t("notFound.backHome")}</RetroButton>
        </Link>
      </div>
    </PageContainer>
  );
}
