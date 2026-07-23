import type { Verbatim } from "../../domain/survey.types";
import { isWithinDateRange } from "../../shared/dates/date-range";

export type VerbatimFilters = {
  query: string;
  sentiment: string;
  category: string;
  status: string;
  from: string;
  to: string;
};

export function filterVerbatims(verbatims: Verbatim[], filters: VerbatimFilters) {
  const normalizedQuery = filters.query.toLowerCase();
  return verbatims.filter(
    (verbatim) =>
      isWithinDateRange(verbatim.date, filters.from, filters.to) &&
      (filters.sentiment === "All" || verbatim.sentiment === filters.sentiment) &&
      (filters.category === "All" || verbatim.category === filters.category) &&
      (filters.status === "All" || (verbatim.status ?? "New") === filters.status) &&
      `${verbatim.content} ${verbatim.question}`.toLowerCase().includes(normalizedQuery),
  );
}
