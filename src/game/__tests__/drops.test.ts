import { describe, expect, it } from "vitest";
import { structurallyLegalDropSquares } from "../rules/drops";
import { legalDropSquares } from "../rules/legalMoves";
import { destinations, emptyBoard, hands, place, pos } from "./testUtils";

describe("drop rules — structural (行き所のない駒, 二歩)", () => {
  it("歩兵 cannot be dropped on the last rank (no legal move from there)", () => {
    const board = emptyBoard();
    const squares = structurallyLegalDropSquares(board, "FU", "sente");
    expect(squares.some((p) => p.row === 0)).toBe(false);
    expect(squares.some((p) => p.row === 8)).toBe(true); // fine for sente, far from its own last rank
  });

  it("香車 cannot be dropped on the last rank", () => {
    const board = emptyBoard();
    const squares = structurallyLegalDropSquares(board, "KY", "sente");
    expect(squares.some((p) => p.row === 0)).toBe(false);
  });

  it("桂馬 cannot be dropped on either of the last two ranks", () => {
    const board = emptyBoard();
    const squares = structurallyLegalDropSquares(board, "KE", "sente");
    expect(squares.some((p) => p.row === 0 || p.row === 1)).toBe(false);
    expect(squares.some((p) => p.row === 2)).toBe(true);
  });

  it("二歩: cannot drop 歩兵 on a file that already has your own unpromoted pawn", () => {
    const board = emptyBoard();
    place(board, pos(4, 3), "FU", "sente");
    const squares = structurallyLegalDropSquares(board, "FU", "sente");
    expect(squares.some((p) => p.col === 3)).toBe(false);
    expect(squares.some((p) => p.col === 2)).toBe(true);
  });

  it("二歩 does not apply to a file whose pawn has already promoted (と金)", () => {
    const board = emptyBoard();
    place(board, pos(4, 3), "TO", "sente");
    const squares = structurallyLegalDropSquares(board, "FU", "sente");
    expect(squares.some((p) => p.col === 3)).toBe(true);
  });

  it("cannot drop on an occupied square", () => {
    const board = emptyBoard();
    place(board, pos(4, 4), "FU", "gote");
    const squares = structurallyLegalDropSquares(board, "KY", "sente");
    expect(squares.some((p) => p.row === 4 && p.col === 4)).toBe(false);
  });
});

describe("打ち歩詰め (illegal pawn-drop checkmate)", () => {
  it("forbids a 歩兵 drop that gives an inescapable, defended checkmate", () => {
    const board = emptyBoard();
    place(board, pos(0, 0), "OU", "gote");
    place(board, pos(2, 1), "GI", "sente"); // defends (1,0), covers (1,1)
    place(board, pos(1, 2), "KI", "sente"); // covers (0,1)
    const h = hands({ sente: { FU: 1 } });

    const squares = legalDropSquares(board, h, "sente", "FU");
    expect(destinations(squares.map((to) => ({ to })))).not.toContain("1,0");
  });

  it("allows a 歩兵 drop that gives check but leaves the king an escape (capturing the pawn)", () => {
    const board = emptyBoard();
    place(board, pos(0, 0), "OU", "gote");
    const h = hands({ sente: { FU: 1 } });

    const squares = legalDropSquares(board, h, "sente", "FU");
    expect(destinations(squares.map((to) => ({ to })))).toContain("1,0");
  });
});
