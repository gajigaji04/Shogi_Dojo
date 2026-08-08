import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BasePieceType, BoardMove, GameState, Move, PieceType, Player, Position } from "../game/types/shogi";
import { legalDropSquares, legalMovesFrom } from "../game/rules/legalMoves";
import { findKing } from "../game/rules/check";
import { getToken } from "../auth/tokenStorage";

export type OnlineConnectionStatus = "connecting" | "open" | "closed";
export type OnlineQueueStatus = "idle" | "searching" | "matched";

export interface PendingPromotion {
  from: Position;
  to: Position;
  piece: PieceType;
}

export interface OnlineGameOverInfo {
  status: GameState["status"];
  winner?: Player;
  resultKind: "checkmate" | "resign" | "disconnect";
}

export function useOnlineShogiGame() {
  const wsRef = useRef<WebSocket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<OnlineConnectionStatus>("connecting");
  const [queueStatus, setQueueStatus] = useState<OnlineQueueStatus>("idle");
  const [color, setColor] = useState<Player | null>(null);
  const [opponentNickname, setOpponentNickname] = useState<string | null>(null);
  const [state, setState] = useState<GameState | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [gameOverInfo, setGameOverInfo] = useState<OnlineGameOverInfo | null>(null);
  const [opponentDisconnected, setOpponentDisconnected] = useState(false);

  const [selected, setSelected] = useState<Position | null>(null);
  const [selectedDrop, setSelectedDrop] = useState<BasePieceType | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<PendingPromotion | null>(null);

  useEffect(() => {
    const token = getToken();
    const url = `${import.meta.env.VITE_WS_URL}?token=${encodeURIComponent(token ?? "")}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => setConnectionStatus("open");
    ws.onclose = () => setConnectionStatus("closed");
    ws.onerror = () => setConnectionStatus("closed");
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      switch (msg.type) {
        case "queued":
          setQueueStatus("searching");
          break;
        case "matched":
          setQueueStatus("matched");
          setColor(msg.color);
          setOpponentNickname(msg.opponent.nickname);
          setState(msg.state);
          setRoomId(msg.roomId);
          break;
        case "state":
          setState(msg.state);
          setSelected(null);
          setSelectedDrop(null);
          setPendingPromotion(null);
          break;
        case "move_rejected":
          setSelected(null);
          setSelectedDrop(null);
          setPendingPromotion(null);
          break;
        case "game_over":
          setGameOverInfo({ status: msg.status, winner: msg.winner, resultKind: msg.resultKind });
          break;
        case "opponent_disconnected":
          setOpponentDisconnected(true);
          break;
        default:
          break;
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  const send = useCallback((payload: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    }
  }, []);

  const joinQueue = useCallback(() => send({ type: "join_queue" }), [send]);
  const cancelQueue = useCallback(() => {
    send({ type: "leave_queue" });
    setQueueStatus("idle");
  }, [send]);

  const boardCandidates: BoardMove[] = useMemo(() => {
    if (!selected || !state) return [];
    return legalMovesFrom(state.board, state.hands, selected);
  }, [selected, state]);

  const legalTargets: Position[] = useMemo(() => {
    if (!state || state.currentPlayer !== color) return [];
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
    if (selectedDrop && color) {
      return legalDropSquares(state.board, state.hands, color, selectedDrop);
    }
    return [];
  }, [state, color, selected, selectedDrop, boardCandidates]);

  const checkedKing = useMemo(
    () => (state?.isCheck ? findKing(state.board, state.currentPlayer) : null),
    [state]
  );

  const clearSelection = useCallback(() => {
    setSelected(null);
    setSelectedDrop(null);
  }, []);

  const myTurn = !!state && state.status === "ongoing" && state.currentPlayer === color;

  const selectHandPiece = useCallback(
    (type: BasePieceType) => {
      if (!myTurn || !state || pendingPromotion) return;
      if (state.hands[color!][type] <= 0) return;
      setSelected(null);
      setSelectedDrop((current) => (current === type ? null : type));
    },
    [myTurn, state, color, pendingPromotion]
  );

  const selectSquare = useCallback(
    (pos: Position) => {
      if (!state || !myTurn || pendingPromotion) return;
      const piece = state.board[pos.row][pos.col];

      if (selectedDrop) {
        const isTarget = legalTargets.some((t) => t.row === pos.row && t.col === pos.col);
        if (isTarget) {
          send({ type: "move", move: { kind: "drop", player: color, to: pos, piece: selectedDrop } as Move });
          clearSelection();
          return;
        }
        if (piece && piece.owner === color) {
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
          send({ type: "move", move: candidates[0] });
          clearSelection();
          return;
        }
        if (candidates.length > 1) {
          const movedPiece = state.board[selected.row][selected.col];
          setPendingPromotion({ from: selected, to: pos, piece: movedPiece!.type });
          return;
        }
        if (piece && piece.owner === color) {
          setSelected(pos);
          return;
        }
        clearSelection();
        return;
      }

      if (piece && piece.owner === color) setSelected(pos);
    },
    [state, myTurn, selected, selectedDrop, legalTargets, boardCandidates, color, pendingPromotion, send, clearSelection]
  );

  const resolvePromotion = useCallback(
    (promote: boolean) => {
      if (!pendingPromotion || !color) return;
      send({
        type: "move",
        move: {
          kind: "move",
          player: color,
          from: pendingPromotion.from,
          to: pendingPromotion.to,
          piece: pendingPromotion.piece,
          promote,
        } as Move,
      });
      setPendingPromotion(null);
      clearSelection();
    },
    [pendingPromotion, color, send, clearSelection]
  );

  const resign = useCallback(() => send({ type: "resign" }), [send]);

  return {
    connectionStatus,
    queueStatus,
    color,
    opponentNickname,
    state,
    roomId,
    gameOverInfo,
    opponentDisconnected,
    joinQueue,
    cancelQueue,
    selected,
    selectedDrop,
    legalTargets,
    checkedKing,
    pendingPromotion,
    selectSquare,
    selectHandPiece,
    resolvePromotion,
    resign,
    clearSelection,
  };
}

export type UseOnlineShogiGame = ReturnType<typeof useOnlineShogiGame>;
