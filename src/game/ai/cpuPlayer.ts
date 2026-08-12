// CPU opponent abstraction. Every engine here only ever selects from
// getLegalMoves()/findBestMove() (which itself only searches legal moves), so no
// implementation can produce an illegal move. Swapping in a stronger engine (or
// eventually a USI engine over a worker/subprocess) only requires implementing
// `CpuEngine`; the game state / UI layers are unaware of the difference.

import type { GameState, Move } from "../types/shogi.js";
import { getLegalMoves } from "../rules/legalMoves.js";
import { findBestMove } from "./minimax.js";

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

/** Uniformly random legal move — no lookahead, no evaluation. The intentional
 * floor of the difficulty ladder. */
export class RandomCpuEngine implements CpuEngine {
  async chooseMove(state: GameState): Promise<Move | null> {
    const legal = getLegalMoves(state.board, state.hands, state.currentPlayer);
    if (legal.length === 0) return null;
    return pickPromotionPreferring(legal);
  }
}

/** Negamax + alpha-beta, iterative deepening within a wall-clock time budget.
 * Strength scales with the budget: more time -> deeper search -> stronger play. */
export class MinimaxCpuEngine implements CpuEngine {
  private readonly timeBudgetMs: number;

  constructor(timeBudgetMs: number) {
    this.timeBudgetMs = timeBudgetMs;
  }

  async chooseMove(state: GameState): Promise<Move | null> {
    return findBestMove(state.board, state.hands, state.currentPlayer, this.timeBudgetMs);
  }
}

const TIME_BUDGET_MS: Partial<Record<Difficulty, number>> = {
  easy: 120,
  normal: 350,
  hard: 700,
  expert: 1400,
};

export function createCpuEngine(difficulty: Difficulty): CpuEngine {
  const budget = TIME_BUDGET_MS[difficulty];
  if (!budget) return new RandomCpuEngine(); // "beginner"
  return new MinimaxCpuEngine(budget);
}
