// Core Shogi domain types. Pure data — no UI, no framework dependencies.

export type Player = "sente" | "gote"; // 先手 (black/first) / 後手 (white/second)

/** Unpromoted piece kinds that can exist in a player's hand (持ち駒). */
export type BasePieceType = "FU" | "KY" | "KE" | "GI" | "KI" | "KA" | "HI";

/** All piece kinds that can appear on the board, including promoted forms and the king. */
export type PieceType = BasePieceType | "OU" | "TO" | "NY" | "NK" | "NG" | "UM" | "RY";

export interface Piece {
  type: PieceType;
  owner: Player;
}

export type Square = Piece | null;

/** board[row][col] — row 0 = rank 1 (一, gote's back rank), row 8 = rank 9 (九, sente's back rank).
 * col 0 = file 9 (筋), col 8 = file 1. This matches the traditional board drawn with
 * file 9 on the left and rank 一 at the top when viewed from sente's seat. */
export type Board = Square[][];

export interface Position {
  row: number;
  col: number;
}

export type Hand = Record<BasePieceType, number>;
export type Hands = Record<Player, Hand>;

export type MoveKind = "move" | "drop";

export interface BoardMove {
  kind: "move";
  player: Player;
  from: Position;
  to: Position;
  piece: PieceType;
  promote: boolean;
  captured?: PieceType;
}

export interface DropMove {
  kind: "drop";
  player: Player;
  to: Position;
  piece: BasePieceType;
}

export type Move = BoardMove | DropMove;

/** "sennichite" — ordinary repetition draw (千日手). "perpetual_check" — the same
 * position repeated four times purely because one side gave check on every one of
 * those moves (連続王手の千日手); that side loses instead of the game drawing. */
export type GameStatus = "ongoing" | "checkmate" | "resigned" | "sennichite" | "perpetual_check";

/** A recorded ply: the move itself, plus the resulting notation and a full state
 * snapshot, so replay can jump to any point without replaying logic. */
export interface HistoryEntry {
  move: Move;
  notation: string;
  isCheck: boolean;
  boardAfter: Board;
  handsAfter: Hands;
  currentPlayerAfter: Player;
}

export interface GameState {
  board: Board;
  hands: Hands;
  currentPlayer: Player;
  status: GameStatus;
  winner?: Player;
  isCheck: boolean;
  history: HistoryEntry[];
}

export const BASE_PIECE_TYPES: BasePieceType[] = ["FU", "KY", "KE", "GI", "KI", "KA", "HI"];

export const PROMOTION_MAP: Partial<Record<PieceType, PieceType>> = {
  FU: "TO",
  KY: "NY",
  KE: "NK",
  GI: "NG",
  KA: "UM",
  HI: "RY",
};

export const DEMOTION_MAP: Partial<Record<PieceType, BasePieceType>> = {
  TO: "FU",
  NY: "KY",
  NK: "KE",
  NG: "GI",
  UM: "KA",
  RY: "HI",
};

/** Returns the un-promoted base type for any piece (identity for already-base types). */
export function baseTypeOf(type: PieceType): BasePieceType | "OU" {
  if (type === "OU") return "OU";
  return (DEMOTION_MAP[type] as BasePieceType | undefined) ?? (type as BasePieceType);
}

export function isPromoted(type: PieceType): boolean {
  return type === "TO" || type === "NY" || type === "NK" || type === "NG" || type === "UM" || type === "RY";
}

export function opponentOf(player: Player): Player {
  return player === "sente" ? "gote" : "sente";
}

export function samePosition(a: Position, b: Position): boolean {
  return a.row === b.row && a.col === b.col;
}

export function inBounds(pos: Position): boolean {
  return pos.row >= 0 && pos.row < 9 && pos.col >= 0 && pos.col < 9;
}
