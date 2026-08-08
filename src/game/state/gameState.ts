import type { Board, GameState, PieceType, Player } from "../types/shogi";
import { emptyHands } from "../rules/boardOps";
import { isInCheck } from "../rules/check";

const BACK_RANK: PieceType[] = ["KY", "KE", "GI", "KI", "OU", "KI", "GI", "KE", "KY"];

/** Standard shogi starting position (平手, no handicap). */
export function createInitialBoard(): Board {
  const board: Board = Array.from({ length: 9 }, () => Array<null>(9).fill(null));

  // Gote (後手) — top of the board, facing down.
  for (let col = 0; col < 9; col++) board[0][col] = { type: BACK_RANK[col], owner: "gote" };
  board[1][1] = { type: "HI", owner: "gote" };
  board[1][7] = { type: "KA", owner: "gote" };
  for (let col = 0; col < 9; col++) board[2][col] = { type: "FU", owner: "gote" };

  // Sente (先手) — bottom of the board, facing up.
  for (let col = 0; col < 9; col++) board[6][col] = { type: "FU", owner: "sente" };
  board[7][1] = { type: "KA", owner: "sente" };
  board[7][7] = { type: "HI", owner: "sente" };
  for (let col = 0; col < 9; col++) board[8][col] = { type: BACK_RANK[col], owner: "sente" };

  return board;
}

export function createInitialGameState(): GameState {
  const board = createInitialBoard();
  const startingPlayer: Player = "sente";
  return {
    board,
    hands: emptyHands(),
    currentPlayer: startingPlayer,
    status: "ongoing",
    isCheck: isInCheck(board, startingPlayer),
    history: [],
  };
}
