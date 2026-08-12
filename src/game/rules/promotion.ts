import { PROMOTION_MAP } from "../types/shogi.js";
import type { PieceType, Player } from "../types/shogi.js";

/** Rows (0-indexed) that make up each player's promotion zone (敵陣, the far three ranks). */
export function promotionZoneRows(player: Player): number[] {
  return player === "sente" ? [0, 1, 2] : [6, 7, 8];
}

export function canPromote(type: PieceType): boolean {
  return type in PROMOTION_MAP;
}

/** A move may promote if the piece can promote at all, and either end of the move
 * touches the player's promotion zone. */
export function isPromotionEligible(type: PieceType, player: Player, fromRow: number, toRow: number): boolean {
  if (!canPromote(type)) return false;
  const zone = promotionZoneRows(player);
  return zone.includes(fromRow) || zone.includes(toRow);
}

/** Pieces that would have no legal move at all if left un-promoted on this destination
 * rank must promote automatically (行き所のない駒). */
export function isPromotionForced(type: PieceType, player: Player, toRow: number): boolean {
  const lastRow = player === "sente" ? 0 : 8;
  const secondLastRow = player === "sente" ? 1 : 7;
  if ((type === "FU" || type === "KY") && toRow === lastRow) return true;
  if (type === "KE" && (toRow === lastRow || toRow === secondLastRow)) return true;
  return false;
}

export function promote(type: PieceType): PieceType {
  return PROMOTION_MAP[type] ?? type;
}
