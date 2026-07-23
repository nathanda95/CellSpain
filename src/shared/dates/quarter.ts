export const quarterLabel = (date?: string) => {
  const parsed = date && new Date(date);
  return parsed && !Number.isNaN(+parsed)
    ? `Q${Math.floor(parsed.getMonth() / 3) + 1} ${parsed.getFullYear()}`
    : "Undated";
};

export const quarterOrder = (label: string) => {
  const match = /^Q([1-4]) (\d{4})$/.exec(label);
  return match
    ? Number(match[2]) * 4 + Number(match[1])
    : Number.MAX_SAFE_INTEGER;
};
