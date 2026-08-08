import { Link } from "react-router-dom";
import { PageContainer } from "../components/common/PageContainer";
import { RetroButton } from "../components/common/RetroButton";
import { RetroPanel } from "../components/common/RetroPanel";
import { useAuth } from "../auth/AuthContext";
import { useI18n } from "../i18n/I18nContext";

export function PlayMenuPage() {
  const { t } = useI18n();
  const { status } = useAuth();
  return (
    <PageContainer>
      <h1>{t("nav.play")}</h1>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        <RetroPanel title={t("nav.playCpu")}>
          <p>
            {t("game.difficultyBeginner")} 〜 {t("game.difficultyExpert")}
          </p>
          <Link to="/play/cpu">
            <RetroButton variant="primary">{t("common.start")}</RetroButton>
          </Link>
        </RetroPanel>
        <RetroPanel title={t("nav.playOnline")}>
          <p style={{ color: "var(--ink-700)" }}>{t("online.findOpponent")}</p>
          {status !== "authenticated" && (
            <p style={{ color: "var(--ink-500)", fontSize: "var(--fs-caption)" }}>{t("auth.loginRequiredBody")}</p>
          )}
          <Link to="/play/online">
            <RetroButton variant="primary">{t("common.start")}</RetroButton>
          </Link>
        </RetroPanel>
      </div>
    </PageContainer>
  );
}
