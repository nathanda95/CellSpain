import { describe, expect, it } from "vitest";
import { calculateLinearTrend, calculateScoreDomain } from "./chart.utils";

describe("chart utilities", () => {
  it("adds a linear trend without mutating source points", () => {
    const values = [
      { name: "Q1 2026", overall: 2 },
      { name: "Q2 2026", overall: 3 },
      { name: "Q3 2026", overall: 4 },
    ];
    const result = calculateLinearTrend(values, "overall");
    expect(result.map((point) => point.__trend)).toEqual([2, 3, 4]);
    expect(values.some((point) => "__trend" in point)).toBe(false);
  });

  it("does not add a trend with fewer than two numeric points", () => {
    const values = [{ name: "Q1 2026", overall: 2 }];
    expect(calculateLinearTrend(values, "overall")).toBe(values);
  });

  it("creates a padded score domain bounded between zero and four", () => {
    expect(calculateScoreDomain([2, 3])).toEqual([1.8, 3.2]);
    expect(calculateScoreDomain([4, 4])).toEqual([3.8, 4]);
  });
});
