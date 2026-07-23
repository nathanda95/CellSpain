import { Search } from "lucide-react";
import type { PeriodFilterActions, PeriodFilterState } from "../../../hooks/usePeriodFilter";
import { DateFilters } from "../../../shared/ui/DateFilters";
import { Select } from "../../../shared/ui/Select";

export type VerbatimFilterValues = {
  query: string;
  sentiment: string;
  category: string;
  status: string;
};

export function VerbatimFilters({
  values,
  categories,
  periodState,
  periodActions,
  onChange,
}: {
  values: VerbatimFilterValues;
  categories: string[];
  periodState: PeriodFilterState;
  periodActions: PeriodFilterActions;
  onChange: (patch: Partial<VerbatimFilterValues>) => void;
}) {
  return (
    <div className="filters">
      <Search size={20} />
      <input
        value={values.query}
        onChange={(event) => onChange({ query: event.target.value })}
        placeholder="Search keywords, phrases or topics…"
      />
      <Select
        value={values.sentiment}
        onChange={(sentiment) => onChange({ sentiment })}
        options={["All", "Positive", "Neutral", "Negative"]}
      />
      <Select
        value={values.category}
        onChange={(category) => onChange({ category })}
        options={["All", ...categories]}
      />
      <Select
        value={values.status}
        onChange={(status) => onChange({ status })}
        options={["All", "New", "To review", "Done", "Ignored"]}
      />
      <DateFilters state={periodState} actions={periodActions} />
    </div>
  );
}
