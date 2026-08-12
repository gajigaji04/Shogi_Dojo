import { BASE_PIECE_TYPES, baseTypeOf } from "../types/shogi.js";
import type { Board, Hands, Move } from "../types/shogi.js";
import { promote } from "./promotion.js";

export function cloneBoard(board: Board): Board {
  return board.map((row) => row.map((sq) => (sq ? { ...sq } : null)));
}

export function cloneHands(hands: Hands): Hands {
  return {
    sente: { ...hands.sente },
    gote: { ...hands.gote },
  };
}

export function emptyHands(): Hands {
  const empty = Object.fromEntries(BASE_PIECE_TYPES.map((t) => [t, 0])) as Hands["sente"];
  return { sente: { ...empty }, gote: { ...empty } };
}

/** Mechanically executes a move/drop against board+hands. Does not validate legality —
 * callers (legalMoves simulation, the reducer) are responsible for only calling this
 * with moves that have already been verified. Returns new, independent copies. */
export function applyMoveToBoard(board: Board, hands: Hands, move: Move): { board: Board; hands: Hands } {
  const nextBoard = cloneBoard(board);
  const nextHands = cloneHands(hands);

  if (move.kind === "move") {
    const piece = nextBoard[move.from.row][move.from.col];
    if (!piece) throw new Error("applyMoveToBoard: no piece at source square");
    const captured = nextBoard[move.to.row][move.to.col];
    if (captured) {
      const base = baseTypeOf(captured.type);
      if (base !== "OU") {
        nextHands[move.player][base] += 1;
      }
    }
    nextBoard[move.to.row][move.to.col] = {
      type: move.promote ? promote(piece.type) : piece.type,
      owner: piece.owner,
    };
    nextBoard[move.from.row][move.from.col] = null;
  } else {
    if (nextHands[move.player][move.piece] <= 0) {
      throw new Error("applyMoveToBoard: no such piece in hand to drop");
    }
    nextHands[move.player][move.piece] -= 1;
    nextBoard[move.to.row][move.to.col] = { type: move.piece, owner: move.player };
  }

  return { board: nextBoard, hands: nextHands };
}
