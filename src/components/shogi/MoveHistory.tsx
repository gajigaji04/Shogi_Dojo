import type { HistoryEntry } from "../../game/types/shogi";
import { useI18n } from "../../i18n/I18nContext";
import styles from "./MoveHistory.module.css";

interface MoveHistoryProps {
  history: HistoryEntry[];
  /** -1 means "starting position", otherwise an index into `history`. */
  currentIndex?: number;
  onSelect?: (index: number) => void;
}

export function MoveHistory({ history, currentIndex, onSelect }: MoveHistoryProps) {
  const { t } = useI18n();
  const activeIndex = currentIndex ?? history.length - 1;

  return (
    <div className={styles.wrap}>
      <div className={styles.title}>{t("game.moveHistory")}</div>
      {history.length === 0 ? (
        <div className={styles.empty}>—</div>
      ) : (
        <ol className={styles.list}>
          {history.map((entry, i) => (
            <li key={i}>
              <button
                type="button"
                className={[styles.row, i === activeIndex ? styles.rowActive : ""].join(" ")}
                onClick={() => onSelect?.(i)}
              >
                <span className={styles.num}>{i + 1}.</span>
                <span>{entry.notation}</span>
                {entry.isCheck && <span aria-hidden="true">＋</span>}
              </button>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
