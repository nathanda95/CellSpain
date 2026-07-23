import { useMemo } from "react";
import type { Answer } from "../domain/survey.types";
import type { Verbatim } from "../domain/survey.types";
import type { PeriodFilterActions, PeriodFilterState } from "../hooks/usePeriodFilter";
import { buildDashboardAnalytics } from "../features/dashboard/dashboard.selectors";
import { CategoryScores } from "../features/dashboard/components/CategoryScores";
import { MetricCard } from "../features/dashboard/components/MetricCard";
import { RadarCard } from "../features/dashboard/components/RadarCard";
import { SeniorityAverageCard } from "../features/dashboard/components/SeniorityAverageCard";
import { SeniorityTrendCard } from "../features/dashboard/components/SeniorityTrendCard";
import { TrendChart } from "../features/dashboard/components/TrendChart";
import { DateFilters } from "../shared/ui/DateFilters";
import { EmptyState } from "../shared/ui/EmptyState";

export function DashboardPage({
  answers,
  verbatims,
  periodState,
  periodActions,
  bounds,
  onManageImports,
}: {
  answers: Answer[];
  verbatims: Verbatim[];
  periodState: PeriodFilterState;
  periodActions: PeriodFilterActions;
  bounds: { from: string; to: string };
  onManageImports: () => void;
}) {
  const analytics = useMemo(
    () => buildDashboardAnalytics(answers, verbatims, bounds),
    [answers, verbatims, bounds.from, bounds.to],
  );

  return (
    <>
      <div className="title">
        <div>
          <h1>Employee Satisfaction Dashboard</h1>
          <p>Analysis built only from your imported survey responses.</p>
        </div>
        <div className="title-actions">
          <DateFilters state={periodState} actions={periodActions} />
          <button className="outline" onClick={onManageImports}>
            Manage imports
          </button>
        </div>
      </div>
      {!answers.length ? (
        <EmptyState
          title="No imported files yet"
          detail="Import an Excel, CSV or JSON survey file to populate the dashboard."
        />
      ) : !analytics.scores.length ? (
        <EmptyState
          title="No data in selected period"
          detail="Try widening or clearing the period filter."
        />
      ) : (
        <>
          <div className="metrics">
            <MetricCard
              label="Overall average"
              value={`${analytics.averageScore!.toFixed(1)}/4`}
              variation={analytics.averageVariation}
              sub={analytics.averageVariation == null ? "Previous period unavailable" : undefined}
            />
            <MetricCard
              label="Overall median"
              value={`${analytics.medianScore!.toFixed(1)}/4`}
              variation={analytics.medianVariation}
              sub={analytics.medianVariation == null ? "Previous period unavailable" : undefined}
            />
            <MetricCard label="Verbatims detected" value={String(analytics.filteredVerbatimCount)} />
          </div>
          <div className="dashboard-grid">
            <TrendChart
              title="Ratings trend by category"
              values={analytics.periods}
              series={analytics.trendSeries}
            />
            <RadarCard periods={analytics.radarPeriods} />
          </div>
          <CategoryScores values={analytics.byCategory} />
          <div className="seniority-dashboard-grid">
            <SeniorityAverageCard values={analytics.seniorityAverages} />
            <SeniorityTrendCard answers={analytics.filteredAnswers} />
          </div>
        </>
      )}
    </>
  );
}
