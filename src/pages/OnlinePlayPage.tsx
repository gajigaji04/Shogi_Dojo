import { useNavigate } from "react-router-dom";
import { PageContainer } from "../components/common/PageContainer";
import { RetroButton } from "../components/common/RetroButton";
import { RequireAuth } from "../components/common/RequireAuth";
import { GameBoardPanel } from "../components/game/GameBoardPanel";
import { ResultModal } from "../components/game/ResultModal";
import type { Outcome, ResultKind } from "../components/game/ResultModal";
import { useOnlineShogiGame } from "../hooks/useOnlineShogiGame";
import { useI18n } from "../i18n/I18nContext";
import styles from "./OnlinePlayPage.module.css";

export function OnlinePlayPage() {
  return (
    <RequireAuth>
      <OnlinePlaySession />
    </RequireAuth>
  );
}

function OnlinePlaySession() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const online = useOnlineShogiGame();

  if (online.connectionError) {
    return (
      <PageContainer>
        <div className={styles.center}>
          <div className={styles.banner}>{t("online.connectionLostBody")}</div>
          <RetroButton variant="primary" onClick={online.reconnect}>
            {t("online.reconnect")}
          </RetroButton>
        </div>
      </PageContainer>
    );
  }

  if (online.phase === "connecting") {
    return (
      <PageContainer>
        <div className={styles.center}>
          <div className={`${styles.spinnerText} ${styles.dots}`}>{t("online.connecting")}</div>
        </div>
      </PageContainer>
    );
  }

  if (online.phase === "searching" || !online.state) {
    return (
      <PageContainer>
        <div className={styles.center}>
          <div className={`${styles.spinnerText} ${styles.dots}`}>{t("online.searching")}</div>
          <RetroButton
            onClick={() => {
              online.cancelQueue();
              navigate("/play");
            }}
          >
            {t("online.cancelSearch")}
          </RetroButton>
        </div>
      </PageContainer>
    );
  }

  const outcome: Outcome | null = online.gameOverInfo
    ? !online.gameOverInfo.winner
      ? "draw"
      : online.gameOverInfo.winner === online.color
        ? "win"
        : "loss"
    : null;

  return (
    <PageContainer>
      <h1>{t("online.title")}</h1>
      <p className={styles.matchedNotice}>{t("online.matchedWith", { nickname: online.opponentNickname ?? "" })}</p>

      {online.canClaimTimeout && !online.gameOverInfo && (
        <div className={styles.banner}>
          {t("online.claimTimeoutHint")}{" "}
          <RetroButton size="small" onClick={online.claimTimeout}>
            {t("online.claimTimeoutButton")}
          </RetroButton>
        </div>
      )}

      <GameBoardPanel game={{ ...online, state: online.state }} showResign={!online.gameOverInfo} showReset={false} />

      <ResultModal
        open={!!online.gameOverInfo}
        outcome={outcome}
        movesPlayed={online.state.history.length}
        resultKind={(online.gameOverInfo?.resultKind as ResultKind) ?? undefined}
        onViewKifu={online.roomId ? () => navigate(`/replay/${online.roomId}`) : undefined}
        onExit={() => navigate("/play")}
      />
    </PageContainer>
  );
}
