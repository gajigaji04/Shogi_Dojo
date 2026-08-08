// CPU opponent abstraction. The MVP implementation picks a uniformly random legal
// move — it never considers an illegal move because it only ever selects from
// getLegalMoves(). Swapping in a stronger engine (minimax, or eventually a USI
// engine over a worker/subprocess) only requires implementing `CpuEngine`; the
// game state / UI layers are unaware of the difference.

import type { GameState, Move } from "../types/shogi";
import { getLegalMoves } from "../rules/legalMoves";

export type Difficulty = "beginner" | "easy" | "normal" | "hard" | "expert";

export interface CpuEngine {
  chooseMove(state: GameState): Promise<Move | null>;
}

function pickPromotionPreferring<T extends Move>(moves: T[]): T {
  // Mild heuristic even at random difficulty: prefer promoting when a promotion
  // variant of the same move exists, so games don't stall with under-powered pieces.
  const promoting = moves.filter((m) => m.kind === "move" && m.promote);
  const pool = promoting.length > 0 && Math.random() < 0.7 ? promoting : moves;
  return pool[Math.floor(Math.random() * pool.length)];
}

export class RandomCpuEngine implements CpuEngine {
  async chooseMove(state: GameState): Promise<Move | null> {
    const legal = getLegalMoves(state.board, state.hands, state.currentPlayer);
    if (legal.length === 0) return null;
    return pickPromotionPreferring(legal);
  }
}

/** Difficulty currently only affects "thinking" pacing in the UI; the engine
 * implementation is where real strength differences would be introduced later
 * (e.g. shallow minimax for "hard", full USI engine for "expert"). */
export function createCpuEngine(_difficulty: Difficulty): CpuEngine {
  return new RandomCpuEngine();
}
