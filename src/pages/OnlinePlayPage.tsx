import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageContainer } from "../components/common/PageContainer";
import { RetroButton } from "../components/common/RetroButton";
import { RequireAuth } from "../components/common/RequireAuth";
import { GameBoardPanel } from "../components/game/GameBoardPanel";
import { ResultModal } from "../components/game/ResultModal";
import { useOnlineShogiGame } from "../hooks/useOnlineShogiGame";
import { useI18n } from "../i18n/I18nContext";
import styles from "./OnlinePlayPage.module.css";

export function OnlinePlayPage() {
  return (
    <RequireAuth>
      <OnlinePlaySessionHost />
    </RequireAuth>
  );
}

function OnlinePlaySessionHost() {
  const [connectionKey, setConnectionKey] = useState(0);
  return <OnlinePlaySession key={connectionKey} onReconnect={() => setConnectionKey((k) => k + 1)} />;
}

function OnlinePlaySession({ onReconnect }: { onReconnect: () => void }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const online = useOnlineShogiGame();
  const joinedRef = useRef(false);

  useEffect(() => {
    if (online.connectionStatus === "open" && !joinedRef.current) {
      joinedRef.current = true;
      online.joinQueue();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online.connectionStatus]);

  if (online.connectionStatus === "closed") {
    return (
      <PageContainer>
        <div className={styles.center}>
          <div className={styles.banner}>{t("online.connectionLostBody")}</div>
          <RetroButton variant="primary" onClick={onReconnect}>
            {t("online.reconnect")}
          </RetroButton>
        </div>
      </PageContainer>
    );
  }

  if (online.connectionStatus === "connecting") {
    return (
      <PageContainer>
        <div className={styles.center}>
          <div className={`${styles.spinnerText} ${styles.dots}`}>{t("online.connecting")}</div>
        </div>
      </PageContainer>
    );
  }

  if (!online.state) {
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

  const outcome = online.gameOverInfo ? (online.gameOverInfo.winner === online.color ? "win" : "loss") : null;

  return (
    <PageContainer>
      <h1>{t("online.title")}</h1>
      <p className={styles.matchedNotice}>{t("online.matchedWith", { nickname: online.opponentNickname ?? "" })}</p>
      {online.opponentDisconnected && !online.gameOverInfo && (
        <div className={styles.banner}>{t("online.opponentDisconnected")}</div>
      )}

      <GameBoardPanel
        game={{ ...online, state: online.state }}
        showResign={!online.gameOverInfo}
        showReset={false}
      />

      <ResultModal
        open={!!online.gameOverInfo}
        outcome={outcome}
        movesPlayed={online.state.history.length}
        resultKind={online.gameOverInfo?.resultKind}
        onViewKifu={online.roomId ? () => navigate(`/replay/${online.roomId}`) : undefined}
        onExit={() => navigate("/play")}
      />
    </PageContainer>
  );
}
