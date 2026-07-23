import { describe, expect, it } from "vitest";
import type { Verbatim } from "./feedback.types";
import { filterVerbatims } from "./feedback.selectors";

const verbatims: Verbatim[] = [
  {
    id: "positive",
    content: "Great team atmosphere",
    question: "What do you appreciate?",
    category: "Work",
    sentiment: "Positive",
    date: "2026-04-10",
    source: "survey.xlsx",
    sheet: "Sheet1",
    status: "Done",
    note: "",
  },
  {
    id: "negative",
    content: "Salary could improve",
    question: "What should improve?",
    category: "Salary",
    sentiment: "Negative",
    date: "2026-01-10",
    source: "survey.xlsx",
    sheet: "Sheet1",
    status: "New",
    note: "",
  },
];

describe("filterVerbatims", () => {
  it("combines text, sentiment, category, status and date filters", () => {
    const result = filterVerbatims(verbatims, {
      query: "atmosphere",
      sentiment: "Positive",
      category: "Work",
      status: "Done",
      from: "2026-04-01",
      to: "2026-04-30",
    });
    expect(result.map((item) => item.id)).toEqual(["positive"]);
  });
});
