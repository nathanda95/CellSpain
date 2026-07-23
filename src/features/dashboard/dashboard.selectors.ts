import type { Answer, Verbatim } from "../../domain/survey.types";
import { isWithinDateRange, type DateBounds } from "../../shared/dates/date-range";
import { quarterLabel, quarterOrder } from "../../shared/dates/quarter";
import { average, median } from "../../shared/statistics/statistics";
import type {
  DashboardAnalytics,
  RadarPeriod,
  TrendPoint,
  TrendSeries,
} from "./dashboard.types";

const unique = <T,>(values: T[]) => [...new Set(values)];

const scoresBy = (
  answers: Answer[],
  keyOf: (answer: Answer) => string | undefined,
) => {
  const groups = new Map<string, number[]>();
  for (const answer of answers) {
    const key = keyOf(answer);
    if (!key) continue;
    const scores = groups.get(key) ?? [];
    scores.push(answer.score);
    groups.set(key, scores);
  }
  return groups;
};

const answersByQuarter = (answers: Answer[]) => {
  const groups = new Map<string, Answer[]>();
  for (const answer of answers) {
    const quarter = quarterLabel(answer.date);
    if (quarter === "Undated") continue;
    const group = groups.get(quarter) ?? [];
    group.push(answer);
    groups.set(quarter, group);
  }
  return groups;
};

const chronologicalQuarters = (groups: Map<string, unknown>) =>
  [...groups.keys()].sort((left, right) => quarterOrder(left) - quarterOrder(right));

export function filterAnswersByPeriod(answers: Answer[], bounds: DateBounds) {
  return answers.filter((answer) =>
    isWithinDateRange(answer.date, bounds.from, bounds.to),
  );
}

export function buildTrendData(
  answers: Answer[],
  keyPrefix = "category",
): { series: TrendSeries[]; periods: TrendPoint[] } {
  const categories = unique(answers.map((answer) => answer.category));
  const series = categories.map((name, index) => ({
    key: `${keyPrefix}-${index}`,
    name,
  }));
  const groupedByQuarter = answersByQuarter(answers);

  const periods = chronologicalQuarters(groupedByQuarter).map((name) => {
    const periodAnswers = groupedByQuarter.get(name) ?? [];
    const categoryScores = scoresBy(periodAnswers, (answer) => answer.category);

    return series.reduce<TrendPoint>(
      (point, item) => {
        point[item.key] = average(categoryScores.get(item.name) ?? []);
        return point;
      },
      { name, overall: average(periodAnswers.map((answer) => answer.score)) },
    );
  });

  return { series, periods };
}

export function buildRadarPeriods(answers: Answer[]): RadarPeriod[] {
  const categories = unique(answers.map((answer) => answer.category));
  const groupedByQuarter = answersByQuarter(answers);

  return chronologicalQuarters(groupedByQuarter).map((name) => {
    const categoryScores = scoresBy(
      groupedByQuarter.get(name) ?? [],
      (answer) => answer.category,
    );
    return {
      name,
      values: categories.map((category) => ({
        category,
        score: average(categoryScores.get(category) ?? []),
      })),
    };
  });
}

export function metricVariation(
  answers: Answer[],
  periodNames: string[],
  calculator: (scores: number[]) => number | undefined,
) {
  if (periodNames.length < 2) return undefined;
  const [previousPeriodName, currentPeriodName] = periodNames.slice(-2);
  const groupedByQuarter = answersByQuarter(answers);
  const valueFor = (periodName: string) =>
    calculator(
      (groupedByQuarter.get(periodName) ?? []).map((answer) => answer.score),
    );
  const previousValue = valueFor(previousPeriodName);
  const currentValue = valueFor(currentPeriodName);
  if (previousValue == null || currentValue == null || previousValue === 0) {
    return undefined;
  }
  return ((currentValue - previousValue) / previousValue) * 100;
}

export function buildDashboardAnalytics(
  answers: Answer[],
  verbatims: Verbatim[],
  bounds: DateBounds,
): DashboardAnalytics {
  const filteredAnswers = filterAnswersByPeriod(answers, bounds);
  const scores = filteredAnswers.map((answer) => answer.score);
  const categoryScores = scoresBy(filteredAnswers, (answer) => answer.category);
  const seniorityScores = scoresBy(filteredAnswers, (answer) => answer.seniority);
  const trend = buildTrendData(filteredAnswers);
  const comparisonPeriodNames = trend.periods.map((item) => String(item.name));

  return {
    filteredAnswers,
    filteredVerbatimCount: verbatims.filter((verbatim) =>
      isWithinDateRange(verbatim.date, bounds.from, bounds.to),
    ).length,
    scores,
    averageScore: average(scores),
    medianScore: median(scores),
    averageVariation: metricVariation(
      filteredAnswers,
      comparisonPeriodNames,
      average,
    ),
    medianVariation: metricVariation(
      filteredAnswers,
      comparisonPeriodNames,
      median,
    ),
    byCategory: [...categoryScores.entries()]
      .map(([name, categoryValues]) => ({
        name,
        value: average(categoryValues) ?? 0,
      }))
      .filter((categoryScore) => categoryScore.value),
    seniorityAverages: [...seniorityScores.entries()].map(([name, values]) => ({
      name,
      value: average(values) ?? 0,
    })),
    trendSeries: trend.series,
    periods: trend.periods,
    radarPeriods: buildRadarPeriods(answers),
  };
}
