import { useState } from "react";
import type { PieceType, Player, Position } from "../../game/types/shogi";
import { pseudoLegalMoves } from "../../game/rules/pieceMovement";
import { ShogiBoard } from "../shogi/ShogiBoard";

interface PieceMoveDemoProps {
  type: PieceType;
  owner?: Player;
}

const START: Position = { row: 4, col: 4 };

export function PieceMoveDemo({ type, owner = "sente" }: PieceMoveDemoProps) {
  const [pos, setPos] = useState<Position>(START);
  const [selected, setSelected] = useState(false);

  const board = Array.from({ length: 9 }, (_, row) =>
    Array.from({ length: 9 }, (_, col) => (row === pos.row && col === pos.col ? { type, owner } : null))
  );

  const targets = selected ? pseudoLegalMoves(board, pos) : [];

  function handleClick(clicked: Position) {
    if (clicked.row === pos.row && clicked.col === pos.col) {
      setSelected((s) => !s);
      return;
    }
    if (selected && targets.some((t) => t.row === clicked.row && t.col === clicked.col)) {
      setPos(clicked);
      setSelected(false);
      return;
    }
  }

  return (
    <ShogiBoard board={board} selected={selected ? pos : null} legalTargets={targets} onSquareClick={handleClick} />
  );
}
