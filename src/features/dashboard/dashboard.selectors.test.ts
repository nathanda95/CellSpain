import { describe, expect, it } from "vitest";
import type { Answer } from "../files/file.types";
import type { Verbatim } from "../feedback/feedback.types";
import {
  buildDashboardAnalytics,
  buildRadarPeriods,
  buildTrendData,
  filterAnswersByPeriod,
} from "./dashboard.selectors";

const answers: Answer[] = [
  { question: "Q1", category: "Work", score: 2, date: "2026-01-15", seniority: "0-1" },
  { question: "Q2", category: "Work", score: 4, date: "2026-04-15", seniority: "0-1" },
  { question: "Q3", category: "Culture", score: 3, date: "2026-04-20", seniority: "2-3" },
];

const verbatims: Verbatim[] = [
  {
    id: "v1",
    content: "Good",
    question: "Why?",
    category: "Work",
    date: "2026-04-15",
    source: "survey.xlsx",
    sheet: "Sheet1",
    status: "New",
    note: "",
  },
];

describe("dashboard selectors", () => {
  it("filters answers using the selected date bounds", () => {
    expect(filterAnswersByPeriod(answers, { from: "2026-04-01", to: "2026-04-30" })).toHaveLength(2);
  });

  it("builds chronological quarterly trend data", () => {
    const trend = buildTrendData(answers);
    expect(trend.periods.map((point) => point.name)).toEqual(["Q1 2026", "Q2 2026"]);
    expect(trend.series.map((series) => series.name)).toEqual(["Work", "Culture"]);
  });

  it("keeps radar comparisons based on the complete dataset", () => {
    const periods = buildRadarPeriods(answers);
    expect(periods).toHaveLength(2);
    expect(periods[0].name).toBe("Q1 2026");
    expect(periods[1].values.find((value) => value.category === "Culture")?.score).toBe(3);
  });

  it("prepares dashboard metrics from filtered data", () => {
    const analytics = buildDashboardAnalytics(
      answers,
      verbatims,
      { from: "2026-04-01", to: "2026-04-30" },
    );
    expect(analytics.filteredAnswers).toHaveLength(2);
    expect(analytics.averageScore).toBe(3.5);
    expect(analytics.filteredVerbatimCount).toBe(1);
  });
});
