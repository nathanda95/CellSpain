import { describe, expect, it } from "vitest";
import { mapAnswerToScore } from "./survey.mapping";

describe("legacy score mapping", () => {
  it("maps legacy labels case-insensitively", () => {
    expect(mapAnswerToScore("Stable")).toBe(2);
    expect(mapAnswerToScore("YES!")).toBe(4);
  });
});
