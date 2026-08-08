import { describe, expect, it } from "vitest";
import { isInCheck } from "../rules/check";
import { getLegalMoves, legalMovesFrom } from "../rules/legalMoves";
import { hasNoLegalMoves } from "../rules/checkmate";
import { destinations, emptyBoard, hands, place, pos } from "./testUtils";

describe("check detection", () => {
  it("detects a rook giving check along a file", () => {
    const board = emptyBoard();
    place(board, pos(8, 4), "OU", "sente");
    place(board, pos(0, 4), "HI", "gote");
    expect(isInCheck(board, "sente")).toBe(true);
  });

  it("is false once the king steps off the attacked line", () => {
    const board = emptyBoard();
    place(board, pos(8, 3), "OU", "sente");
    place(board, pos(0, 4), "HI", "gote");
    expect(isInCheck(board, "sente")).toBe(false);
  });
});

describe("pinned pieces cannot expose the king (illegal move prevention)", () => {
  it("a blocking piece may slide along the pin line but not step off it", () => {
    const board = emptyBoard();
    place(board, pos(8, 4), "OU", "sente");
    place(board, pos(4, 4), "GI", "sente");
    place(board, pos(0, 4), "HI", "gote");
    const h = hands();

    const moves = destinations(legalMovesFrom(board, h, pos(4, 4)));
    expect(moves).toContain("3,4"); // stays on the file — still blocks the check
    expect(moves).not.toContain("3,3"); // steps off the file — would expose the king
    expect(moves).not.toContain("5,3");
  });
});

describe("checkmate (詰み)", () => {
  it("recognizes a cornered king with every escape covered as checkmate", () => {
    const board = emptyBoard();
    place(board, pos(0, 0), "OU", "gote");
    place(board, pos(1, 1), "GI", "sente"); // gives check, defended
    place(board, pos(1, 2), "KI", "sente"); // defends (1,1), covers (0,1)
    place(board, pos(3, 0), "KY", "sente"); // covers (1,0)
    const h = hands();

    expect(isInCheck(board, "gote")).toBe(true);
    expect(hasNoLegalMoves(board, h, "gote")).toBe(true);
  });

  it("is not checkmate while a legal escape square remains", () => {
    const board = emptyBoard();
    place(board, pos(0, 0), "OU", "gote");
    place(board, pos(1, 1), "GI", "sente");
    place(board, pos(1, 2), "KI", "sente");
    // no lance covering (1,0) this time — the king can step there
    const h = hands();

    expect(isInCheck(board, "gote")).toBe(true);
    expect(hasNoLegalMoves(board, h, "gote")).toBe(false);
    const moves = destinations(getLegalMoves(board, h, "gote"));
    expect(moves).toContain("1,0");
  });
});
