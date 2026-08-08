import { useEffect, useMemo, useState } from "react";
import type { HistoryEntry } from "../game/types/shogi";
import { createInitialBoard } from "../game/state/gameState";
import { emptyHands } from "../game/rules/boardOps";

export function useReplayPlayer(history: HistoryEntry[]) {
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    if (!isPlaying) return;
    if (currentIndex >= history.length - 1) {
      setIsPlaying(false);
      return;
    }
    const timer = setTimeout(() => setCurrentIndex((i) => i + 1), 1000 / speed);
    return () => clearTimeout(timer);
  }, [isPlaying, currentIndex, speed, history.length]);

  const snapshot = useMemo(() => {
    if (currentIndex === -1 || !history[currentIndex]) {
      return { board: createInitialBoard(), hands: emptyHands() };
    }
    const entry = history[currentIndex];
    return { board: entry.boardAfter, hands: entry.handsAfter };
  }, [currentIndex, history]);

  return {
    currentIndex,
    totalMoves: history.length,
    isPlaying,
    speed,
    ...snapshot,
    goFirst: () => setCurrentIndex(-1),
    goPrev: () => setCurrentIndex((i) => Math.max(-1, i - 1)),
    goNext: () => setCurrentIndex((i) => Math.min(history.length - 1, i + 1)),
    goLast: () => setCurrentIndex(history.length - 1),
    goTo: (index: number) => setCurrentIndex(Math.max(-1, Math.min(history.length - 1, index))),
    togglePlay: () => setIsPlaying((p) => !p),
    setSpeed,
  };
}
