import { describe, expect, it } from "vitest";
import { isPromotionEligible, isPromotionForced, promote } from "../rules/promotion";

describe("promotion eligibility (成り)", () => {
  it("歩兵 entering the enemy camp (rows 0-2 for sente) may promote", () => {
    expect(isPromotionEligible("FU", "sente", 3, 2)).toBe(true);
  });

  it("a move that starts and ends outside the camp is not eligible", () => {
    expect(isPromotionEligible("FU", "sente", 5, 4)).toBe(false);
  });

  it("a move leaving the enemy camp is still eligible (from-side counts too)", () => {
    expect(isPromotionEligible("FU", "sente", 2, 3)).toBe(true);
  });

  it("金将 and 王将 are never eligible", () => {
    expect(isPromotionEligible("KI", "sente", 1, 0)).toBe(false);
    expect(isPromotionEligible("OU", "sente", 1, 0)).toBe(false);
  });
});

describe("forced promotion (行き所のない駒)", () => {
  it("歩兵 reaching the last rank must promote", () => {
    expect(isPromotionForced("FU", "sente", 0)).toBe(true);
    expect(isPromotionForced("FU", "gote", 8)).toBe(true);
  });

  it("香車 reaching the last rank must promote", () => {
    expect(isPromotionForced("KY", "sente", 0)).toBe(true);
  });

  it("桂馬 reaching either of the last two ranks must promote", () => {
    expect(isPromotionForced("KE", "sente", 0)).toBe(true);
    expect(isPromotionForced("KE", "sente", 1)).toBe(true);
    expect(isPromotionForced("KE", "sente", 2)).toBe(false);
  });

  it("銀将 is never forced (it retains a legal move on the last rank)", () => {
    expect(isPromotionForced("GI", "sente", 0)).toBe(false);
  });
});

describe("promotion transforms", () => {
  it("角行 promotes to 龍馬", () => expect(promote("KA")).toBe("UM"));
  it("飛車 promotes to 龍王", () => expect(promote("HI")).toBe("RY"));
  it("銀将 promotes to 成銀", () => expect(promote("GI")).toBe("NG"));
  it("香車 promotes to 成香", () => expect(promote("KY")).toBe("NY"));
  it("桂馬 promotes to 成桂", () => expect(promote("KE")).toBe("NK"));
  it("歩兵 promotes to と金", () => expect(promote("FU")).toBe("TO"));
});
