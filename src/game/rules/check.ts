import { opponentOf } from "../types/shogi";
import type { Board, Player } from "../types/shogi";
import { isSquareAttackedBy } from "./pieceMovement";

export function findKing(board: Board, player: Player): { row: number; col: number } | null {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const piece = board[row][col];
      if (piece && piece.owner === player && piece.type === "OU") return { row, col };
    }
  }
  return null;
}

/** Is `player`'s king currently attacked by the opponent? */
export function isInCheck(board: Board, player: Player): boolean {
  const king = findKing(board, player);
  if (!king) return false;
  return isSquareAttackedBy(board, king, opponentOf(player));
}
