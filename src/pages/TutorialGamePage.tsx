import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageContainer } from "../components/common/PageContainer";
import { RetroButton } from "../components/common/RetroButton";
import { GameBoardPanel } from "../components/game/GameBoardPanel";
import { useShogiGame } from "../hooks/useShogiGame";
import { createTutorialGameState } from "../game/state/tutorialState";
import type { ShogiGameController } from "../hooks/shogiGameController";
import type { BasePieceType, Position } from "../game/types/shogi";
import { useI18n } from "../i18n/I18nContext";
import styles from "./TutorialGamePage.module.css";

type Stage =
  | { kind: "move"; from: Position; to: Position; instructionKey: string }
  | { kind: "drop"; dropPiece: BasePieceType; to: Position; instructionKey: string };

const STAGES: Stage[] = [
  { kind: "move", from: { row: 6, col: 4 }, to: { row: 5, col: 4 }, instructionKey: "learn.tutorialSteps.step1" },
  { kind: "move", from: { row: 5, col: 4 }, to: { row: 4, col: 4 }, instructionKey: "learn.tutorialSteps.step2" },
  { kind: "drop", dropPiece: "FU", to: { row: 4, col: 2 }, instructionKey: "learn.tutorialSteps.step3" },
  { kind: "move", from: { row: 3, col: 3 }, to: { row: 2, col: 3 }, instructionKey: "learn.tutorialSteps.step4" },
  { kind: "move", from: { row: 2, col: 3 }, to: { row: 1, col: 3 }, instructionKey: "learn.tutorialSteps.step5" },
];

const SCRIPTED_GOTE_REPLIES: { from: Position; to: Position }[] = [
  { from: { row: 0, col: 8 }, to: { row: 1, col: 8 } },
  { from: { row: 1, col: 8 }, to: { row: 2, col: 8 } },
  { from: { row: 2, col: 8 }, to: { row: 3, col: 8 } },
  { from: { row: 3, col: 8 }, to: { row: 4, col: 8 } },
];

const FINAL_LENGTH = STAGES.length * 2 - 1; // 5 learner moves + 4 scripted replies = 9

function samePos(a: Position | null, b: Position): boolean {
  return !!a && a.row === b.row && a.col === b.col;
}

export function TutorialGamePage() {
  const [restartKey, setRestartKey] = useState(0);
  return <TutorialSession key={restartKey} onRestart={() => setRestartKey((k) => k + 1)} />;
}

function TutorialSession({ onRestart }: { onRestart: () => void }) {
  const { t } = useI18n();
  const game = useShogiGame(createTutorialGameState);
  const len = game.state.history.length;
  const done = len >= FINAL_LENGTH;
  const stageIndex = done ? STAGES.length - 1 : Math.floor(len / 2);
  const stage = STAGES[stageIndex];
  const waitingForOpponent = !done && len % 2 === 1;

  useEffect(() => {
    if (!waitingForOpponent) return;
    const replyIndex = (len - 1) / 2;
    const reply = SCRIPTED_GOTE_REPLIES[replyIndex];
    if (!reply) return;
    const timer = setTimeout(() => {
      game.dispatch({
        type: "MOVE",
        move: { kind: "move", player: "gote", from: reply.from, to: reply.to, piece: "KY", promote: false },
      });
    }, 550);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waitingForOpponent, len]);

  function guardedSelectSquare(pos: Position) {
    if (waitingForOpponent || done) return;
    if (stage.kind === "move") {
      if (!game.selected) {
        if (samePos(stage.from, pos)) game.selectSquare(pos);
        return;
      }
      if (samePos(game.selected, pos) || samePos(stage.to, pos)) game.selectSquare(pos);
      return;
    }
    // drop stage
    if (game.selectedDrop) {
      if (samePos(stage.to, pos)) game.selectSquare(pos);
    }
  }

  function guardedSelectHandPiece(type: BasePieceType) {
    if (waitingForOpponent || done) return;
    if (stage.kind === "drop" && type === stage.dropPiece) game.selectHandPiece(type);
  }

  const hintSelected =
    !done && !waitingForOpponent && stage.kind === "move" && !game.selected ? stage.from : game.selected;

  const guardedGame: ShogiGameController = {
    state: game.state,
    selected: hintSelected,
    selectedDrop: game.selectedDrop,
    legalTargets: game.legalTargets,
    checkedKing: game.checkedKing,
    pendingPromotion: game.pendingPromotion,
    selectSquare: guardedSelectSquare,
    selectHandPiece: guardedSelectHandPiece,
    resolvePromotion: game.resolvePromotion,
    resign: () => {},
  };

  return (
    <PageContainer>
      <div className={styles.header}>
        <h1 style={{ margin: 0 }}>{t("learn.tutorialTitle")}</h1>
        <div className={styles.progressDots}>
          {STAGES.map((_, i) => (
            <span
              key={i}
              className={[styles.dot, i < stageIndex || done ? styles.dotDone : i === stageIndex ? styles.dotActive : ""]
                .filter(Boolean)
                .join(" ")}
            />
          ))}
        </div>
      </div>

      {done ? (
        <div className={styles.doneWrap}>
          <p style={{ fontFamily: "var(--serif)", fontSize: "var(--fs-h2)" }}>{t("learn.tutorialDoneTitle")}</p>
          <p style={{ color: "var(--ink-700)", marginBottom: "24px" }}>{t("learn.tutorialDoneBody")}</p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link to="/play/cpu">
              <RetroButton variant="primary">{t("nav.playCpu")}</RetroButton>
            </Link>
            <RetroButton onClick={onRestart}>{t("learn.tutorialRestart")}</RetroButton>
          </div>
        </div>
      ) : (
        <>
          <div className={styles.instruction}>
            {waitingForOpponent ? <span className={styles.waiting}>{t("learn.tutorialWaiting")}</span> : t(stage.instructionKey)}
          </div>
          <GameBoardPanel game={guardedGame} showResign={false} showReset={false} />
          <div style={{ marginTop: "16px", textAlign: "center" }}>
            <RetroButton size="small" onClick={onRestart}>
              {t("learn.tutorialRestart")}
            </RetroButton>
          </div>
        </>
      )}
    </PageContainer>
  );
}
