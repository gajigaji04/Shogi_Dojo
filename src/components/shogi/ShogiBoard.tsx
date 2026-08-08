import type { Board, Piece, Position } from "../../game/types/shogi";
import { ZENKAKU_DIGITS, KANJI_NUMERALS } from "../../game/notation/kifu";
import { ShogiPiece } from "./ShogiPiece";
import { useI18n } from "../../i18n/I18nContext";
import styles from "./ShogiBoard.module.css";

interface ShogiBoardProps {
  board: Board;
  selected?: Position | null;
  legalTargets?: Position[];
  lastMoveTo?: Position | null;
  checkedKing?: Position | null;
  onSquareClick?: (pos: Position) => void;
  interactive?: boolean;
}

function samePos(a: Position | null | undefined, b: Position): boolean {
  return !!a && a.row === b.row && a.col === b.col;
}

function squareLabel(row: number, col: number, piece: Piece | null): string {
  const file = 9 - col;
  const rank = row + 1;
  return `${file}${KANJI_NUMERALS[rank - 1]}${piece ? ` ${piece.type} ${piece.owner}` : ""}`;
}

export function ShogiBoard({
  board,
  selected = null,
  legalTargets = [],
  lastMoveTo = null,
  checkedKing = null,
  onSquareClick,
  interactive = true,
}: ShogiBoardProps) {
  const { t } = useI18n();
  const cells: { row: number; col: number; piece: Piece | null }[] = [];
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) cells.push({ row, col, piece: board[row][col] });
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.coordsRow} aria-hidden="true">
        {Array.from({ length: 9 }, (_, col) => (
          <div key={col} className={styles.fileLabel}>
            {ZENKAKU_DIGITS[9 - col - 1]}
          </div>
        ))}
      </div>
      <div className={styles.boardArea}>
        <div className={styles.rankLabels} aria-hidden="true">
          {Array.from({ length: 9 }, (_, row) => (
            <div key={row} className={styles.rankLabel}>
              {KANJI_NUMERALS[row]}
            </div>
          ))}
        </div>
        <div className={styles.board} role="grid" aria-label={t("common.aboutShogi")}>
          {cells.map(({ row, col, piece }) => {
            const p: Position = { row, col };
            const isTarget = legalTargets.some((target) => target.row === row && target.col === col);
            const classes = [
              styles.cell,
              samePos(selected, p) ? styles.selected : "",
              samePos(checkedKing, p) ? styles.checkedKing : "",
              samePos(lastMoveTo, p) ? styles.lastMove : "",
              isTarget ? (piece ? styles.capture : styles.movable) : "",
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <button
                key={`${row}-${col}`}
                type="button"
                role="gridcell"
                className={classes}
                disabled={!interactive}
                aria-label={squareLabel(row, col, piece)}
                onClick={() => onSquareClick?.(p)}
              >
                {piece && <ShogiPiece type={piece.type} owner={piece.owner} />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
