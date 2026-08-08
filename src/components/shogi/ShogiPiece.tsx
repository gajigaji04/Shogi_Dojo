import type { CSSProperties } from "react";
import type { PieceType, Player } from "../../game/types/shogi";
import { isPromoted } from "../../game/types/shogi";
import { pieceKanji } from "../../game/notation/kifu";
import { useI18n } from "../../i18n/I18nContext";
import styles from "./ShogiPiece.module.css";

interface ShogiPieceProps {
  type: PieceType;
  owner: Player;
  size?: number;
}

export function ShogiPiece({ type, owner, size }: ShogiPieceProps) {
  const { t } = useI18n();
  const glyph = pieceKanji(type, owner);
  const nameKey = type === "OU" ? (owner === "sente" ? "piece.OU_sente" : "piece.OU_gote") : `piece.${type}`;
  const style = size ? ({ "--piece-size": `${size}px` } as CSSProperties) : undefined;

  return (
    <div
      className={[styles.piece, owner === "gote" ? styles.gote : "", isPromoted(type) ? styles.promoted : ""]
        .filter(Boolean)
        .join(" ")}
      style={style}
      data-multichar={glyph.length > 1}
      role="img"
      aria-label={t(nameKey)}
      title={t(nameKey)}
    >
      <span aria-hidden="true">{glyph}</span>
    </div>
  );
}
