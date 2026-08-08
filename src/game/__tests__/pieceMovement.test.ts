import { describe, expect, it } from "vitest";
import { pseudoLegalMoves } from "../rules/pieceMovement";
import { emptyBoard, place, pos, positionStrings } from "./testUtils";

describe("piece movement (歩兵 pawn)", () => {
  it("moves one square forward only", () => {
    const board = emptyBoard();
    place(board, pos(6, 4), "FU", "sente");
    expect(positionStrings(pseudoLegalMoves(board, pos(6, 4)))).toEqual(["5,4"]);
  });

  it("gote pawn moves toward increasing row", () => {
    const board = emptyBoard();
    place(board, pos(2, 4), "FU", "gote");
    expect(positionStrings(pseudoLegalMoves(board, pos(2, 4)))).toEqual(["3,4"]);
  });
});

describe("piece movement (香車 lance)", () => {
  it("slides forward any distance on an empty file", () => {
    const board = emptyBoard();
    place(board, pos(6, 4), "KY", "sente");
    expect(positionStrings(pseudoLegalMoves(board, pos(6, 4)))).toEqual(
      ["0,4", "1,4", "2,4", "3,4", "4,4", "5,4"].sort()
    );
  });

  it("stops before a blocking own piece", () => {
    const board = emptyBoard();
    place(board, pos(6, 4), "KY", "sente");
    place(board, pos(3, 4), "FU", "sente");
    expect(positionStrings(pseudoLegalMoves(board, pos(6, 4)))).toEqual(["4,4", "5,4"].sort());
  });

  it("may capture an enemy piece but not jump past it", () => {
    const board = emptyBoard();
    place(board, pos(6, 4), "KY", "sente");
    place(board, pos(3, 4), "FU", "gote");
    expect(positionStrings(pseudoLegalMoves(board, pos(6, 4)))).toEqual(["3,4", "4,4", "5,4"].sort());
  });
});

describe("piece movement (桂馬 knight)", () => {
  it("jumps two forward and one to either side", () => {
    const board = emptyBoard();
    place(board, pos(6, 4), "KE", "sente");
    expect(positionStrings(pseudoLegalMoves(board, pos(6, 4)))).toEqual(["4,3", "4,5"].sort());
  });

  it("jumps over intervening pieces", () => {
    const board = emptyBoard();
    place(board, pos(6, 4), "KE", "sente");
    place(board, pos(5, 4), "FU", "sente");
    expect(positionStrings(pseudoLegalMoves(board, pos(6, 4)))).toEqual(["4,3", "4,5"].sort());
  });
});

describe("piece movement (銀将 silver)", () => {
  it("moves forward three ways and diagonally backward", () => {
    const board = emptyBoard();
    place(board, pos(4, 4), "GI", "sente");
    expect(positionStrings(pseudoLegalMoves(board, pos(4, 4)))).toEqual(
      ["3,3", "3,4", "3,5", "5,3", "5,5"].sort()
    );
  });
});

describe("piece movement (金将 gold, and gold-equivalents)", () => {
  it("moves forward three, sideways, and one step back", () => {
    const board = emptyBoard();
    place(board, pos(4, 4), "KI", "sente");
    expect(positionStrings(pseudoLegalMoves(board, pos(4, 4)))).toEqual(
      ["3,3", "3,4", "3,5", "4,3", "4,5", "5,4"].sort()
    );
  });

  it("と金 (promoted pawn) moves exactly like gold", () => {
    const board = emptyBoard();
    place(board, pos(4, 4), "TO", "sente");
    expect(positionStrings(pseudoLegalMoves(board, pos(4, 4)))).toEqual(
      ["3,3", "3,4", "3,5", "4,3", "4,5", "5,4"].sort()
    );
  });
});

describe("piece movement (角行 bishop)", () => {
  it("slides on both diagonals from the center", () => {
    const board = emptyBoard();
    place(board, pos(4, 4), "KA", "sente");
    expect(positionStrings(pseudoLegalMoves(board, pos(4, 4)))).toEqual(
      [
        "3,3", "2,2", "1,1", "0,0",
        "3,5", "2,6", "1,7", "0,8",
        "5,3", "6,2", "7,1", "8,0",
        "5,5", "6,6", "7,7", "8,8",
      ].sort()
    );
  });
});

describe("piece movement (飛車 rook)", () => {
  it("slides horizontally and vertically from the center", () => {
    const board = emptyBoard();
    place(board, pos(4, 4), "HI", "sente");
    const result = positionStrings(pseudoLegalMoves(board, pos(4, 4)));
    expect(result).toHaveLength(16);
    expect(result).toContain("0,4");
    expect(result).toContain("8,4");
    expect(result).toContain("4,0");
    expect(result).toContain("4,8");
  });
});

describe("piece movement (王将/玉将 king)", () => {
  it("moves one square in any of the eight directions", () => {
    const board = emptyBoard();
    place(board, pos(4, 4), "OU", "sente");
    const result = positionStrings(pseudoLegalMoves(board, pos(4, 4)));
    expect(result).toHaveLength(8);
  });

  it("cannot move onto a square occupied by its own piece", () => {
    const board = emptyBoard();
    place(board, pos(4, 4), "OU", "sente");
    place(board, pos(3, 4), "FU", "sente");
    expect(positionStrings(pseudoLegalMoves(board, pos(4, 4)))).not.toContain("3,4");
  });
});

describe("promoted rook/bishop combine slide + step", () => {
  it("龍王 (promoted rook) adds the four diagonal single steps", () => {
    const board = emptyBoard();
    place(board, pos(4, 4), "RY", "sente");
    const result = positionStrings(pseudoLegalMoves(board, pos(4, 4)));
    expect(result).toContain("3,3");
    expect(result).toContain("3,5");
    expect(result).toContain("5,3");
    expect(result).toContain("5,5");
    expect(result).toContain("0,4"); // still slides orthogonally
  });

  it("龍馬 (promoted bishop) adds the four orthogonal single steps", () => {
    const board = emptyBoard();
    place(board, pos(4, 4), "UM", "sente");
    const result = positionStrings(pseudoLegalMoves(board, pos(4, 4)));
    expect(result).toContain("3,4");
    expect(result).toContain("5,4");
    expect(result).toContain("4,3");
    expect(result).toContain("4,5");
    expect(result).toContain("0,0"); // still slides diagonally
  });
});
