import { describe, expect, it } from "vitest";
import type { GameState, Move } from "../types/shogi";
import { gameReducer } from "../state/gameReducer";
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

/** Applies moves in order, stopping as soon as the game ends (repetition can trigger
 * mid-cycle, not necessarily on a cycle boundary) — later moves in the list are simply
 * never reached, rather than asserted illegal. */
function playUntilEnded(state: GameState, moves: Move[]): GameState {
  for (const move of moves) {
    if (state.status !== "ongoing") break;
    const next = gameReducer(state, { type: "MOVE", move });
    expect(next).not.toBe(state); // every move reached while still ongoing must be legal
    state = next;
  }
  return state;
}

function repeatCycles(cycleMoves: Move[], cycles: number): Move[] {
  return Array.from({ length: cycles }, () => cycleMoves).flat();
}

describe("千日手 (sennichite)", () => {
  const shuffleCycle: Move[] = [
    { kind: "move", player: "sente", from: pos(8, 0), to: pos(8, 1), piece: "OU", promote: false },
    { kind: "move", player: "gote", from: pos(0, 4), to: pos(0, 5), piece: "OU", promote: false },
    { kind: "move", player: "sente", from: pos(8, 1), to: pos(8, 0), piece: "OU", promote: false },
    { kind: "move", player: "gote", from: pos(0, 5), to: pos(0, 4), piece: "OU", promote: false },
  ];

  function baseState(): GameState {
    const board = emptyBoard();
    place(board, pos(8, 0), "OU", "sente");
    place(board, pos(0, 4), "OU", "gote");
    return stateWith({ board });
  }

  it("draws when the same position (board + hands + side to move) recurs four times with no checks involved", () => {
    const state = playUntilEnded(baseState(), repeatCycles(shuffleCycle, 4));
    expect(state.status).toBe("sennichite");
    expect(state.winner).toBeUndefined();
  });

  it("is not triggered while a position has recurred fewer than four times", () => {
    const state = playUntilEnded(baseState(), repeatCycles(shuffleCycle, 2));
    expect(state.status).toBe("ongoing");
  });

  it("connected perpetual check (連続王手の千日手): the side giving check every single time loses, instead of a draw", () => {
    const board = emptyBoard();
    place(board, pos(8, 0), "OU", "sente");
    place(board, pos(0, 4), "OU", "gote");
    place(board, pos(5, 5), "HI", "sente");
    const checkCycle: Move[] = [
      { kind: "move", player: "sente", from: pos(5, 5), to: pos(5, 4), piece: "HI", promote: false },
      { kind: "move", player: "gote", from: pos(0, 4), to: pos(0, 5), piece: "OU", promote: false },
      { kind: "move", player: "sente", from: pos(5, 4), to: pos(5, 5), piece: "HI", promote: false },
      { kind: "move", player: "gote", from: pos(0, 5), to: pos(0, 4), piece: "OU", promote: false },
    ];

    const state = playUntilEnded(stateWith({ board }), repeatCycles(checkCycle, 4));

    expect(state.status).toBe("perpetual_check");
    expect(state.winner).toBe("gote"); // sente checked every move -> sente loses
  });
});
