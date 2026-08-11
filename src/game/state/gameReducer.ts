import type { GameState, Move } from "../types/shogi";
import { opponentOf } from "../types/shogi";
import { applyMoveToBoard } from "../rules/boardOps";
import { getLegalMoves } from "../rules/legalMoves";
import { isInCheck } from "../rules/check";
import { hasNoLegalMoves } from "../rules/checkmate";
import { detectRepetition } from "../rules/repetition";
import { moveToNotation } from "../notation/kifu";
import { createInitialGameState } from "./gameState";

export type GameAction = { type: "MOVE"; move: Move } | { type: "RESIGN" } | { type: "TIMEOUT" } | { type: "RESET" };

function movesEqual(a: Move, b: Move): boolean {
  if (a.kind !== b.kind || a.player !== b.player) return false;
  if (a.to.row !== b.to.row || a.to.col !== b.to.col) return false;
  if (a.kind === "drop" && b.kind === "drop") return a.piece === b.piece;
  if (a.kind === "move" && b.kind === "move") {
    return a.from.row === b.from.row && a.from.col === b.from.col && a.promote === b.promote;
  }
  return false;
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "RESET":
      return createInitialGameState();

    case "RESIGN": {
      if (state.status !== "ongoing") return state;
      return { ...state, status: "resigned", winner: opponentOf(state.currentPlayer) };
    }

    // The player whose turn it currently is failed to move in time — they forfeit,
    // same terminal shape as a resignation (the online layer labels it distinctly).
    case "TIMEOUT": {
      if (state.status !== "ongoing") return state;
      return { ...state, status: "resigned", winner: opponentOf(state.currentPlayer) };
    }

    case "MOVE": {
      if (state.status !== "ongoing") return state;
      const { move } = action;

      const legal = getLegalMoves(state.board, state.hands, state.currentPlayer);
      const matched = legal.find((candidate) => movesEqual(candidate, move));
      if (!matched) {
        // Illegal move requested (e.g. would leave own king in check) — ignored.
        return state;
      }

      const { board: nextBoard, hands: nextHands } = applyMoveToBoard(state.board, state.hands, matched);
      const nextPlayer = opponentOf(state.currentPlayer);
      const nextIsCheck = isInCheck(nextBoard, nextPlayer);
      const opponentHasNoMoves = hasNoLegalMoves(nextBoard, nextHands, nextPlayer);

      const previousTo = state.history[state.history.length - 1]?.move.to;
      const notation = moveToNotation(matched, previousTo);

      const nextHistory = [
        ...state.history,
        {
          move: matched,
          notation,
          isCheck: nextIsCheck,
          boardAfter: nextBoard,
          handsAfter: nextHands,
          currentPlayerAfter: nextPlayer,
        },
      ];

      let status: GameState["status"] = opponentHasNoMoves ? "checkmate" : "ongoing";
      let winner: GameState["winner"] = opponentHasNoMoves ? state.currentPlayer : undefined;

      if (status === "ongoing") {
        const repetition = detectRepetition(nextHistory);
        if (repetition.type === "sennichite") {
          status = "sennichite";
        } else if (repetition.type === "perpetual_check") {
          status = "perpetual_check";
          winner = opponentOf(repetition.loser);
        }
      }

      const nextState: GameState = {
        board: nextBoard,
        hands: nextHands,
        currentPlayer: nextPlayer,
        status,
        winner,
        isCheck: nextIsCheck,
        history: nextHistory,
      };
      return nextState;
    }

    default:
      return state;
  }
}
