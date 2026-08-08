import { Link } from "react-router-dom";
import { PageContainer } from "../components/common/PageContainer";
import { RetroButton } from "../components/common/RetroButton";
import { RetroPanel } from "../components/common/RetroPanel";
import { useI18n } from "../i18n/I18nContext";

export function PlayMenuPage() {
  const { t } = useI18n();
  return (
    <PageContainer>
      <h1>{t("nav.play")}</h1>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        <RetroPanel title={t("nav.playCpu")}>
          <p>{t("game.difficultyBeginner")} 〜 {t("game.difficultyExpert")}</p>
          <Link to="/play/cpu">
            <RetroButton variant="primary">{t("common.start")}</RetroButton>
          </Link>
        </RetroPanel>
        <RetroPanel title={t("nav.playOnline")}>
          <p style={{ color: "var(--ink-500)" }}>Coming soon — 준비 중 — 準備中</p>
          <RetroButton disabled>{t("common.start")}</RetroButton>
        </RetroPanel>
      </div>
    </PageContainer>
  );
}
