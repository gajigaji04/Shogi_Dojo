import type { Board, Hands, Player } from "../types/shogi";
import { getLegalMoves } from "./legalMoves";

/** True when `player` has no legal move at all — in shogi this always ends the game
 * as a loss for `player` (there is no stalemate draw). */
export function hasNoLegalMoves(board: Board, hands: Hands, player: Player): boolean {
  return getLegalMoves(board, hands, player).length === 0;
}
