import { useState } from "react";
import type { Board, BasePieceType, Position } from "../../game/types/shogi";
import { pseudoLegalMoves } from "../../game/rules/pieceMovement";
import { structurallyLegalDropSquares } from "../../game/rules/drops";
import { ShogiBoard } from "../shogi/ShogiBoard";
import { CapturedPieces } from "../shogi/CapturedPieces";
import { RetroButton } from "../common/RetroButton";
import { useI18n } from "../../i18n/I18nContext";

const FU_START: Position = { row: 4, col: 4 };
const GI_START: Position = { row: 3, col: 4 };

function initialBoard(): Board {
  const board: Board = Array.from({ length: 9 }, () => Array<null>(9).fill(null));
  board[FU_START.row][FU_START.col] = { type: "FU", owner: "sente" };
  board[GI_START.row][GI_START.col] = { type: "GI", owner: "gote" };
  return board;
}

export function DropDemo() {
  const { t } = useI18n();
  const [board, setBoard] = useState<Board>(initialBoard);
  const [fuPos, setFuPos] = useState<Position | null>(FU_START);
  const [selected, setSelected] = useState<Position | null>(null);
  const [hand, setHand] = useState(0);
  const [dropSelected, setDropSelected] = useState(false);

  const boardTargets = selected ? pseudoLegalMoves(board, selected) : [];
  const dropTargets = dropSelected ? structurallyLegalDropSquares(board, "GI" as BasePieceType, "sente") : [];

  function handleSquareClick(pos: Position) {
    if (dropSelected) {
      if (!dropTargets.some((t) => t.row === pos.row && t.col === pos.col)) return;
      const next = board.map((row) => row.slice());
      next[pos.row][pos.col] = { type: "GI", owner: "sente" };
      setBoard(next);
      setHand(0);
      setDropSelected(false);
      return;
    }
    if (selected) {
      if (boardTargets.some((t) => t.row === pos.row && t.col === pos.col)) {
        const next = board.map((row) => row.slice());
        const captured = next[pos.row][pos.col];
        next[pos.row][pos.col] = next[selected.row][selected.col];
        next[selected.row][selected.col] = null;
        setBoard(next);
        setFuPos(pos);
        setSelected(null);
        if (captured) setHand(1);
        return;
      }
      setSelected(null);
      return;
    }
    if (fuPos && pos.row === fuPos.row && pos.col === fuPos.col) setSelected(pos);
  }

  function reset() {
    setBoard(initialBoard());
    setFuPos(FU_START);
    setSelected(null);
    setHand(0);
    setDropSelected(false);
  }

  return (
    <div>
      <CapturedPieces
        hand={{ FU: 0, KY: 0, KE: 0, GI: hand, KI: 0, KA: 0, HI: 0 }}
        owner="sente"
        selected={dropSelected ? "GI" : null}
        onSelect={() => hand > 0 && setDropSelected((v) => !v)}
        interactive={hand > 0}
      />
      <ShogiBoard
        board={board}
        selected={selected}
        legalTargets={dropSelected ? dropTargets : boardTargets}
        onSquareClick={handleSquareClick}
      />
      <div style={{ marginTop: "12px" }}>
        <RetroButton size="small" onClick={reset}>
          {t("common.reset")}
        </RetroButton>
      </div>
    </div>
  );
}
