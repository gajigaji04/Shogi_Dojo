import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageContainer } from "../components/common/PageContainer";
import { RetroButton } from "../components/common/RetroButton";
import { DifficultySelect } from "../components/game/DifficultySelect";
import { GameBoardPanel } from "../components/game/GameBoardPanel";
import { ResultModal } from "../components/game/ResultModal";
import { useShogiGame } from "../hooks/useShogiGame";
import { createCpuEngine } from "../game/ai/cpuPlayer";
import type { Difficulty } from "../game/ai/cpuPlayer";
import { saveCompletedGame } from "../game/storage/gameStorage";
import { useI18n } from "../i18n/I18nContext";
import styles from "./CpuGamePage.module.css";

const CPU_PLAYER = "gote" as const;

export function CpuGamePage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [started, setStarted] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [cpuThinking, setCpuThinking] = useState(false);
  const [lastSavedId, setLastSavedId] = useState<string | null>(null);
  const game = useShogiGame();
  const engine = useMemo(() => createCpuEngine(difficulty), [difficulty]);
  const savedRef = useRef(false);

  useEffect(() => {
    if (!started || game.state.status !== "ongoing" || game.state.currentPlayer !== CPU_PLAYER) {
      setCpuThinking(false);
      return;
    }
    let cancelled = false;
    setCpuThinking(true);
    const timer = setTimeout(async () => {
      const move = await engine.chooseMove(game.state);
      if (!cancelled) {
        setCpuThinking(false);
        if (move) game.dispatch({ type: "MOVE", move });
      }
    }, 550);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, game.state, engine]);

  useEffect(() => {
    if (!started) return;
    if (game.state.status === "ongoing") {
      savedRef.current = false;
      return;
    }
    if (savedRef.current) return;
    savedRef.current = true;
    const record = saveCompletedGame({
      opponentLabel: t("common.cpu"),
      mode: "cpu",
      status: game.state.status,
      winner: game.state.winner,
      humanPlayer: "sente",
      history: game.state.history,
    });
    setLastSavedId(record.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, game.state.status]);

  function startGame() {
    game.reset();
    setLastSavedId(null);
    setStarted(true);
  }

  function backToSetup() {
    game.reset();
    setStarted(false);
    setLastSavedId(null);
  }

  if (!started) {
    return (
      <PageContainer>
        <div className={styles.setup}>
          <h1>{t("nav.playCpu")}</h1>
          <p style={{ color: "var(--ink-700)" }}>{t("game.difficulty")}</p>
          <DifficultySelect value={difficulty} onChange={setDifficulty} />
          <RetroButton variant="primary" onClick={startGame}>
            {t("common.start")}
          </RetroButton>
        </div>
      </PageContainer>
    );
  }

  const gameOver = game.state.status !== "ongoing";
  const outcome = !gameOver
    ? null
    : game.state.status === "sennichite"
      ? "draw"
      : game.state.winner === "sente"
        ? "win"
        : "loss";
  const resultKind =
    game.state.status === "checkmate" || game.state.status === "sennichite" || game.state.status === "perpetual_check"
      ? game.state.status
      : "resign";

  return (
    <PageContainer>
      <h1>{t("nav.playCpu")}</h1>

      <GameBoardPanel
        game={game}
        headerExtra={cpuThinking ? <span className={styles.thinking}>{t("game.cpuThinking")}</span> : undefined}
      />

      <ResultModal
        open={gameOver}
        outcome={outcome}
        movesPlayed={game.state.history.length}
        resultKind={resultKind}
        onViewKifu={lastSavedId ? () => navigate(`/replay/${lastSavedId}`) : undefined}
        onPlayAgain={startGame}
        onExit={backToSetup}
      />
    </PageContainer>
  );
}
