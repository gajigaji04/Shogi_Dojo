// Japanese kifu (棋譜) notation — e.g. "▲７六歩" or "△２二角成" or "▲５五歩打".

import type { Move, PieceType, Player, Position } from "../types/shogi";
import { isPromotionEligible } from "../rules/promotion";

export const ZENKAKU_DIGITS = "１２３４５６７８９";
export const KANJI_NUMERALS = "一二三四五六七八九";

const PIECE_KANJI: Record<PieceType, string> = {
  FU: "歩",
  KY: "香",
  KE: "桂",
  GI: "銀",
  KI: "金",
  KA: "角",
  HI: "飛",
  OU: "玉",
  TO: "と",
  NY: "成香",
  NK: "成桂",
  NG: "成銀",
  UM: "馬",
  RY: "龍",
};

export function pieceKanji(type: PieceType, owner?: Player): string {
  if (type === "OU") return owner === "sente" ? "王" : "玉";
  return PIECE_KANJI[type];
}

function squareNotation(pos: Position): string {
  const file = 9 - pos.col; // col 0 => file 9
  const rank = pos.row + 1; // row 0 => rank 1 (一)
  return ZENKAKU_DIGITS[file - 1] + KANJI_NUMERALS[rank - 1];
}

/** Builds the standard kifu string for one ply. `previousTo`, when given and equal to
 * this move's destination, renders "同" (same square) per convention. */
export function moveToNotation(move: Move, previousTo?: Position): string {
  const symbol = move.player === "sente" ? "▲" : "△";
  const sameSquare = previousTo && previousTo.row === move.to.row && previousTo.col === move.to.col;
  const squarePart = sameSquare ? "同" : squareNotation(move.to);

  if (move.kind === "drop") {
    return `${symbol}${squarePart}${pieceKanji(move.piece, move.player)}打`;
  }

  const name = pieceKanji(move.piece, move.player);
  const eligible = isPromotionEligible(move.piece, move.player, move.from.row, move.to.row);
  const suffix = move.promote ? "成" : eligible ? "不成" : "";
  return `${symbol}${squarePart}${name}${suffix}`;
}
