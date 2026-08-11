import { describe, expect, it } from "vitest";
import { findBestMove } from "../ai/minimax";
import { getLegalMoves } from "../rules/legalMoves";
import { gameReducer } from "../state/gameReducer";
import { createInitialGameState } from "../state/gameState";
import { emptyHands } from "../rules/boardOps";
import { emptyBoard, place, pos } from "./testUtils";

describe("minimax CPU engine", () => {
  it("always returns a legal move from the standard opening position", () => {
    const state = createInitialGameState();
    const move = findBestMove(state.board, state.hands, state.currentPlayer, 150);
    expect(move).not.toBeNull();
    const legal = getLegalMoves(state.board, state.hands, state.currentPlayer);
    expect(legal.some((m) => JSON.stringify(m) === JSON.stringify(move))).toBe(true);
  });

  it("returns null only when there are truly no legal moves", () => {
    // A position with zero pieces for the side to move is unreachable in real play,
    // but exercises the empty-legal-moves path directly.
    const board = emptyBoard();
    const move = findBestMove(board, emptyHands(), "sente", 50);
    expect(move).toBeNull();
  });

  it("prefers a free capture over a quiet move (material-aware, not random)", () => {
    const board = emptyBoard();
    place(board, pos(8, 4), "OU", "sente");
    place(board, pos(0, 8), "OU", "gote");
    place(board, pos(4, 4), "HI", "sente"); // rook can slide the length of rank 4
    place(board, pos(4, 0), "FU", "gote"); // undefended pawn sitting on that rank
    place(board, pos(6, 8), "FU", "sente"); // a boring alternative move, gains nothing

    const move = findBestMove(board, emptyHands(), "sente", 300);

    expect(move).toEqual({
      kind: "move",
      player: "sente",
      from: { row: 4, col: 4 },
      to: { row: 4, col: 0 },
      piece: "HI",
      promote: false,
    });
  });

  it("finds and plays a mate-in-1 when one is available", () => {
    const board = emptyBoard();
    place(board, pos(0, 0), "OU", "gote");
    place(board, pos(1, 2), "KI", "sente"); // defends (1,1), covers (0,1)
    place(board, pos(3, 0), "KY", "sente"); // covers (1,0)
    place(board, pos(2, 2), "GI", "sente"); // one move from delivering mate at (1,1)
    place(board, pos(8, 4), "OU", "sente");

    const move = findBestMove(board, emptyHands(), "sente", 400);
    expect(move).not.toBeNull();

    const result = gameReducer(
      { board, hands: emptyHands(), currentPlayer: "sente", status: "ongoing", isCheck: false, history: [] },
      { type: "MOVE", move: move! }
    );

    expect(result.status).toBe("checkmate");
    expect(result.winner).toBe("sente");
  });
});
