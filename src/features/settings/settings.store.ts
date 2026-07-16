export type PeriodMode = "All" | "Month" | "Year" | "Custom period";

const dateValue = (date?: string) => {
  const parsed = date && new Date(date);
  if (!parsed || Number.isNaN(+parsed)) return "";
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${parsed.getFullYear()}-${month}-${day}`;
};

export const isWithinDateRange = (
  date: string | undefined,
  from: string,
  to: string,
) => {
  // Le format ISO YYYY-MM-DD peut être comparé alphabétiquement sans reconvertir
  // chaque borne en timestamp.
  if (!from && !to) return true;
  const value = dateValue(date);
  return Boolean(value) && (!from || value >= from) && (!to || value <= to);
};

export const periodBounds = (
  mode: PeriodMode,
  month: string,
  year: string,
  from: string,
  to: string,
) => {
  // Tous les modes de l'interface sont ramenés à une même paire de dates. Le
  // reste de l'application n'a ainsi pas besoin de connaître le filtre choisi.
  if (mode === "Month" && month) {
    const [yearValue, monthValue] = month.split("-").map(Number);
    const lastDay = new Date(yearValue, monthValue, 0).getDate();
    return {
      from: `${month}-01`,
      to: `${month}-${String(lastDay).padStart(2, "0")}`,
    };
  }
  if (mode === "Year" && /^\d{4}$/.test(year))
    return { from: `${year}-01-01`, to: `${year}-12-31` };
  if (mode === "Custom period") return { from, to };
  return { from: "", to: "" };
};
