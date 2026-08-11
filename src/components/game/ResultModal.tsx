import { useEffect } from "react";
import { RetroButton } from "../common/RetroButton";
import { useI18n } from "../../i18n/I18nContext";
import styles from "./ResultModal.module.css";

export type ResultKind = "checkmate" | "resign" | "disconnect" | "sennichite" | "perpetual_check" | "timeout";
export type Outcome = "win" | "loss" | "draw";

interface ResultModalProps {
  open: boolean;
  outcome: Outcome | null;
  movesPlayed: number;
  resultKind?: ResultKind;
  onViewKifu?: () => void;
  onExit: () => void;
  onPlayAgain?: () => void;
}

const REASON_KEYS: Record<ResultKind, string> = {
  checkmate: "result.byCheckmate",
  resign: "result.byResign",
  disconnect: "result.byDisconnect",
  sennichite: "result.bySennichite",
  perpetual_check: "result.byPerpetualCheck",
  timeout: "result.byTimeout",
};

const HEADLINE_JP: Record<Outcome, string> = { win: "勝ち！", loss: "負け", draw: "引き分け" };
const HEADLINE_KEY: Record<Outcome, string> = { win: "result.youWin", loss: "result.youLose", draw: "result.youDraw" };

export function ResultModal({ open, outcome, movesPlayed, resultKind, onViewKifu, onExit, onPlayAgain }: ResultModalProps) {
  const { t } = useI18n();

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open || !outcome) return null;

  const reasonKey = resultKind ? REASON_KEYS[resultKind] : undefined;

  return (
    <div className={styles.overlay}>
      <div className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="result-headline">
        <div className={styles.jp}>{HEADLINE_JP[outcome]}</div>
        <div
          id="result-headline"
          className={`${styles.headline} ${outcome === "win" ? styles.win : outcome === "loss" ? styles.lose : ""}`}
        >
          {t(HEADLINE_KEY[outcome])}
        </div>
        <div className={styles.meta}>
          <div>{t("result.movesPlayed", { n: movesPlayed })}</div>
          {reasonKey && (
            <div>
              {t("result.gameEndedBy")}: {t(reasonKey)}
            </div>
          )}
        </div>
        <div className={styles.actions}>
          {onViewKifu && (
            <RetroButton variant="primary" onClick={onViewKifu}>
              {t("result.viewKifu")}
            </RetroButton>
          )}
          {onPlayAgain && <RetroButton onClick={onPlayAgain}>{t("result.playAgain")}</RetroButton>}
          <RetroButton onClick={onExit}>{t("result.exit")}</RetroButton>
        </div>
      </div>
    </div>
  );
}
