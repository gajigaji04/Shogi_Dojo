import type { BasePieceType, Board, Player, Position } from "../types/shogi.js";
import { isPromotionForced } from "./promotion.js";

/** Two-pawns-on-a-file (二歩): a player may not drop an unpromoted pawn on a file that
 * already contains one of their own unpromoted pawns. Promoted pawns (と金) don't count. */
function violatesNifu(board: Board, col: number, player: Player): boolean {
  for (let row = 0; row < 9; row++) {
    const piece = board[row][col];
    if (piece && piece.owner === player && piece.type === "FU") return true;
  }
  return false;
}

/** Structural drop legality: empty square, no nifu, and not a "no legal move" square
 * (行き所のない駒 — e.g. a pawn on the last rank). Does NOT check uchi-fu-zume or
 * self-check safety; those are applied by the legalMoves layer. */
export function structurallyLegalDropSquares(board: Board, piece: BasePieceType, player: Player): Position[] {
  const squares: Position[] = [];
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col]) continue;
      if (isPromotionForced(piece, player, row)) continue; // no legal move if dropped here, unpromoted
      if (piece === "FU" && violatesNifu(board, col, player)) continue;
      squares.push({ row, col });
    }
  }
  return squares;
}
