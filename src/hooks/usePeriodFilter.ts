import { useMemo, useState } from "react";
import { periodBounds, type PeriodMode } from "../features/settings/settings.store";

export type PeriodFilterState = {
  mode: PeriodMode;
  month: string;
  year: string;
  dateFrom: string;
  dateTo: string;
};

export type PeriodFilterActions = {
  setMode: (value: PeriodMode) => void;
  setMonth: (value: string) => void;
  setYear: (value: string) => void;
  setDateFrom: (value: string) => void;
  setDateTo: (value: string) => void;
  clear: () => void;
};

export function usePeriodFilter() {
  const [mode, setMode] = useState<PeriodMode>("All");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const bounds = useMemo(
    () => periodBounds(mode, month, year, dateFrom, dateTo),
    [mode, month, year, dateFrom, dateTo],
  );

  const clear = () => {
    setMonth("");
    setYear("");
    setDateFrom("");
    setDateTo("");
  };

  return {
    state: { mode, month, year, dateFrom, dateTo },
    actions: { setMode, setMonth, setYear, setDateFrom, setDateTo, clear },
    bounds,
  };
}
