import type { Board, Hands, Piece, PieceType, Player, Position } from "../types/shogi";
import { emptyHands } from "../rules/boardOps";

export function emptyBoard(): Board {
  return Array.from({ length: 9 }, () => Array<null>(9).fill(null));
}

export function place(board: Board, pos: Position, type: PieceType, owner: Player): Piece {
  const piece: Piece = { type, owner };
  board[pos.row][pos.col] = piece;
  return piece;
}

export function pos(row: number, col: number): Position {
  return { row, col };
}

export function hands(overrides?: Partial<{ sente: Partial<Hands["sente"]>; gote: Partial<Hands["gote"]> }>): Hands {
  const base = emptyHands();
  if (overrides?.sente) Object.assign(base.sente, overrides.sente);
  if (overrides?.gote) Object.assign(base.gote, overrides.gote);
  return base;
}

export function destinations(moves: { to: Position }[]): string[] {
  return moves.map((m) => `${m.to.row},${m.to.col}`).sort();
}

export function positionStrings(positions: Position[]): string[] {
  return positions.map((p) => `${p.row},${p.col}`).sort();
}
