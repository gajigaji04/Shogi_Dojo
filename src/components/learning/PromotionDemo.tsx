import { useState } from "react";
import type { Board, PieceType, Position } from "../../game/types/shogi";
import { pseudoLegalMoves } from "../../game/rules/pieceMovement";
import { isPromotionEligible, promote } from "../../game/rules/promotion";
import { ShogiBoard } from "../shogi/ShogiBoard";
import { RetroButton } from "../common/RetroButton";
import { RetroDialog } from "../common/RetroDialog";
import { useI18n } from "../../i18n/I18nContext";

const START: Position = { row: 3, col: 4 };

function buildBoard(pos: Position, type: PieceType): Board {
  const board: Board = Array.from({ length: 9 }, () => Array<null>(9).fill(null));
  board[pos.row][pos.col] = { type, owner: "sente" };
  return board;
}

export function PromotionDemo() {
  const { t } = useI18n();
  const [pos, setPos] = useState<Position>(START);
  const [pieceType, setPieceType] = useState<PieceType>("FU");
  const [selected, setSelected] = useState(false);
  const [pending, setPending] = useState<Position | null>(null);

  const board = buildBoard(pos, pieceType);
  const targets = selected ? pseudoLegalMoves(board, pos) : [];

  function handleClick(clicked: Position) {
    if (clicked.row === pos.row && clicked.col === pos.col) {
      setSelected((s) => !s);
      return;
    }
    if (!selected || !targets.some((t) => t.row === clicked.row && t.col === clicked.col)) return;
    setSelected(false);
    if (isPromotionEligible(pieceType, "sente", pos.row, clicked.row)) {
      setPending(clicked);
    } else {
      setPos(clicked);
    }
  }

  function resolve(doPromote: boolean) {
    if (!pending) return;
    setPos(pending);
    if (doPromote) setPieceType((current) => promote(current));
    setPending(null);
  }

  function reset() {
    setPos(START);
    setPieceType("FU");
    setSelected(false);
    setPending(null);
  }

  return (
    <div>
      <ShogiBoard board={board} selected={selected ? pos : null} legalTargets={targets} onSquareClick={handleClick} />
      <div style={{ marginTop: "12px" }}>
        <RetroButton size="small" onClick={reset}>
          {t("common.reset")}
        </RetroButton>
      </div>
      <RetroDialog
        open={!!pending}
        title={t("game.promoteQuestion")}
        onClose={() => resolve(false)}
        actions={
          <>
            <RetroButton variant="primary" onClick={() => resolve(true)}>
              {t("game.promoteYes")}
            </RetroButton>
            <RetroButton onClick={() => resolve(false)}>{t("game.promoteNo")}</RetroButton>
          </>
        }
      />
    </div>
  );
}
