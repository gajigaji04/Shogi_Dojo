// Static position evaluation, from `player`'s point of view (positive = good for
// `player`). Material dominates; king safety and pawn advancement are small
// tie-breakers layered on top so the CPU doesn't shuffle aimlessly.

import { BASE_PIECE_TYPES, opponentOf } from "../types/shogi.js";
import type { Board, Hands, PieceType, Player } from "../types/shogi.js";

export const PIECE_VALUE: Record<PieceType, number> = {
  FU: 100,
  KY: 300,
  KE: 400,
  GI: 500,
  KI: 600,
  KA: 800,
  HI: 1000,
  OU: 100_000,
  TO: 500,
  NY: 500,
  NK: 500,
  NG: 500,
  UM: 1050,
  RY: 1200,
};

const ADJACENT: [number, number][] = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1], [0, 1],
  [1, -1], [1, 0], [1, 1],
];

function findKingPos(board: Board, player: Player): { row: number; col: number } | null {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const p = board[row][col];
      if (p && p.owner === player && p.type === "OU") return { row, col };
    }
  }
  return null;
}

function kingSafety(board: Board, player: Player): number {
  const king = findKingPos(board, player);
  if (!king) return 0;
  let defenders = 0;
  let attackers = 0;
  for (const [dr, dc] of ADJACENT) {
    const r = king.row + dr;
    const c = king.col + dc;
    if (r < 0 || r > 8 || c < 0 || c > 8) continue;
    const sq = board[r][c];
    if (!sq) continue;
    if (sq.owner === player) defenders++;
    else attackers++;
  }
  return defenders * 12 - attackers * 18;
}

/** Small bonus for pawns pushed toward the enemy camp, so the engine develops
 * instead of shuffling back-rank pieces forever. */
function advancement(board: Board, player: Player): number {
  let bonus = 0;
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const sq = board[row][col];
      if (!sq || sq.owner !== player || sq.type !== "FU") continue;
      const rowsAdvanced = player === "sente" ? 8 - row : row;
      bonus += rowsAdvanced * 2;
    }
  }
  return bonus;
}

export function evaluate(board: Board, hands: Hands, player: Player): number {
  const opponent = opponentOf(player);
  let score = 0;

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const sq = board[row][col];
      if (!sq) continue;
      const value = PIECE_VALUE[sq.type];
      score += sq.owner === player ? value : -value;
    }
  }

  for (const t of BASE_PIECE_TYPES) {
    score += hands[player][t] * PIECE_VALUE[t];
    score -= hands[opponent][t] * PIECE_VALUE[t];
  }

  score += kingSafety(board, player) - kingSafety(board, opponent);
  score += advancement(board, player) - advancement(board, opponent);

  return score;
}
