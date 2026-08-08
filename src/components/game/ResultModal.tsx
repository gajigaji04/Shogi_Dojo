import { useEffect } from "react";
import { RetroButton } from "../common/RetroButton";
import { useI18n } from "../../i18n/I18nContext";
import styles from "./ResultModal.module.css";

export type ResultKind = "checkmate" | "resign" | "disconnect";

interface ResultModalProps {
  open: boolean;
  outcome: "win" | "loss" | null;
  movesPlayed: number;
  resultKind?: ResultKind;
  onViewKifu?: () => void;
  onExit: () => void;
  onPlayAgain?: () => void;
}

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

  const reasonKey = resultKind === "resign" ? "result.byResign" : resultKind === "disconnect" ? "result.byDisconnect" : "result.byCheckmate";

  return (
    <div className={styles.overlay}>
      <div className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="result-headline">
        <div className={styles.jp}>{outcome === "win" ? "勝ち！" : "負け"}</div>
        <div id="result-headline" className={`${styles.headline} ${outcome === "win" ? styles.win : styles.lose}`}>
          {outcome === "win" ? t("result.youWin") : t("result.youLose")}
        </div>
        <div className={styles.meta}>
          <div>{t("result.movesPlayed", { n: movesPlayed })}</div>
          {resultKind && (
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
