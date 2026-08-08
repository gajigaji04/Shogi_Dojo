// The minimal interface GameBoardPanel needs — both the local (useShogiGame) and
// online (useOnlineShogiGame) hooks satisfy this structurally, so the same board UI
// renders a local CPU game or a server-authoritative online game without knowing
// which one it's driving.

import type { BasePieceType, GameState, PieceType, Position } from "../game/types/shogi";

export interface PendingPromotionLike {
  from: Position;
  to: Position;
  piece: PieceType;
}

export interface ShogiGameController {
  state: GameState;
  selected: Position | null;
  selectedDrop: BasePieceType | null;
  legalTargets: Position[];
  checkedKing: Position | null;
  pendingPromotion: PendingPromotionLike | null;
  selectSquare: (pos: Position) => void;
  selectHandPiece: (type: BasePieceType) => void;
  resolvePromotion: (promote: boolean) => void;
  resign: () => void;
  reset?: () => void;
}
