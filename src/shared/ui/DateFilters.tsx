import { CalendarDays } from "lucide-react";
import type { PeriodFilterActions, PeriodFilterState } from "../../hooks/usePeriodFilter";
import type { PeriodMode } from "../dates/date-range";
import { Select } from "./Select";

export function DateFilters({
  state,
  actions,
}: {
  state: PeriodFilterState;
  actions: PeriodFilterActions;
}) {
  const hasValue = Boolean(state.month || state.year || state.dateFrom || state.dateTo);

  return (
    <>
      <Select
        value={state.mode}
        onChange={(value) => actions.setMode(value as PeriodMode)}
        options={["All", "Month", "Year", "Custom period"]}
      />
      {state.mode === "Month" && (
        <label className="date-filter">
          <CalendarDays size={16} />
          <span>Month</span>
          <input
            type="month"
            value={state.month}
            onChange={(event) => actions.setMonth(event.target.value)}
          />
        </label>
      )}
      {state.mode === "Year" && (
        <label className="date-filter">
          <CalendarDays size={16} />
          <span>Year</span>
          <input
            type="number"
            min="1900"
            max="2100"
            step="1"
            value={state.year}
            placeholder="2026"
            onChange={(event) => actions.setYear(event.target.value)}
          />
        </label>
      )}
      {state.mode === "Custom period" && (
        <>
          <label className="date-filter">
            <CalendarDays size={16} />
            <span>From</span>
            <input
              type="date"
              value={state.dateFrom}
              max={state.dateTo || undefined}
              onChange={(event) => actions.setDateFrom(event.target.value)}
            />
          </label>
          <label className="date-filter">
            <CalendarDays size={16} />
            <span>To</span>
            <input
              type="date"
              value={state.dateTo}
              min={state.dateFrom || undefined}
              onChange={(event) => actions.setDateTo(event.target.value)}
            />
          </label>
        </>
      )}
      {hasValue && (
        <button className="clear-filter" onClick={actions.clear}>
          Clear period
        </button>
      )}
    </>
  );
}
