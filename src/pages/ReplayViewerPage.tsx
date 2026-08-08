import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PageContainer } from "../components/common/PageContainer";
import { RetroButton } from "../components/common/RetroButton";
import { ShogiBoard } from "../components/shogi/ShogiBoard";
import { CapturedPieces } from "../components/shogi/CapturedPieces";
import { MoveHistory } from "../components/shogi/MoveHistory";
import { ReplayControls } from "../components/shogi/ReplayControls";
import { getGame } from "../game/storage/gameStorage";
import { useReplayPlayer } from "../hooks/useReplayPlayer";
import { findKing } from "../game/rules/check";
import { api, ApiError } from "../api/client";
import type { HistoryEntry } from "../game/types/shogi";
import { useI18n } from "../i18n/I18nContext";
import styles from "../components/game/GameBoardPanel.module.css";

interface ReplayableGame {
  date: string;
  opponentLabel: string;
  history: HistoryEntry[];
}

interface RemoteGameResponse {
  game: {
    startedAt: string;
    opponent: string;
    history: HistoryEntry[];
  };
}

export function ReplayViewerPage() {
  const { id } = useParams<{ id: string }>();
  const { t, locale } = useI18n();
  const [record, setRecord] = useState<ReplayableGame | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setRecord(undefined);
    setError(null);

    const local = getGame(id);
    if (local) {
      setRecord({ date: local.date, opponentLabel: local.opponentLabel, history: local.history });
      return;
    }

    api
      .get<RemoteGameResponse>(`/api/games/${id}`)
      .then((res) => {
        setRecord({ date: res.game.startedAt, opponentLabel: res.game.opponent, history: res.game.history });
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : t("replay.noGames"));
        setRecord(null);
      });
  }, [id, t]);

  const player = useReplayPlayer(record?.history ?? []);

  if (record === undefined) {
    return (
      <PageContainer>
        <h1>{t("replay.title")}</h1>
        <p>{t("loading.game")}</p>
      </PageContainer>
    );
  }

  if (!record) {
    return (
      <PageContainer>
        <h1>{t("replay.title")}</h1>
        <p>{error ?? t("replay.noGames")}</p>
        <Link to="/replay">
          <RetroButton>{t("common.back")}</RetroButton>
        </Link>
      </PageContainer>
    );
  }

  const currentEntry = player.currentIndex >= 0 ? record.history[player.currentIndex] : null;
  const checkedKing = currentEntry?.isCheck
    ? findKing(currentEntry.boardAfter, currentEntry.currentPlayerAfter)
    : null;

  return (
    <PageContainer>
      <h1>{t("replay.title")}</h1>
      <p style={{ color: "var(--ink-500)", fontFamily: "var(--mono)", fontSize: "var(--fs-small)" }}>
        {new Date(record.date).toLocaleString(locale)} — {t("replay.opponent")}: {record.opponentLabel}
      </p>

      <div className={styles.layout}>
        <div className={styles.boardColumn}>
          <CapturedPieces hand={player.hands.gote} owner="gote" />
          <div className={styles.boardScroll}>
            <ShogiBoard
              board={player.board}
              interactive={false}
              lastMoveTo={currentEntry?.move.to ?? null}
              checkedKing={checkedKing}
            />
          </div>
          <CapturedPieces hand={player.hands.sente} owner="sente" />
          <ReplayControls
            currentIndex={player.currentIndex}
            totalMoves={player.totalMoves}
            isPlaying={player.isPlaying}
            speed={player.speed}
            onFirst={player.goFirst}
            onPrev={player.goPrev}
            onNext={player.goNext}
            onLast={player.goLast}
            onTogglePlay={player.togglePlay}
            onSpeedChange={player.setSpeed}
          />
        </div>
        <MoveHistory history={record.history} currentIndex={player.currentIndex} onSelect={player.goTo} />
      </div>
    </PageContainer>
  );
}
