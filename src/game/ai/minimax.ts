// Negamax with alpha-beta pruning and iterative deepening, bounded by a wall-clock
// time budget rather than a fixed depth — shogi's branching factor (drops especially)
// makes a fixed depth unpredictable in cost, but a time box keeps the UI responsive
// regardless of position complexity, and simply searches deeper when it can.

import { opponentOf } from "../types/shogi";
import type { Board, Hands, Move, Player } from "../types/shogi";
import { getLegalMoves } from "../rules/legalMoves";
import { applyMoveToBoard } from "../rules/boardOps";
import { evaluate } from "./evaluate";

const MATE_SCORE = 1_000_000;
const MAX_DEPTH = 5;

class SearchTimeout extends Error {}

function isCapture(board: Board, move: Move): boolean {
  return move.kind === "move" && board[move.to.row][move.to.col] !== null;
}

/** Cheap move ordering — captures and promotions first — so alpha-beta prunes more
 * without needing a transposition table. */
function orderMoves(board: Board, moves: Move[]): Move[] {
  return [...moves].sort((a, b) => {
    const aScore = (isCapture(board, a) ? 2 : 0) + (a.kind === "move" && a.promote ? 1 : 0);
    const bScore = (isCapture(board, b) ? 2 : 0) + (b.kind === "move" && b.promote ? 1 : 0);
    return bScore - aScore;
  });
}

interface SearchResult {
  score: number;
  move?: Move;
}

function negamax(
  board: Board,
  hands: Hands,
  player: Player,
  depth: number,
  alpha: number,
  beta: number,
  deadline: number
): SearchResult {
  if (Date.now() > deadline) throw new SearchTimeout();

  const legalMoves = getLegalMoves(board, hands, player);
  if (legalMoves.length === 0) {
    // No legal moves = loss for the side to move (shogi has no stalemate draw).
    // Prefer faster mates / slower losses by biasing with remaining depth.
    return { score: -MATE_SCORE - depth };
  }

  if (depth === 0) {
    return { score: evaluate(board, hands, player) };
  }

  const ordered = orderMoves(board, legalMoves);
  let best = -Infinity;
  let bestMove: Move | undefined;

  for (const move of ordered) {
    const { board: nextBoard, hands: nextHands } = applyMoveToBoard(board, hands, move);
    const child = negamax(nextBoard, nextHands, opponentOf(player), depth - 1, -beta, -alpha, deadline);
    const score = -child.score;
    if (score > best) {
      best = score;
      bestMove = move;
    }
    alpha = Math.max(alpha, score);
    if (alpha >= beta) break; // beta cutoff
  }

  return { score: best, move: bestMove };
}

/** Returns the best move found within `timeBudgetMs`, searching as deep as time
 * allows (iterative deepening). Returns null only if there are no legal moves. */
export function findBestMove(board: Board, hands: Hands, player: Player, timeBudgetMs: number): Move | null {
  const rootMoves = getLegalMoves(board, hands, player);
  if (rootMoves.length === 0) return null;
  if (rootMoves.length === 1) return rootMoves[0];

  const deadline = Date.now() + timeBudgetMs;
  let bestMove: Move = rootMoves[0];

  try {
    for (let depth = 1; depth <= MAX_DEPTH; depth++) {
      const result = negamax(board, hands, player, depth, -Infinity, Infinity, deadline);
      if (result.move) bestMove = result.move;
      if (Date.now() > deadline) break;
    }
  } catch (err) {
    if (!(err instanceof SearchTimeout)) throw err;
  }

  return bestMove;
}
