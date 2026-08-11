// Minimal localStorage-backed persistence for finished games, so /replay and
// /profile have real data to show without needing a backend yet.

import type { GameStatus, HistoryEntry, Player } from "../types/shogi";

export interface GameRecord {
  id: string;
  date: string; // ISO
  opponentLabel: string;
  mode: "cpu" | "tutorial" | "imported";
  status: GameStatus;
  winner?: Player;
  humanPlayer: Player;
  history: HistoryEntry[];
}

const STORAGE_KEY = "shogi-dojo.games";

function readAll(): GameRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as GameRecord[]) : [];
  } catch {
    return [];
  }
}

function writeAll(records: GameRecord[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export function saveCompletedGame(record: Omit<GameRecord, "id" | "date">): GameRecord {
  const full: GameRecord = {
    ...record,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    date: new Date().toISOString(),
  };
  const all = readAll();
  all.unshift(full);
  writeAll(all.slice(0, 100));
  return full;
}

export function listGames(): GameRecord[] {
  return readAll();
}

export function getGame(id: string): GameRecord | undefined {
  return readAll().find((g) => g.id === id);
}
