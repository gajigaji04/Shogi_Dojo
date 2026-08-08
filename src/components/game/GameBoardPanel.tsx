import type { ReactNode } from "react";
import { useState } from "react";
import { ShogiBoard } from "../shogi/ShogiBoard";
import { CapturedPieces } from "../shogi/CapturedPieces";
import { MoveHistory } from "../shogi/MoveHistory";
import { RetroButton } from "../common/RetroButton";
import { RetroDialog } from "../common/RetroDialog";
import { useI18n } from "../../i18n/I18nContext";
import { pieceKanji } from "../../game/notation/kifu";
import type { UseShogiGame } from "../../hooks/useShogiGame";
import styles from "./GameBoardPanel.module.css";

interface GameBoardPanelProps {
  game: UseShogiGame;
  headerExtra?: ReactNode;
  showResign?: boolean;
  showReset?: boolean;
  showHistory?: boolean;
  hint?: string;
}

export function GameBoardPanel({
  game,
  headerExtra,
  showResign = true,
  showReset = true,
  showHistory = true,
  hint,
}: GameBoardPanelProps) {
  const { t } = useI18n();
  const [resignConfirmOpen, setResignConfirmOpen] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const { state } = game;

  const statusText = (() => {
    if (state.status === "checkmate" && state.winner) {
      return `${t("game.checkmateNotice")} — ${t("game.winnerIs", { player: t(state.winner === "sente" ? "game.sente" : "game.gote") })}`;
    }
    if (state.status === "resigned" && state.winner) {
      return `${t("game.resigned")} — ${t("game.winnerIs", { player: t(state.winner === "sente" ? "game.sente" : "game.gote") })}`;
    }
    if (state.isCheck) return t("game.check");
    return t(state.currentPlayer === "sente" ? "game.turnSente" : "game.turnGote");
  })();

  return (
    <div className={styles.layout}>
      <div className={styles.boardColumn}>
        <div className={styles.statusBar}>
          <span className={state.isCheck && state.status === "ongoing" ? styles.statusCheck : undefined}>
            {statusText}
          </span>
          {headerExtra}
        </div>

        <CapturedPieces
          hand={state.hands.gote}
          owner="gote"
          selected={state.currentPlayer === "gote" ? game.selectedDrop : null}
          onSelect={state.currentPlayer === "gote" ? game.selectHandPiece : undefined}
          interactive={state.currentPlayer === "gote" && state.status === "ongoing"}
        />

        <div className={styles.boardScroll}>
          <ShogiBoard
            board={state.board}
            selected={game.selected}
            legalTargets={game.legalTargets}
            checkedKing={game.checkedKing}
            lastMoveTo={state.history[state.history.length - 1]?.move.to ?? null}
            onSquareClick={game.selectSquare}
            interactive={state.status === "ongoing"}
          />
        </div>

        <CapturedPieces
          hand={state.hands.sente}
          owner="sente"
          selected={state.currentPlayer === "sente" ? game.selectedDrop : null}
          onSelect={state.currentPlayer === "sente" ? game.selectHandPiece : undefined}
          interactive={state.currentPlayer === "sente" && state.status === "ongoing"}
        />

        {hint && <div className={styles.hint}>{hint}</div>}

        <div className={styles.controls}>
          {showReset && (
            <RetroButton onClick={() => setResetConfirmOpen(true)}>{t("common.reset")}</RetroButton>
          )}
          {showResign && state.status === "ongoing" && (
            <RetroButton onClick={() => setResignConfirmOpen(true)}>{t("common.resign")}</RetroButton>
          )}
        </div>
      </div>

      {showHistory && (
        <MoveHistory history={state.history} />
      )}

      <RetroDialog
        open={!!game.pendingPromotion}
        title={t("game.promoteQuestion")}
        onClose={() => game.resolvePromotion(false)}
        actions={
          <>
            <RetroButton variant="primary" onClick={() => game.resolvePromotion(true)}>
              {game.pendingPromotion && pieceKanji(game.pendingPromotion.piece)}
              {"→"}
              {game.pendingPromotion && t("game.promoteYes")}
            </RetroButton>
            <RetroButton onClick={() => game.resolvePromotion(false)}>{t("game.promoteNo")}</RetroButton>
          </>
        }
      />

      <RetroDialog
        open={resignConfirmOpen}
        title={t("game.resignConfirmTitle")}
        onClose={() => setResignConfirmOpen(false)}
        actions={
          <>
            <RetroButton
              variant="primary"
              onClick={() => {
                game.resign();
                setResignConfirmOpen(false);
              }}
            >
              {t("common.resign")}
            </RetroButton>
            <RetroButton onClick={() => setResignConfirmOpen(false)}>{t("common.cancel")}</RetroButton>
          </>
        }
      >
        {t("game.resignConfirmBody")}
      </RetroDialog>

      <RetroDialog
        open={resetConfirmOpen}
        title={t("game.resetConfirmTitle")}
        onClose={() => setResetConfirmOpen(false)}
        actions={
          <>
            <RetroButton
              variant="primary"
              onClick={() => {
                game.reset();
                setResetConfirmOpen(false);
              }}
            >
              {t("common.reset")}
            </RetroButton>
            <RetroButton onClick={() => setResetConfirmOpen(false)}>{t("common.cancel")}</RetroButton>
          </>
        }
      >
        {t("game.resetConfirmBody")}
      </RetroDialog>
    </div>
  );
}
