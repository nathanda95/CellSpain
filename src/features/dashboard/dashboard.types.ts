import type { Answer } from "../../domain/survey.types";

export type CategoryScore = { name: string; value: number };
export type SeniorityScore = { name: string; value: number };
export type TrendSeries = { key: string; name: string };
export type TrendPoint = Record<string, string | number | undefined>;
export type RadarPeriod = {
  name: string;
  values: { category: string; score: number | undefined }[];
};

export type DashboardAnalytics = {
  filteredAnswers: Answer[];
  filteredVerbatimCount: number;
  scores: number[];
  averageScore: number | undefined;
  medianScore: number | undefined;
  averageVariation: number | undefined;
  medianVariation: number | undefined;
  byCategory: CategoryScore[];
  seniorityAverages: SeniorityScore[];
  trendSeries: TrendSeries[];
  periods: TrendPoint[];
  radarPeriods: RadarPeriod[];
};
