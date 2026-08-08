import { BASE_PIECE_TYPES } from "../../game/types/shogi";
import type { BasePieceType, Hand, Player } from "../../game/types/shogi";
import { useI18n } from "../../i18n/I18nContext";
import { ShogiPiece } from "./ShogiPiece";
import styles from "./CapturedPieces.module.css";

interface CapturedPiecesProps {
  hand: Hand;
  owner: Player;
  selected?: BasePieceType | null;
  onSelect?: (type: BasePieceType) => void;
  interactive?: boolean;
}

export function CapturedPieces({ hand, owner, selected = null, onSelect, interactive = false }: CapturedPiecesProps) {
  const { t } = useI18n();
  const held = BASE_PIECE_TYPES.filter((type) => hand[type] > 0);

  return (
    <div className={styles.wrap}>
      <span className={styles.owner}>
        {t("game.capturedPieces")} — {t(owner === "sente" ? "game.sente" : "game.gote")}
      </span>
      {held.length === 0 && <span className={styles.empty}>—</span>}
      {held.map((type) => (
        <button
          key={type}
          type="button"
          className={[styles.piece, selected === type ? styles.selected : ""].join(" ")}
          disabled={!interactive}
          aria-pressed={selected === type}
          onClick={() => onSelect?.(type)}
        >
          <ShogiPiece type={type} owner={owner} size={30} />
          <span className={styles.count}>×{hand[type]}</span>
        </button>
      ))}
    </div>
  );
}
