import { average } from "../../shared/statistics/statistics";
import type { TrendPoint } from "./dashboard.types";

export function calculateLinearTrend(values: TrendPoint[], seriesKey: string): TrendPoint[] {
  const points = values.flatMap((point, index) => {
    const score = point[seriesKey];
    return typeof score === "number" ? [{ index, score }] : [];
  });
  if (points.length < 2) return values;

  const xAverage = average(points.map((point) => point.index)) ?? 0;
  const yAverage = average(points.map((point) => point.score)) ?? 0;
  const numerator = points.reduce(
    (sum, point) => sum + (point.index - xAverage) * (point.score - yAverage),
    0,
  );
  const denominator = points.reduce(
    (sum, point) => sum + (point.index - xAverage) ** 2,
    0,
  );
  const slope = denominator === 0 ? 0 : numerator / denominator;
  const intercept = yAverage - slope * xAverage;

  return values.map((point, index) => ({
    ...point,
    __trend: Math.max(0, Math.min(4, intercept + slope * index)),
  }));
}

export function calculateScoreDomain(scores: number[]): [number, number] {
  const lowestScore = scores.length ? Math.min(...scores) : 0;
  const highestScore = scores.length ? Math.max(...scores) : 4;
  const scoreRange = highestScore - lowestScore;
  const scalePadding = scoreRange === 0 ? 0.2 : Math.max(scoreRange * 0.12, 0.1);
  return [
    Math.max(0, Math.floor((lowestScore - scalePadding) * 10) / 10),
    Math.min(4, Math.ceil((highestScore + scalePadding) * 10) / 10),
  ];
}
