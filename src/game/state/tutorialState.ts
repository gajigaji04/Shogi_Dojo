// A small, hand-built position for the guided tutorial — not the standard opening.
// It's designed so five short, real moves (validated by the exact same engine as
// every other game mode) naturally walk through: moving, capturing, dropping a
// captured piece, promoting, and giving check.

import type { Board, GameState } from "../types/shogi";
import { emptyHands } from "../rules/boardOps";
import { isInCheck } from "../rules/check";

export function createTutorialBoard(): Board {
  const board: Board = Array.from({ length: 9 }, () => Array<null>(9).fill(null));

  board[8][4] = { type: "OU", owner: "sente" };
  board[6][4] = { type: "FU", owner: "sente" };
  board[3][3] = { type: "GI", owner: "sente" };

  board[0][3] = { type: "OU", owner: "gote" };
  board[4][4] = { type: "FU", owner: "gote" };
  board[0][8] = { type: "KY", owner: "gote" };

  return board;
}

export function createTutorialGameState(): GameState {
  const board = createTutorialBoard();
  return {
    board,
    hands: emptyHands(),
    currentPlayer: "sente",
    status: "ongoing",
    isCheck: isInCheck(board, "sente"),
    history: [],
  };
}
