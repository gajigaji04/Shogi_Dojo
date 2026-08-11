import { describe, expect, it } from "vitest";
import { parseKif, parseMoveToken } from "../notation/kifParser";

describe("parseMoveToken (token-level parsing)", () => {
  it("parses a plain board move with source square", () => {
    expect(parseMoveToken("７六歩(77)")).toEqual({
      same: false,
      file: 7,
      rank: 6,
      fromFile: 7,
      fromRank: 7,
      isDrop: false,
      promote: false,
      pieceType: "FU",
    });
  });

  it("parses a promoting move", () => {
    const parsed = parseMoveToken("２二角成(88)");
    expect(parsed?.promote).toBe(true);
    expect(parsed?.pieceType).toBe("KA");
    expect(parsed?.fromFile).toBe(8);
    expect(parsed?.fromRank).toBe(8);
  });

  it("parses an explicit promotion decline (不成)", () => {
    const parsed = parseMoveToken("２二銀不成(31)");
    expect(parsed?.promote).toBe(false);
    expect(parsed?.pieceType).toBe("GI");
  });

  it("parses a drop (打), with no source square", () => {
    expect(parseMoveToken("５五歩打")).toEqual({
      same: false,
      file: 5,
      rank: 5,
      fromFile: null,
      fromRank: null,
      isDrop: true,
      promote: false,
      pieceType: "FU",
    });
  });

  it("parses 同 (same square as previous move) without file/rank of its own", () => {
    const parsed = parseMoveToken("同歩(64)");
    expect(parsed?.same).toBe(true);
    expect(parsed?.file).toBeNull();
    expect(parsed?.rank).toBeNull();
    expect(parsed?.pieceType).toBe("FU");
    expect(parsed?.fromFile).toBe(6);
    expect(parsed?.fromRank).toBe(4);
  });

  it("recognizes both 王/玉 as the king and 龍/竜 as the promoted rook", () => {
    expect(parseMoveToken("５五王(59)")?.pieceType).toBe("OU");
    expect(parseMoveToken("５五玉(51)")?.pieceType).toBe("OU");
    expect(parseMoveToken("５五龍(28)")?.pieceType).toBe("RY");
    expect(parseMoveToken("５五竜(28)")?.pieceType).toBe("RY");
  });

  it("recognizes multi-character promoted piece names (成香/成桂/成銀)", () => {
    expect(parseMoveToken("４三成香(41)")?.pieceType).toBe("NY");
    expect(parseMoveToken("４三成桂(41)")?.pieceType).toBe("NK");
    expect(parseMoveToken("４三成銀(41)")?.pieceType).toBe("NG");
  });

  it("rejects garbage input", () => {
    expect(parseMoveToken("hello world")).toBeNull();
  });
});

describe("parseKif (full game reconstruction via the real engine)", () => {
  it("replays a short real game — opening moves, a promoting capture, and a drop", () => {
    const kif = `
手合割：平手
先手：Alice
後手：Bob
手数----指手---------消費時間--
   1 ５六歩(57)   ( 0:03/00:00:03)
   2 １四歩(13)   ( 0:02/00:00:02)
   3 ５五歩(56)   ( 0:01/00:00:04)
   4 １五歩(14)   ( 0:03/00:00:05)
   5 ５四歩(55)   ( 0:02/00:00:06)
   6 １六歩(15)   ( 0:01/00:00:06)
   7 ５三歩成(54)   ( 0:05/00:00:11)
   8 ９四歩(93)   ( 0:01/00:00:07)
   9 ５五歩打     ( 0:04/00:00:15)
`;

    const result = parseKif(kif);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.players.sente).toBe("Alice");
    expect(result.players.gote).toBe("Bob");
    expect(result.finalState.history).toHaveLength(9);

    // Move 7 promoted the capturing pawn into と金 on the way through the enemy camp.
    expect(result.finalState.history[6].move.kind).toBe("move");
    const move7 = result.finalState.history[6].move;
    if (move7.kind === "move") expect(move7.promote).toBe(true);
    expect(result.finalState.board[2][4]).toEqual({ type: "TO", owner: "sente" });

    // Move 9 dropped the pawn captured back on move 7.
    expect(result.finalState.history[8].move.kind).toBe("drop");
    expect(result.finalState.board[4][4]).toEqual({ type: "FU", owner: "sente" });
    expect(result.finalState.hands.sente.FU).toBe(0);

    expect(result.finalState.currentPlayer).toBe("gote");
  });

  it("stops cleanly at a resignation marker instead of trying to parse it as a move", () => {
    const kif = `
手合割：平手
   1 ７六歩(77)   ( 0:03/00:00:03)
   2 投了         ( 0:01/00:00:01)
`;
    const result = parseKif(kif);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.finalState.history).toHaveLength(1);
    expect(result.terminalReason).toBe("投了");
  });

  it("rejects non-平手 handicap games with a clear message", () => {
    const kif = `手合割：香落ち\n   1 ３四歩(33)   ( 0:01/00:00:01)\n`;
    const result = parseKif(kif);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.message).toContain("平手");
  });

  it("rejects a move whose claimed source square doesn't hold that player's piece", () => {
    const kif = `手合割：平手\n   1 ５六歩(57)   ( 0:01/00:00:01)\n   2 ５五歩(57)   ( 0:01/00:00:01)\n`;
    // Move 2 claims it's gote moving a pawn from (57) — but sente's pawn vacated that
    // square on move 1, and gote never had a piece there to begin with.
    const result = parseKif(kif);
    expect(result.ok).toBe(false);
  });
});
