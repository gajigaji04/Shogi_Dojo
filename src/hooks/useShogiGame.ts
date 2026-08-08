import { useCallback, useMemo, useReducer, useState } from "react";
import type { BasePieceType, BoardMove, PieceType, Position } from "../game/types/shogi";
import { gameReducer } from "../game/state/gameReducer";
import { createInitialGameState } from "../game/state/gameState";
import { legalDropSquares, legalMovesFrom } from "../game/rules/legalMoves";
import { findKing } from "../game/rules/check";
import { isPromotionEligible } from "../game/rules/promotion";

export interface PendingPromotion {
  from: Position;
  to: Position;
  piece: PieceType;
}

export function useShogiGame() {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialGameState);
  const [selected, setSelected] = useState<Position | null>(null);
  const [selectedDrop, setSelectedDrop] = useState<BasePieceType | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<PendingPromotion | null>(null);

  const boardCandidates: BoardMove[] = useMemo(() => {
    if (!selected) return [];
    return legalMovesFrom(state.board, state.hands, selected);
  }, [selected, state.board, state.hands]);

  const legalTargets: Position[] = useMemo(() => {
    if (selected) {
      const seen = new Set<string>();
      const targets: Position[] = [];
      for (const m of boardCandidates) {
        const key = `${m.to.row},${m.to.col}`;
        if (!seen.has(key)) {
          seen.add(key);
          targets.push(m.to);
        }
      }
      return targets;
    }
    if (selectedDrop) {
      return legalDropSquares(state.board, state.hands, state.currentPlayer, selectedDrop);
    }
    return [];
  }, [selected, selectedDrop, boardCandidates, state.board, state.hands, state.currentPlayer]);

  const checkedKing = useMemo(
    () => (state.isCheck ? findKing(state.board, state.currentPlayer) : null),
    [state.isCheck, state.board, state.currentPlayer]
  );

  const clearSelection = useCallback(() => {
    setSelected(null);
    setSelectedDrop(null);
  }, []);

  const selectHandPiece = useCallback(
    (type: BasePieceType) => {
      if (state.status !== "ongoing" || pendingPromotion) return;
      if (state.hands[state.currentPlayer][type] <= 0) return;
      setSelected(null);
      setSelectedDrop((current) => (current === type ? null : type));
    },
    [state.status, state.hands, state.currentPlayer, pendingPromotion]
  );

  const selectSquare = useCallback(
    (pos: Position) => {
      if (state.status !== "ongoing" || pendingPromotion) return;
      const piece = state.board[pos.row][pos.col];

      if (selectedDrop) {
        const isTarget = legalTargets.some((t) => t.row === pos.row && t.col === pos.col);
        if (isTarget) {
          dispatch({ type: "MOVE", move: { kind: "drop", player: state.currentPlayer, to: pos, piece: selectedDrop } });
          clearSelection();
          return;
        }
        if (piece && piece.owner === state.currentPlayer) {
          setSelectedDrop(null);
          setSelected(pos);
          return;
        }
        clearSelection();
        return;
      }

      if (selected) {
        if (selected.row === pos.row && selected.col === pos.col) {
          clearSelection();
          return;
        }
        const candidates = boardCandidates.filter((m) => m.to.row === pos.row && m.to.col === pos.col);
        if (candidates.length === 1) {
          dispatch({ type: "MOVE", move: candidates[0] });
          clearSelection();
          return;
        }
        if (candidates.length > 1) {
          const movedPiece = state.board[selected.row][selected.col];
          setPendingPromotion({ from: selected, to: pos, piece: movedPiece!.type });
          return;
        }
        if (piece && piece.owner === state.currentPlayer) {
          setSelected(pos);
          return;
        }
        clearSelection();
        return;
      }

      if (piece && piece.owner === state.currentPlayer) {
        setSelected(pos);
      }
    },
    [state.status, state.board, state.currentPlayer, selected, selectedDrop, legalTargets, boardCandidates, pendingPromotion, clearSelection]
  );

  const resolvePromotion = useCallback(
    (promote: boolean) => {
      if (!pendingPromotion) return;
      dispatch({
        type: "MOVE",
        move: {
          kind: "move",
          player: state.currentPlayer,
          from: pendingPromotion.from,
          to: pendingPromotion.to,
          piece: pendingPromotion.piece,
          promote,
        },
      });
      setPendingPromotion(null);
      clearSelection();
    },
    [pendingPromotion, state.currentPlayer, clearSelection]
  );

  const resign = useCallback(() => {
    dispatch({ type: "RESIGN" });
    clearSelection();
  }, [clearSelection]);

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
    clearSelection();
    setPendingPromotion(null);
  }, [clearSelection]);

  const applyExternalMove = useCallback((move: Parameters<typeof dispatch>[0]) => {
    dispatch(move);
  }, []);

  const promotionEligibleZoneNote = pendingPromotion
    ? isPromotionEligible(pendingPromotion.piece, state.currentPlayer, pendingPromotion.from.row, pendingPromotion.to.row)
    : false;

  return {
    state,
    dispatch: applyExternalMove,
    selected,
    selectedDrop,
    legalTargets,
    checkedKing,
    pendingPromotion,
    promotionEligibleZoneNote,
    selectSquare,
    selectHandPiece,
    resolvePromotion,
    resign,
    reset,
    clearSelection,
  };
}

export type UseShogiGame = ReturnType<typeof useShogiGame>;
