export const quarterLabel = (date?: string) => {
  const parsed = date && new Date(date);

  if (!parsed || Number.isNaN(+parsed)) {
    return "Undated";
  }

  const month = parsed.getMonth();
  const calendarYear = parsed.getFullYear();

  let quarter: number;

  if (month >= 6 && month <= 8) {
    // July -> September
    quarter = 1;
  } else if (month >= 9 && month <= 11) {
    // October -> December
    quarter = 2;
  } else if (month >= 0 && month <= 2) {
    // January -> March
    quarter = 3;
  } else {
    // April -> June
    quarter = 4;
  }

  // The displayed year corresponds to the year
  // in which the July -> June cycle started.
  const periodYear = month >= 6
    ? calendarYear
    : calendarYear - 1;

  return `Q${quarter} ${periodYear}`;
};

export const quarterOrder = (label: string) => {
  const match = /^Q([1-4]) (\d{4})$/.exec(label);

  if (!match) {
    return Number.MAX_SAFE_INTEGER;
  }

  const quarter = Number(match[1]);
  const year = Number(match[2]);

  return year * 4 + quarter;
};