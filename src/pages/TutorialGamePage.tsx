import { useState } from "react";
import { Link } from "react-router-dom";
import { PageContainer } from "../components/common/PageContainer";
import { RetroButton } from "../components/common/RetroButton";
import { GameBoardPanel } from "../components/game/GameBoardPanel";
import { useShogiGame } from "../hooks/useShogiGame";
import { useI18n } from "../i18n/I18nContext";

export function TutorialGamePage() {
  const { t } = useI18n();
  const game = useShogiGame();
  const [showHint, setShowHint] = useState(false);

  return (
    <PageContainer>
      <h1>{t("learn.tutorialTitle")}</h1>
      <p style={{ maxWidth: "62ch", color: "var(--ink-700)" }}>{t("learn.tutorialIntro")}</p>

      {game.state.status !== "ongoing" && (
        <div
          style={{
            border: "1px solid var(--shu-600)",
            background: "var(--wood-200)",
            padding: "16px",
            marginBottom: "16px",
          }}
        >
          <strong>{t("game.gameOver")}</strong>
          <div style={{ marginTop: "8px", display: "flex", gap: "12px" }}>
            <Link to="/play/cpu">
              <RetroButton variant="primary">{t("nav.playCpu")}</RetroButton>
            </Link>
          </div>
        </div>
      )}

      <GameBoardPanel
        game={game}
        showResign={false}
        hint={showHint ? t("game.selectPieceHint") + " " + t("game.dropHint") : undefined}
        headerExtra={
          <RetroButton size="small" onClick={() => setShowHint((v) => !v)}>
            {t("learn.tutorialHint")}
          </RetroButton>
        }
      />
    </PageContainer>
  );
}
