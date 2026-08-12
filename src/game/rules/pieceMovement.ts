// Pseudo-legal movement generation per piece type — does NOT check for self-check safety.
// "Pseudo-legal" here means: on the board, respecting blocking pieces and not capturing own pieces.

import { inBounds } from "../types/shogi.js";
import type { Board, PieceType, Player, Position } from "../types/shogi.js";

type Vector = [number, number];

/** Forward direction for a player: sente moves toward row 0, gote toward row 8. */
export function forwardDir(player: Player): number {
  return player === "sente" ? -1 : 1;
}

/** Single-step vectors (dr, dc) expressed relative to the player's forward direction. */
function steppingVectors(type: PieceType, dir: number): Vector[] {
  switch (type) {
    case "FU":
      return [[dir, 0]];
    case "KE":
      return [
        [2 * dir, -1],
        [2 * dir, 1],
      ];
    case "GI":
      return [
        [dir, -1],
        [dir, 0],
        [dir, 1],
        [-dir, -1],
        [-dir, 1],
      ];
    case "KI":
    case "TO":
    case "NY":
    case "NK":
    case "NG":
      return [
        [dir, -1],
        [dir, 0],
        [dir, 1],
        [0, -1],
        [0, 1],
        [-dir, 0],
      ];
    case "OU":
      return [
        [dir, -1],
        [dir, 0],
        [dir, 1],
        [0, -1],
        [0, 1],
        [-dir, -1],
        [-dir, 0],
        [-dir, 1],
      ];
    case "UM":
      // Promoted bishop: diagonal slide (handled separately) + orthogonal single step.
      return [
        [dir, 0],
        [-dir, 0],
        [0, -1],
        [0, 1],
      ];
    case "RY":
      // Promoted rook: orthogonal slide (handled separately) + diagonal single step.
      return [
        [dir, -1],
        [dir, 1],
        [-dir, -1],
        [-dir, 1],
      ];
    default:
      return [];
  }
}

/** Sliding directions (dr, dc), independent of player facing — diagonals/orthogonals are symmetric. */
function slidingVectors(type: PieceType, dir: number): Vector[] {
  switch (type) {
    case "KY":
      return [[dir, 0]];
    case "KA":
    case "UM":
      return [
        [1, 1],
        [1, -1],
        [-1, 1],
        [-1, -1],
      ];
    case "HI":
    case "RY":
      return [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ];
    default:
      return [];
  }
}

/** All pseudo-legal destination squares for the piece located at `from`. */
export function pseudoLegalMoves(board: Board, from: Position): Position[] {
  const piece = board[from.row][from.col];
  if (!piece) return [];
  const dir = forwardDir(piece.owner);
  const destinations: Position[] = [];

  for (const [dr, dc] of steppingVectors(piece.type, dir)) {
    const to: Position = { row: from.row + dr, col: from.col + dc };
    if (!inBounds(to)) continue;
    const target = board[to.row][to.col];
    if (!target || target.owner !== piece.owner) destinations.push(to);
  }

  for (const [dr, dc] of slidingVectors(piece.type, dir)) {
    let r = from.row + dr;
    let c = from.col + dc;
    while (inBounds({ row: r, col: c })) {
      const target = board[r][c];
      if (!target) {
        destinations.push({ row: r, col: c });
      } else {
        if (target.owner !== piece.owner) destinations.push({ row: r, col: c });
        break;
      }
      r += dr;
      c += dc;
    }
  }

  return destinations;
}

/** Whether the given player attacks `target` — used for check detection. Ignores whose turn it is. */
export function isSquareAttackedBy(board: Board, target: Position, attacker: Player): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const piece = board[row][col];
      if (!piece || piece.owner !== attacker) continue;
      const moves = pseudoLegalMoves(board, { row, col });
      if (moves.some((m) => m.row === target.row && m.col === target.col)) return true;
    }
  }
  return false;
}
