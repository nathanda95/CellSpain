import type { Answer } from "../files/file.types";
import type { Verbatim } from "../feedback/feedback.types";
import { average, median, period, periodOrder } from "../feedback/feedback.store";
import { isWithinDateRange } from "../settings/settings.store";
import type { DashboardAnalytics, RadarPeriod, TrendPoint, TrendSeries } from "./dashboard.types";

export type DateBounds = { from: string; to: string };

const unique = <T,>(values: T[]) => [...new Set(values)];

export function filterAnswersByPeriod(answers: Answer[], bounds: DateBounds) {
  return answers.filter((answer) => isWithinDateRange(answer.date, bounds.from, bounds.to));
}

export function buildTrendData(answers: Answer[], keyPrefix = "category"): {
  series: TrendSeries[];
  periods: TrendPoint[];
} {
  const categories = unique(answers.map((answer) => answer.category));
  const series = categories.map((name, index) => ({ key: `${keyPrefix}-${index}`, name }));
  const periodNames = unique(answers.map((answer) => period(answer.date)))
    .filter((name) => name !== "Undated")
    .sort((left, right) => periodOrder(left) - periodOrder(right));

  const periods = periodNames.map((name) => {
    const periodAnswers = answers.filter((answer) => period(answer.date) === name);
    return series.reduce<TrendPoint>(
      (point, item) => {
        point[item.key] = average(
          periodAnswers
            .filter((answer) => answer.category === item.name)
            .map((answer) => answer.score),
        );
        return point;
      },
      { name, overall: average(periodAnswers.map((answer) => answer.score)) },
    );
  });

  return { series, periods };
}

export function buildRadarPeriods(answers: Answer[]): RadarPeriod[] {
  const periodNames = unique(answers.map((answer) => period(answer.date)))
    .filter((name) => name !== "Undated")
    .sort((left, right) => periodOrder(left) - periodOrder(right));
  const categories = unique(answers.map((answer) => answer.category));

  return periodNames.map((name) => ({
    name,
    values: categories.map((category) => ({
      category,
      score: average(
        answers
          .filter(
            (answer) => period(answer.date) === name && answer.category === category,
          )
          .map((answer) => answer.score),
      ),
    })),
  }));
}

export function metricVariation(
  answers: Answer[],
  periodNames: string[],
  calculator: (scores: number[]) => number | undefined,
) {
  if (periodNames.length < 2) return undefined;
  const [previousPeriodName, currentPeriodName] = periodNames.slice(-2);
  const valueFor = (periodName: string) =>
    calculator(
      answers
        .filter((answer) => period(answer.date) === periodName)
        .map((answer) => answer.score),
    );
  const previousValue = valueFor(previousPeriodName);
  const currentValue = valueFor(currentPeriodName);
  if (previousValue == null || currentValue == null || previousValue === 0) return undefined;
  return ((currentValue - previousValue) / previousValue) * 100;
}

export function buildDashboardAnalytics(
  answers: Answer[],
  verbatims: Verbatim[],
  bounds: DateBounds,
): DashboardAnalytics {
  const filteredAnswers = filterAnswersByPeriod(answers, bounds);
  const filteredVerbatimCount = verbatims.filter((verbatim) =>
    isWithinDateRange(verbatim.date, bounds.from, bounds.to),
  ).length;
  const scores = filteredAnswers.map((answer) => answer.score);
  const categories = unique(filteredAnswers.map((answer) => answer.category));
  const byCategory = categories
    .map((name) => ({
      name,
      value: average(
        filteredAnswers
          .filter((answer) => answer.category === name)
          .map((answer) => answer.score),
      ) ?? 0,
    }))
    .filter((categoryScore) => categoryScore.value);
  const seniorities = unique(
    filteredAnswers.map((answer) => answer.seniority).filter((value): value is string => Boolean(value)),
  );
  const seniorityAverages = seniorities.map((name) => ({
    name,
    value:
      average(
        filteredAnswers
          .filter((answer) => answer.seniority === name)
          .map((answer) => answer.score),
      ) ?? 0,
  }));
  const trend = buildTrendData(filteredAnswers);
  const comparisonPeriodNames = trend.periods.map((item) => String(item.name));

  return {
    filteredAnswers,
    filteredVerbatimCount,
    scores,
    averageScore: average(scores),
    medianScore: median(scores),
    averageVariation: metricVariation(filteredAnswers, comparisonPeriodNames, average),
    medianVariation: metricVariation(filteredAnswers, comparisonPeriodNames, median),
    byCategory,
    seniorityAverages,
    trendSeries: trend.series,
    periods: trend.periods,
    radarPeriods: buildRadarPeriods(answers),
  };
}
