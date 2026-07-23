import { useMemo, useState } from "react";
import type { Answer } from "../domain/survey.types";
import type { Verbatim } from "../domain/survey.types";
import type { PeriodFilterActions, PeriodFilterState } from "../hooks/usePeriodFilter";
import { filterVerbatims } from "../features/feedback/feedback.selectors";
import {
  VerbatimFilters,
  type VerbatimFilterValues,
} from "../features/feedback/components/VerbatimFilters";
import { VerbatimCard } from "../features/feedback/components/VerbatimCard";
import { VerbatimDetails } from "../features/feedback/components/VerbatimDetails";
import { EmptyState } from "../shared/ui/EmptyState";

const INITIAL_FILTERS: VerbatimFilterValues = {
  query: "",
  sentiment: "All",
  category: "All",
  status: "All",
};

export function VerbatimsPage({
  answers,
  verbatims,
  periodState,
  periodActions,
  bounds,
  onUpdateVerbatim,
}: {
  answers: Answer[];
  verbatims: Verbatim[];
  periodState: PeriodFilterState;
  periodActions: PeriodFilterActions;
  bounds: { from: string; to: string };
  onUpdateVerbatim: (id: string, patch: Partial<Verbatim>) => void;
}) {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [selectedVerbatim, setSelectedVerbatim] = useState<Verbatim | null>(null);
  const categories = useMemo(() => [...new Set(answers.map((answer) => answer.category))], [answers]);
  const matchingVerbatims = useMemo(
    () =>
      filterVerbatims(verbatims, {
        ...filters,
        from: bounds.from,
        to: bounds.to,
      }),
    [verbatims, filters, bounds.from, bounds.to],
  );

  const saveSelectedVerbatim = (patch: Partial<Verbatim>) => {
    if (!selectedVerbatim) return;
    onUpdateVerbatim(selectedVerbatim.id, patch);
    setSelectedVerbatim((current) => (current ? { ...current, ...patch } : current));
  };

  return (
    <>
      <div className="title">
        <div>
          <h1>Verbatims</h1>
          <p>
            {verbatims.length
              ? `${verbatims.length} real comments detected in imported files`
              : "No free-text comments have been detected yet."}
          </p>
        </div>
      </div>
      {!verbatims.length ? (
        <EmptyState
          title="No verbatims available"
          detail="Import a survey that includes real free-text comment columns."
        />
      ) : (
        <>
          <VerbatimFilters
            values={filters}
            categories={categories}
            periodState={periodState}
            periodActions={periodActions}
            onChange={(patch) => setFilters((current) => ({ ...current, ...patch }))}
          />
          <div className="verbatim-list">
            {matchingVerbatims.map((verbatim) => (
              <VerbatimCard key={verbatim.id} item={verbatim} onOpen={setSelectedVerbatim} />
            ))}
          </div>
          {!matchingVerbatims.length && (
            <EmptyState title="No matching comments" detail="Try clearing some filters." />
          )}
        </>
      )}
      {selectedVerbatim && (
        <VerbatimDetails
          item={selectedVerbatim}
          onClose={() => setSelectedVerbatim(null)}
          onSave={saveSelectedVerbatim}
        />
      )}
    </>
  );
}
