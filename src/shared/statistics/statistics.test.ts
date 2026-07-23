import { describe, expect, it } from "vitest";
import { average, median } from "./statistics";

describe("statistics", () => {
  it("calculates averages", () => {
    expect(average([1, 2, 3, 4])).toBe(2.5);
  });

  it("calculates the conventional median for even-sized samples", () => {
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });

  it("does not mutate the source while calculating the median", () => {
    const values = [4, 1, 3];
    expect(median(values)).toBe(3);
    expect(values).toEqual([4, 1, 3]);
  });
});
