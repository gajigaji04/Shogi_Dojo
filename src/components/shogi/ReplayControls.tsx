import { RetroButton } from "../common/RetroButton";
import { useI18n } from "../../i18n/I18nContext";
import styles from "./ReplayControls.module.css";

interface ReplayControlsProps {
  currentIndex: number; // -1 = starting position
  totalMoves: number;
  isPlaying: boolean;
  speed: number;
  onFirst: () => void;
  onPrev: () => void;
  onNext: () => void;
  onLast: () => void;
  onTogglePlay: () => void;
  onSpeedChange: (speed: number) => void;
}

export function ReplayControls({
  currentIndex,
  totalMoves,
  isPlaying,
  speed,
  onFirst,
  onPrev,
  onNext,
  onLast,
  onTogglePlay,
  onSpeedChange,
}: ReplayControlsProps) {
  const { t } = useI18n();
  return (
    <div className={styles.bar}>
      <RetroButton size="small" onClick={onFirst} disabled={currentIndex === -1} aria-label={t("common.first")}>
        ⏮
      </RetroButton>
      <RetroButton size="small" onClick={onPrev} disabled={currentIndex === -1} aria-label={t("common.back")}>
        ◀
      </RetroButton>
      <RetroButton size="small" variant="primary" onClick={onTogglePlay} disabled={totalMoves === 0}>
        {isPlaying ? `⏸ ${t("common.pause")}` : `▶ ${t("common.play")}`}
      </RetroButton>
      <RetroButton size="small" onClick={onNext} disabled={currentIndex >= totalMoves - 1} aria-label={t("common.next")}>
        ▶
      </RetroButton>
      <RetroButton
        size="small"
        onClick={onLast}
        disabled={currentIndex >= totalMoves - 1}
        aria-label={t("common.last")}
      >
        ⏭
      </RetroButton>
      <span className={styles.moveLabel}>{t("replay.moveOf", { current: currentIndex + 1, total: totalMoves })}</span>
      <label className={styles.speedSelect}>
        {t("common.speed")}{" "}
        <select value={speed} onChange={(e) => onSpeedChange(Number(e.target.value))}>
          <option value={0.5}>0.5x</option>
          <option value={1}>1x</option>
          <option value={2}>2x</option>
          <option value={4}>4x</option>
        </select>
      </label>
    </div>
  );
}
