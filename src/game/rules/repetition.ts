// 千日手 (sennichite) detection: the same position — board, hands, and side to move —
// recurring four times ends the game. If one player delivered check on every one of
// their moves across the whole repeated span, that player loses instead of a draw
// (連続王手の千日手, perpetual check).

import { BASE_PIECE_TYPES } from "../types/shogi";
import type { Board, Hands, HistoryEntry, Player } from "../types/shogi";

export function positionKey(board: Board, hands: Hands, sideToMove: Player): string {
  const boardPart = board
    .flat()
    .map((sq) => (sq ? `${sq.owner[0]}${sq.type}` : ".."))
    .join("");
  const handPart = (["sente", "gote"] as Player[])
    .map((p) => BASE_PIECE_TYPES.map((t) => hands[p][t]).join(""))
    .join("|");
  return `${boardPart}#${handPart}#${sideToMove}`;
}

export type RepetitionResult = { type: "none" } | { type: "sennichite" } | { type: "perpetual_check"; loser: Player };

/** `history` must already include the just-played move as its last entry. */
export function detectRepetition(history: HistoryEntry[]): RepetitionResult {
  if (history.length === 0) return { type: "none" };

  const keys = history.map((h) => positionKey(h.boardAfter, h.handsAfter, h.currentPlayerAfter));
  const currentKey = keys[keys.length - 1];

  const occurrences: number[] = [];
  for (let i = 0; i < keys.length; i++) {
    if (keys[i] === currentKey) occurrences.push(i);
  }
  if (occurrences.length < 4) return { type: "none" };

  const spanStart = occurrences[0]; // first ply (index) at which this position occurred
  const span = history.slice(spanStart); // every ply since, inclusive — a whole number of repeated cycles

  for (const player of ["sente", "gote"] as Player[]) {
    const movesByPlayer = span.filter((h) => h.move.player === player);
    if (movesByPlayer.length > 0 && movesByPlayer.every((h) => h.isCheck)) {
      return { type: "perpetual_check", loser: player };
    }
  }

  return { type: "sennichite" };
}
