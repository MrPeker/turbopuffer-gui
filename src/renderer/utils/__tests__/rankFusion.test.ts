import { describe, it, expect } from "vitest";
import { reciprocalRankFusion, DEFAULT_RRF_K } from "../rankFusion";
import type { Document } from "../../../types/document";

const doc = (id: string | number, extra: Partial<Document> = {}): Document => ({
  id,
  ...extra,
});

describe("reciprocalRankFusion", () => {
  it("returns an empty list when given no input lists", () => {
    expect(reciprocalRankFusion([])).toEqual([]);
  });

  it("returns an empty list when all input lists are empty", () => {
    expect(reciprocalRankFusion([[], []])).toEqual([]);
  });

  it("preserves single-list order when only one list is provided", () => {
    const a = doc("a");
    const b = doc("b");
    const c = doc("c");
    const fused = reciprocalRankFusion([[a, b, c]]);
    expect(fused.map((d) => d.id)).toEqual(["a", "b", "c"]);
  });

  it("attaches an $rrf_score that decreases by rank", () => {
    const fused = reciprocalRankFusion([[doc("a"), doc("b"), doc("c")]]);
    expect(fused[0].$rrf_score).toBeGreaterThan(fused[1].$rrf_score);
    expect(fused[1].$rrf_score).toBeGreaterThan(fused[2].$rrf_score);
  });

  it("uses 1/(k + rank) with k=60 by default", () => {
    const fused = reciprocalRankFusion([[doc("a")]]);
    expect(fused[0].$rrf_score).toBeCloseTo(1 / (DEFAULT_RRF_K + 0));
  });

  it("sums scores when a document appears in multiple lists", () => {
    // doc 'shared' is rank 0 in list A and rank 0 in list B → 2/(k)
    // doc 'a-only' is rank 1 in list A → 1/(k+1)
    // doc 'b-only' is rank 1 in list B → 1/(k+1)
    const fused = reciprocalRankFusion([
      [doc("shared"), doc("a-only")],
      [doc("shared"), doc("b-only")],
    ]);
    const shared = fused.find((d) => d.id === "shared");
    const aOnly = fused.find((d) => d.id === "a-only");
    const bOnly = fused.find((d) => d.id === "b-only");

    expect(shared!.$rrf_score).toBeCloseTo(2 / DEFAULT_RRF_K);
    expect(aOnly!.$rrf_score).toBeCloseTo(1 / (DEFAULT_RRF_K + 1));
    expect(bOnly!.$rrf_score).toBeCloseTo(1 / (DEFAULT_RRF_K + 1));
  });

  it("orders documents by descending fused score", () => {
    // Same doc appearing in both lists should outrank singletons.
    const fused = reciprocalRankFusion([
      [doc("solo1"), doc("shared")],
      [doc("solo2"), doc("shared")],
    ]);
    expect(fused[0].id).toBe("shared");
  });

  it("breaks ties by first-seen insertion order", () => {
    // Both 'a' and 'b' appear once at rank 0 in their own list → identical scores.
    // 'a' is encountered first.
    const fused = reciprocalRankFusion([[doc("a")], [doc("b")]]);
    expect(fused.map((d) => d.id)).toEqual(["a", "b"]);
    expect(fused[0].$rrf_score).toEqual(fused[1].$rrf_score);
  });

  it("dedupes a document that appears multiple times within the same list", () => {
    // Within a single list the second occurrence still increments score
    // (its rank is higher), but we expect only one entry in the output.
    const fused = reciprocalRankFusion([[doc("a"), doc("a")]]);
    expect(fused).toHaveLength(1);
  });

  it("rejects k <= 0", () => {
    expect(() => reciprocalRankFusion([[doc("a")]], 0)).toThrow();
    expect(() => reciprocalRankFusion([[doc("a")]], -1)).toThrow();
  });

  it("preserves attributes and vector on fused documents", () => {
    const original = doc("a", { attributes: { title: "hi" }, vector: [1, 2, 3] });
    const fused = reciprocalRankFusion([[original]]);
    expect(fused[0].attributes).toEqual({ title: "hi" });
    expect(fused[0].vector).toEqual([1, 2, 3]);
  });

  it("supports a custom k", () => {
    const fused = reciprocalRankFusion([[doc("a")]], 10);
    expect(fused[0].$rrf_score).toBeCloseTo(1 / 10);
  });

  it("handles three-way fusion", () => {
    const fused = reciprocalRankFusion([
      [doc("x"), doc("y")],
      [doc("y"), doc("z")],
      [doc("z"), doc("x")],
    ]);
    // All three appear in exactly two lists. y and z each appear at ranks
    // (0,1) → 1/60 + 1/61; x appears at (0,1) → 1/60 + 1/61. Identical.
    // Tie-break: insertion order x, y, z.
    expect(fused.map((d) => d.id)).toEqual(["x", "y", "z"]);
  });
});
