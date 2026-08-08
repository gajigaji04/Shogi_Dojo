import { describe, expect, it } from "vitest";
import { gameReducer } from "../state/gameReducer";
import { createTutorialGameState } from "../state/tutorialState";
import type { GameState, Move } from "../types/shogi";

// Guards the exact scripted sequence the guided tutorial UI plays through. If this
// test ever fails, the tutorial page will silently freeze — the "expected" click
// stops being a legal move, so gameReducer no-ops and history never advances.
describe("tutorial script", () => {
  it("plays move -> capture -> drop -> promote -> check as five legal sente moves, interleaved with four scripted gote replies", () => {
    let state: GameState = createTutorialGameState();

    const play = (move: Move) => {
      const before = state;
      state = gameReducer(state, { type: "MOVE", move });
      expect(state).not.toBe(before); // not.toBe => the move was accepted, not silently rejected
      return state;
    };

    // Stage 0: move the pawn forward.
    play({ kind: "move", player: "sente", from: { row: 6, col: 4 }, to: { row: 5, col: 4 }, piece: "FU", promote: false });
    play({ kind: "move", player: "gote", from: { row: 0, col: 8 }, to: { row: 1, col: 8 }, piece: "KY", promote: false });

    // Stage 1: capture the gote pawn.
    play({ kind: "move", player: "sente", from: { row: 5, col: 4 }, to: { row: 4, col: 4 }, piece: "FU", promote: false });
    expect(state.hands.sente.FU).toBe(1);
    play({ kind: "move", player: "gote", from: { row: 1, col: 8 }, to: { row: 2, col: 8 }, piece: "KY", promote: false });

    // Stage 2: drop the captured pawn.
    play({ kind: "drop", player: "sente", to: { row: 4, col: 2 }, piece: "FU" });
    expect(state.hands.sente.FU).toBe(0);
    play({ kind: "move", player: "gote", from: { row: 2, col: 8 }, to: { row: 3, col: 8 }, piece: "KY", promote: false });

    // Stage 3: move the silver into the enemy camp and promote.
    play({ kind: "move", player: "sente", from: { row: 3, col: 3 }, to: { row: 2, col: 3 }, piece: "GI", promote: true });
    expect(state.board[2][3]).toEqual({ type: "NG", owner: "sente" });
    play({ kind: "move", player: "gote", from: { row: 3, col: 8 }, to: { row: 4, col: 8 }, piece: "KY", promote: false });

    // Stage 4: advance the promoted silver to deliver check.
    play({ kind: "move", player: "sente", from: { row: 2, col: 3 }, to: { row: 1, col: 3 }, piece: "NG", promote: false });

    expect(state.isCheck).toBe(true);
    expect(state.currentPlayer).toBe("gote");
    expect(state.status).toBe("ongoing"); // check, not checkmate — gote still has legal escapes
  });
});
