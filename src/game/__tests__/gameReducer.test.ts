import { describe, expect, it } from "vitest";
import type { GameState } from "../types/shogi";
import { gameReducer } from "../state/gameReducer";
import { createInitialGameState } from "../state/gameState";
import { emptyHands } from "../rules/boardOps";
import { emptyBoard, place, pos } from "./testUtils";

function stateWith(overrides: Partial<GameState>): GameState {
  return {
    board: emptyBoard(),
    hands: emptyHands(),
    currentPlayer: "sente",
    status: "ongoing",
    isCheck: false,
    history: [],
    ...overrides,
  };
}

describe("gameReducer — basic play", () => {
  it("plays the opening move ▲７六歩 and records it in the kifu", () => {
    const initial = createInitialGameState();
    const next = gameReducer(initial, {
      type: "MOVE",
      move: { kind: "move", player: "sente", from: pos(6, 2), to: pos(5, 2), piece: "FU", promote: false },
    });

    expect(next.board[5][2]).toEqual({ type: "FU", owner: "sente" });
    expect(next.board[6][2]).toBeNull();
    expect(next.currentPlayer).toBe("gote");
    expect(next.history).toHaveLength(1);
    expect(next.history[0].notation).toBe("▲７六歩");
  });

  it("plays a second move for gote, ▲△ alternating correctly", () => {
    const initial = createInitialGameState();
    const afterSente = gameReducer(initial, {
      type: "MOVE",
      move: { kind: "move", player: "sente", from: pos(6, 2), to: pos(5, 2), piece: "FU", promote: false },
    });
    const afterGote = gameReducer(afterSente, {
      type: "MOVE",
      move: { kind: "move", player: "gote", from: pos(2, 6), to: pos(3, 6), piece: "FU", promote: false },
    });

    expect(afterGote.history[1].notation).toBe("△３四歩");
    expect(afterGote.currentPlayer).toBe("sente");
  });

  it("rejects a move that is not in the legal set (illegal move is a no-op)", () => {
    const initial = createInitialGameState();
    const illegal = gameReducer(initial, {
      type: "MOVE",
      // pawns cannot move two squares
      move: { kind: "move", player: "sente", from: pos(6, 2), to: pos(4, 2), piece: "FU", promote: false },
    });
    expect(illegal).toBe(initial);
  });
});

describe("gameReducer — capture and 持ち駒", () => {
  it("moves a captured piece into the capturing player's hand", () => {
    const board = emptyBoard();
    place(board, pos(4, 4), "FU", "sente");
    place(board, pos(3, 4), "GI", "gote");
    place(board, pos(8, 4), "OU", "sente");
    place(board, pos(0, 0), "OU", "gote");
    const state = stateWith({ board });

    const next = gameReducer(state, {
      type: "MOVE",
      move: { kind: "move", player: "sente", from: pos(4, 4), to: pos(3, 4), piece: "FU", promote: false },
    });

    expect(next.board[3][4]).toEqual({ type: "FU", owner: "sente" });
    expect(next.hands.sente.GI).toBe(1);
  });

  it("lets a player drop a piece from hand onto an empty square", () => {
    const board = emptyBoard();
    place(board, pos(8, 4), "OU", "sente");
    place(board, pos(0, 0), "OU", "gote");
    const state = stateWith({ board, hands: { sente: { ...emptyHands().sente, GI: 1 }, gote: emptyHands().gote } });

    const next = gameReducer(state, {
      type: "MOVE",
      move: { kind: "drop", player: "sente", to: pos(4, 4), piece: "GI" },
    });

    expect(next.board[4][4]).toEqual({ type: "GI", owner: "sente" });
    expect(next.hands.sente.GI).toBe(0);
    expect(next.history[0].notation).toBe("▲５五銀打");
  });
});

describe("gameReducer — promotion", () => {
  it("promotes when the player opts in near the enemy camp", () => {
    const board = emptyBoard();
    place(board, pos(2, 4), "FU", "sente");
    place(board, pos(8, 4), "OU", "sente");
    place(board, pos(0, 0), "OU", "gote");
    const state = stateWith({ board });

    const next = gameReducer(state, {
      type: "MOVE",
      move: { kind: "move", player: "sente", from: pos(2, 4), to: pos(1, 4), piece: "FU", promote: true },
    });

    expect(next.board[1][4]).toEqual({ type: "TO", owner: "sente" });
  });

  it("forces promotion on the last rank and rejects the non-promoting variant", () => {
    const board = emptyBoard();
    place(board, pos(1, 4), "FU", "sente");
    place(board, pos(8, 4), "OU", "sente");
    place(board, pos(0, 0), "OU", "gote");
    const state = stateWith({ board });

    const declined = gameReducer(state, {
      type: "MOVE",
      move: { kind: "move", player: "sente", from: pos(1, 4), to: pos(0, 4), piece: "FU", promote: false },
    });
    expect(declined).toBe(state); // illegal — pawn cannot stay unpromoted here

    const forced = gameReducer(state, {
      type: "MOVE",
      move: { kind: "move", player: "sente", from: pos(1, 4), to: pos(0, 4), piece: "FU", promote: true },
    });
    expect(forced.board[0][4]).toEqual({ type: "TO", owner: "sente" });
  });
});

describe("gameReducer — checkmate ends the game without ever capturing the king", () => {
  it("declares checkmate the instant the mating move lands, and freezes the game", () => {
    const board = emptyBoard();
    place(board, pos(0, 0), "OU", "gote");
    place(board, pos(1, 2), "KI", "sente"); // will defend (1,1) and cover (0,1)
    place(board, pos(3, 0), "KY", "sente"); // covers (1,0)
    place(board, pos(2, 2), "GI", "sente"); // about to deliver mate at (1,1)
    place(board, pos(8, 4), "OU", "sente");
    const state = stateWith({ board });

    const mated = gameReducer(state, {
      type: "MOVE",
      move: { kind: "move", player: "sente", from: pos(2, 2), to: pos(1, 1), piece: "GI", promote: false },
    });

    expect(mated.status).toBe("checkmate");
    expect(mated.winner).toBe("sente");
    // The gote king is still on the board — the game ended by declaration, not capture.
    expect(mated.board[0][0]).toEqual({ type: "OU", owner: "gote" });

    const afterGameOver = gameReducer(mated, {
      type: "MOVE",
      move: { kind: "move", player: "gote", from: pos(0, 0), to: pos(0, 1), piece: "OU", promote: false },
    });
    expect(afterGameOver).toBe(mated); // no further moves accepted once the game has ended
  });
});

describe("gameReducer — resign and reset", () => {
  it("resign hands the win to the opponent", () => {
    const initial = createInitialGameState();
    const resigned = gameReducer(initial, { type: "RESIGN" });
    expect(resigned.status).toBe("resigned");
    expect(resigned.winner).toBe("gote");
  });

  it("reset returns to a fresh initial position", () => {
    const initial = createInitialGameState();
    const afterMove = gameReducer(initial, {
      type: "MOVE",
      move: { kind: "move", player: "sente", from: pos(6, 2), to: pos(5, 2), piece: "FU", promote: false },
    });
    const reset = gameReducer(afterMove, { type: "RESET" });
    expect(reset.history).toHaveLength(0);
    expect(reset.currentPlayer).toBe("sente");
    expect(reset.board[6][2]).toEqual({ type: "FU", owner: "sente" });
  });
});
