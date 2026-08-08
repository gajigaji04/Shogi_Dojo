import { Link } from "react-router-dom";
import { PageContainer } from "../components/common/PageContainer";
import { RetroPanel } from "../components/common/RetroPanel";
import { RetroButton } from "../components/common/RetroButton";
import { useI18n } from "../i18n/I18nContext";

export function AboutPage() {
  const { t } = useI18n();
  return (
    <PageContainer>
      <h1 style={{ textAlign: "center" }}>{t("about.title")}</h1>
      <div style={{ maxWidth: "68ch", margin: "0 auto" }}>
        <p style={{ fontSize: "var(--fs-body-lg)", color: "var(--ink-700)" }}>{t("about.intro")}</p>
        <p>{t("about.body")}</p>
        <RetroPanel title={t("about.noteTitle")}>
          <p style={{ marginBottom: "16px" }}>{t("about.noteBody")}</p>
          <Link to="/contact">
            <RetroButton>{t("about.contactCta")}</RetroButton>
          </Link>
        </RetroPanel>
      </div>
    </PageContainer>
  );
}
