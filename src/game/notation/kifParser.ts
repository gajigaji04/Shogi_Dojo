// Parser for the KIF (.kif) kifu format. Only 平手 (even, standard starting position)
// games are supported. Every parsed move is replayed through the real `gameReducer`,
// so a KIF file is only accepted if it actually represents a legal game — the parser
// never invents board state of its own.

import type { BasePieceType, GameState, Move, PieceType, Player, Position } from "../types/shogi";
import { gameReducer } from "../state/gameReducer";
import { createInitialGameState } from "../state/gameState";
import { ZENKAKU_DIGITS, KANJI_NUMERALS } from "./kifu";

export interface KifParseResult {
  ok: true;
  finalState: GameState;
  players: { sente?: string; gote?: string };
  terminalReason?: string;
}

export interface KifParseError {
  ok: false;
  message: string;
}

const KANJI_TO_PIECE: Record<string, PieceType> = {
  歩: "FU",
  香: "KY",
  桂: "KE",
  銀: "GI",
  金: "KI",
  角: "KA",
  飛: "HI",
  王: "OU",
  玉: "OU",
  と: "TO",
  成香: "NY",
  成桂: "NK",
  成銀: "NG",
  馬: "UM",
  龍: "RY",
  竜: "RY",
};

const TERMINAL_KEYWORDS = new Set([
  "投了",
  "中断",
  "千日手",
  "切れ負け",
  "反則勝ち",
  "反則負け",
  "持将棋",
  "入玉勝ち",
  "不戦勝",
  "不戦敗",
  "詰み",
]);

function parseFileChar(ch: string): number | null {
  const z = ZENKAKU_DIGITS.indexOf(ch);
  if (z >= 0) return z + 1;
  if (ch >= "1" && ch <= "9") return Number(ch);
  return null;
}

function parseRankChar(ch: string): number | null {
  const k = KANJI_NUMERALS.indexOf(ch);
  if (k >= 0) return k + 1;
  if (ch >= "1" && ch <= "9") return Number(ch);
  return null;
}

export interface ParsedToken {
  same: boolean;
  file: number | null;
  rank: number | null;
  fromFile: number | null;
  fromRank: number | null;
  isDrop: boolean;
  promote: boolean;
  pieceType: PieceType;
}

export function parseMoveToken(rawToken: string): ParsedToken | null {
  let rest = rawToken.trim();

  let same = false;
  if (rest.startsWith("同")) {
    same = true;
    rest = rest.slice(1).replace(/^[\s　]+/, "");
  }

  let file: number | null = null;
  let rank: number | null = null;
  if (!same) {
    file = parseFileChar(rest[0]);
    rank = parseRankChar(rest[1]);
    if (file === null || rank === null) return null;
    rest = rest.slice(2);
  }

  let fromFile: number | null = null;
  let fromRank: number | null = null;
  const parenMatch = rest.match(/\((\d)(\d)\)\s*$/);
  if (parenMatch) {
    fromFile = Number(parenMatch[1]);
    fromRank = Number(parenMatch[2]);
    rest = rest.slice(0, parenMatch.index).trim();
  }

  let isDrop = false;
  if (rest.endsWith("打")) {
    isDrop = true;
    rest = rest.slice(0, -1);
  }

  let promote = false;
  if (rest.endsWith("不成")) {
    rest = rest.slice(0, -2);
  } else if (rest.endsWith("成")) {
    promote = true;
    rest = rest.slice(0, -1);
  }

  const pieceKanji = rest.trim();
  const pieceType = KANJI_TO_PIECE[pieceKanji];
  if (!pieceType) return null;

  return { same, file, rank, fromFile, fromRank, isDrop, promote, pieceType };
}

function stripTimingInfo(text: string): string {
  return text.replace(/\(\s*\d+:\d+\/\d+:\d+:\d+\s*\)\s*$/, "").trim();
}

export function parseKif(text: string): KifParseResult | KifParseError {
  const lines = text.split(/\r\n|\r|\n/);

  let senteName: string | undefined;
  let goteName: string | undefined;
  let sawHandicapLine = false;

  for (const line of lines) {
    const senteMatch = line.match(/^先手[：:]\s*(.+)$/);
    if (senteMatch) senteName = senteMatch[1].trim();
    const goteMatch = line.match(/^後手[：:]\s*(.+)$/);
    if (goteMatch) goteName = goteMatch[1].trim();
    const handicapMatch = line.match(/^手合割[：:]\s*(.+)$/);
    if (handicapMatch) {
      sawHandicapLine = true;
      if (handicapMatch[1].trim() !== "平手") {
        return { ok: false, message: `駒落ち(${handicapMatch[1].trim()})는 아직 지원하지 않습니다. 平手 기보만 불러올 수 있습니다.` };
      }
    }
  }
  void sawHandicapLine; // absence just means "assume 平手" — most exported KIFs omit it for even games.

  let state: GameState = createInitialGameState();
  let lastTo: Position | undefined;
  let terminalReason: string | undefined;
  let moveLineCount = 0;

  for (const rawLine of lines) {
    const lineMatch = rawLine.match(/^\s*(\d+)\s+(.+)$/);
    if (!lineMatch) continue;

    const moveToken = stripTimingInfo(lineMatch[2]);
    if (moveToken.length === 0) continue;

    if (TERMINAL_KEYWORDS.has(moveToken)) {
      terminalReason = moveToken;
      break;
    }

    const parsed = parseMoveToken(moveToken);
    if (!parsed) {
      return { ok: false, message: `${moveLineCount + 1}수(${moveToken})를 해석할 수 없습니다.` };
    }
    moveLineCount++;

    const player: Player = state.currentPlayer;

    let to: Position;
    if (parsed.same) {
      if (!lastTo) return { ok: false, message: `${moveLineCount}수: "同"은 이전 수가 있어야 사용할 수 있습니다.` };
      to = lastTo;
    } else {
      to = { row: parsed.rank! - 1, col: 9 - parsed.file! };
    }

    let move: Move;
    if (parsed.isDrop) {
      move = { kind: "drop", player, to, piece: parsed.pieceType as BasePieceType };
    } else {
      if (parsed.fromFile === null || parsed.fromRank === null) {
        return { ok: false, message: `${moveLineCount}수(${moveToken}): 이동 전 위치 정보(예: (77))가 없습니다.` };
      }
      move = {
        kind: "move",
        player,
        from: { row: parsed.fromRank - 1, col: 9 - parsed.fromFile },
        to,
        piece: parsed.pieceType,
        promote: parsed.promote,
      };
    }

    const next = gameReducer(state, { type: "MOVE", move });
    if (next === state) {
      return { ok: false, message: `${moveLineCount}수(${moveToken})가 규칙상 불가능한 수입니다.` };
    }
    state = next;
    lastTo = to;
  }

  return { ok: true, finalState: state, players: { sente: senteName, gote: goteName }, terminalReason };
}

/** KIF files are traditionally Shift-JIS; modern tools also export UTF-8. Try
 * Shift-JIS first (most common in the wild) and fall back to UTF-8. */
export function decodeKifBytes(buffer: ArrayBuffer): string {
  try {
    const shiftJis = new TextDecoder("shift_jis", { fatal: true }).decode(buffer);
    if (!shiftJis.includes("�")) return shiftJis;
  } catch {
    // fall through to UTF-8
  }
  return new TextDecoder("utf-8").decode(buffer);
}
