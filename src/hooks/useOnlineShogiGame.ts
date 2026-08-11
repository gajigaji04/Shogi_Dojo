// Online PVP driven entirely by HTTP polling against Postgres-backed endpoints —
// no persistent connection of any kind, so this works unmodified on stateless
// serverless functions. Each poll cycle just asks "what does the server currently
// think this game looks like", which is also what makes reconnecting after a
// refresh trivial: as long as we still know the gameId, we just resume polling it.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BasePieceType, BoardMove, GameState, PieceType, Player, Position } from "../game/types/shogi";
import { legalDropSquares, legalMovesFrom } from "../game/rules/legalMoves";
import { findKing } from "../game/rules/check";
import { api, ApiError } from "../api/client";

const ACTIVE_GAME_KEY = "shogi-dojo.activeOnlineGame";
const QUEUE_POLL_MS = 1200;
const GAME_POLL_MS = 900;
const MAX_CONSECUTIVE_FAILURES = 4;

export type OnlinePhase = "connecting" | "searching" | "matched";

export interface PendingPromotion {
  from: Position;
  to: Position;
  piece: PieceType;
}

export interface OnlineGameOverInfo {
  status: GameState["status"];
  winner?: Player;
  resultKind: string;
}

interface QueueStatusResponse {
  matched: boolean;
  gameId?: string;
  color?: Player;
  opponent?: { nickname: string };
  queued?: boolean;
}

interface GameStateResponse {
  state: GameState;
  color: Player;
  status: string;
  resultKind: string | null;
  opponent: { nickname: string };
  canClaimTimeout: boolean;
}

function storeActiveGame(gameId: string) {
  window.localStorage.setItem(ACTIVE_GAME_KEY, gameId);
}
function clearActiveGame() {
  window.localStorage.removeItem(ACTIVE_GAME_KEY);
}
function readActiveGame(): string | null {
  return window.localStorage.getItem(ACTIVE_GAME_KEY);
}

export function useOnlineShogiGame() {
  const [phase, setPhase] = useState<OnlinePhase>("connecting");
  const [connectionError, setConnectionError] = useState(false);
  const [color, setColor] = useState<Player | null>(null);
  const [opponentNickname, setOpponentNickname] = useState<string | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const [state, setState] = useState<GameState | null>(null);
  const [gameOverInfo, setGameOverInfo] = useState<OnlineGameOverInfo | null>(null);
  const [canClaimTimeout, setCanClaimTimeout] = useState(false);

  const [selected, setSelected] = useState<Position | null>(null);
  const [selectedDrop, setSelectedDrop] = useState<BasePieceType | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<PendingPromotion | null>(null);

  const failureCount = useRef(0);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stopped = useRef(false);

  const handleFailure = useCallback(() => {
    failureCount.current += 1;
    if (failureCount.current >= MAX_CONSECUTIVE_FAILURES) setConnectionError(true);
  }, []);
  const handleSuccess = useCallback(() => {
    failureCount.current = 0;
    setConnectionError(false);
  }, []);

  // --- Game state polling, once matched ---------------------------------
  const pollGameState = useCallback(async (id: string) => {
    try {
      const res = await api.get<GameStateResponse>(`/api/online/games/${id}/state`);
      handleSuccess();
      setState(res.state);
      setColor(res.color);
      setOpponentNickname(res.opponent.nickname);
      setCanClaimTimeout(res.canClaimTimeout);
      if (res.status === "FINISHED" || res.status === "ABANDONED") {
        setGameOverInfo({ status: res.state.status, winner: res.state.winner, resultKind: res.resultKind ?? "unknown" });
        clearActiveGame();
        return;
      }
    } catch {
      handleFailure();
    }
    if (!stopped.current) pollTimer.current = setTimeout(() => pollGameState(id), GAME_POLL_MS);
  }, [handleFailure, handleSuccess]);

  // --- Matchmaking polling ------------------------------------------------
  const pollQueue = useCallback(async () => {
    try {
      const res = await api.get<QueueStatusResponse>("/api/online/queue/status");
      handleSuccess();
      if (res.matched && res.gameId && res.color) {
        setGameId(res.gameId);
        setColor(res.color);
        setOpponentNickname(res.opponent?.nickname ?? null);
        storeActiveGame(res.gameId);
        setPhase("matched");
        pollGameState(res.gameId);
        return;
      }
    } catch {
      handleFailure();
    }
    if (!stopped.current) pollTimer.current = setTimeout(pollQueue, QUEUE_POLL_MS);
  }, [handleFailure, handleSuccess, pollGameState]);

  const joinQueue = useCallback(async () => {
    setPhase("connecting");
    try {
      const res = await api.post<QueueStatusResponse>("/api/online/queue/join");
      handleSuccess();
      if (res.matched && res.gameId && res.color) {
        setGameId(res.gameId);
        setColor(res.color);
        storeActiveGame(res.gameId);
        setPhase("matched");
        pollGameState(res.gameId);
      } else {
        setPhase("searching");
        pollTimer.current = setTimeout(pollQueue, QUEUE_POLL_MS);
      }
    } catch {
      handleFailure();
      setPhase("searching");
      pollTimer.current = setTimeout(pollQueue, QUEUE_POLL_MS);
    }
  }, [handleFailure, handleSuccess, pollGameState, pollQueue]);

  const cancelQueue = useCallback(() => {
    if (pollTimer.current) clearTimeout(pollTimer.current);
    api.post("/api/online/queue/leave").catch(() => {});
    setPhase("connecting");
  }, []);

  // --- Mount: resume an in-progress game, or join the queue ---------------
  useEffect(() => {
    stopped.current = false;
    const resumeId = readActiveGame();
    if (resumeId) {
      setGameId(resumeId);
      setPhase("matched");
      pollGameState(resumeId);
    } else {
      joinQueue();
    }
    return () => {
      stopped.current = true;
      if (pollTimer.current) clearTimeout(pollTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Move / resign / promotion / timeout actions -------------------------
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

  const checkedKing = useMemo(() => (state?.isCheck ? findKing(state.board, state.currentPlayer) : null), [state]);

  const clearSelection = useCallback(() => {
    setSelected(null);
    setSelectedDrop(null);
  }, []);

  const myTurn = !!state && state.status === "ongoing" && state.currentPlayer === color;

  const submitMove = useCallback(
    async (move: unknown) => {
      if (!gameId) return;
      try {
        const res = await api.post<{ state: GameState }>(`/api/online/games/${gameId}/move`, { move });
        setState(res.state);
        handleSuccess();
      } catch (err) {
        // A rejected move (stale UI, race with the opponent) just resyncs on the
        // next poll — no need to surface an error for something the server itself
        // already prevented from taking effect.
        if (!(err instanceof ApiError)) handleFailure();
      }
    },
    [gameId, handleFailure, handleSuccess]
  );

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
          submitMove({ kind: "drop", player: color, to: pos, piece: selectedDrop });
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
          submitMove(candidates[0]);
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
    [state, myTurn, selected, selectedDrop, legalTargets, boardCandidates, color, pendingPromotion, submitMove, clearSelection]
  );

  const resolvePromotion = useCallback(
    (promote: boolean) => {
      if (!pendingPromotion || !color) return;
      submitMove({
        kind: "move",
        player: color,
        from: pendingPromotion.from,
        to: pendingPromotion.to,
        piece: pendingPromotion.piece,
        promote,
      });
      setPendingPromotion(null);
      clearSelection();
    },
    [pendingPromotion, color, submitMove, clearSelection]
  );

  const resign = useCallback(async () => {
    if (!gameId) return;
    try {
      const res = await api.post<{ state: GameState }>(`/api/online/games/${gameId}/resign`);
      setState(res.state);
    } catch {
      handleFailure();
    }
  }, [gameId, handleFailure]);

  const claimTimeout = useCallback(async () => {
    if (!gameId) return;
    try {
      const res = await api.post<{ state: GameState }>(`/api/online/games/${gameId}/claim-timeout`);
      setState(res.state);
    } catch {
      handleFailure();
    }
  }, [gameId, handleFailure]);

  const reconnect = useCallback(() => {
    setConnectionError(false);
    failureCount.current = 0;
    stopped.current = false;
    if (gameId) pollGameState(gameId);
    else if (phase === "searching") pollQueue();
    else joinQueue();
  }, [gameId, phase, pollGameState, pollQueue, joinQueue]);

  return {
    phase,
    connectionError,
    color,
    opponentNickname,
    roomId: gameId,
    state,
    gameOverInfo,
    canClaimTimeout,
    joinQueue,
    cancelQueue,
    reconnect,
    selected,
    selectedDrop,
    legalTargets,
    checkedKing,
    pendingPromotion,
    selectSquare,
    selectHandPiece,
    resolvePromotion,
    resign,
    claimTimeout,
    clearSelection,
  };
}

export type UseOnlineShogiGame = ReturnType<typeof useOnlineShogiGame>;
