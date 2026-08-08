// The single source of truth for "what moves may `player` legally make right now",
// given board + hands. Combines pseudo-legal generation with:
//   - self-check safety (a move may never leave your own king attacked)
//   - forced/optional promotion expansion
//   - structural drop rules (nifu, iki-dokoro) from drops.ts
//   - uchi-fu-zume (illegal to drop a pawn for an immediate checkmate)
//
// A player with zero legal moves has lost (shogi has no draw-by-stalemate: a player
// who cannot move, loses, whether or not they are currently in check).

import { opponentOf } from "../types/shogi";
import type { Board, BoardMove, DropMove, Hands, Move, Piece, Player, Position } from "../types/shogi";
import { pseudoLegalMoves } from "./pieceMovement";
import { isPromotionEligible, isPromotionForced } from "./promotion";
import { structurallyLegalDropSquares } from "./drops";
import { isInCheck } from "./check";
import { applyMoveToBoard } from "./boardOps";

function boardMoveCandidates(board: Board, from: Position, piece: Piece): BoardMove[] {
  const moves: BoardMove[] = [];
  for (const to of pseudoLegalMoves(board, from)) {
    const eligible = isPromotionEligible(piece.type, piece.owner, from.row, to.row);
    const forced = eligible && isPromotionForced(piece.type, piece.owner, to.row);

    if (forced) {
      moves.push({ kind: "move", player: piece.owner, from, to, piece: piece.type, promote: true });
      continue;
    }
    if (eligible) {
      moves.push({ kind: "move", player: piece.owner, from, to, piece: piece.type, promote: true });
    }
    moves.push({ kind: "move", player: piece.owner, from, to, piece: piece.type, promote: false });
  }
  return moves;
}

function isSelfCheckSafe(board: Board, hands: Hands, move: Move): boolean {
  const result = applyMoveToBoard(board, hands, move);
  return !isInCheck(result.board, move.player);
}

/** Would dropping a pawn at `to` give the opponent an immediate, inescapable checkmate?
 * If so, the drop is illegal (打ち歩詰め). Only relevant when the drop itself gives check. */
function isUchiFuZume(board: Board, hands: Hands, drop: DropMove): boolean {
  const { board: nextBoard, hands: nextHands } = applyMoveToBoard(board, hands, drop);
  const opponent = opponentOf(drop.player);
  if (!isInCheck(nextBoard, opponent)) return false;
  return getLegalMoves(nextBoard, nextHands, opponent).length === 0;
}

function dropCandidates(board: Board, hands: Hands, player: Player): DropMove[] {
  const drops: DropMove[] = [];
  const hand = hands[player];
  for (const pieceType of Object.keys(hand) as (keyof typeof hand)[]) {
    if (hand[pieceType] <= 0) continue;
    for (const to of structurallyLegalDropSquares(board, pieceType, player)) {
      drops.push({ kind: "drop", player, to, piece: pieceType });
    }
  }
  return drops;
}

/** All fully legal moves (board moves + drops) for `player` in this position. */
export function getLegalMoves(board: Board, hands: Hands, player: Player): Move[] {
  const legal: Move[] = [];

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const piece = board[row][col];
      if (!piece || piece.owner !== player) continue;
      for (const candidate of boardMoveCandidates(board, { row, col }, piece)) {
        if (isSelfCheckSafe(board, hands, candidate)) legal.push(candidate);
      }
    }
  }

  for (const drop of dropCandidates(board, hands, player)) {
    if (!isSelfCheckSafe(board, hands, drop)) continue;
    if (drop.piece === "FU" && isUchiFuZume(board, hands, drop)) continue;
    legal.push(drop);
  }

  return legal;
}

/** Legal destinations (moves + drop squares merged) for a single piece already on the
 * board — what the UI highlights when a square is selected. */
export function legalMovesFrom(board: Board, hands: Hands, from: Position): BoardMove[] {
  const piece = board[from.row][from.col];
  if (!piece) return [];
  return boardMoveCandidates(board, from, piece).filter((m) => isSelfCheckSafe(board, hands, m));
}

/** Legal drop squares for a specific piece type currently in `player`'s hand. */
export function legalDropSquares(board: Board, hands: Hands, player: Player, piece: DropMove["piece"]): Position[] {
  return structurallyLegalDropSquares(board, piece, player)
    .map((to): DropMove => ({ kind: "drop", player, to, piece }))
    .filter((drop) => isSelfCheckSafe(board, hands, drop) && !(drop.piece === "FU" && isUchiFuZume(board, hands, drop)))
    .map((d) => d.to);
}
