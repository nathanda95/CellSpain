export const average = (numbers: number[]) =>
  numbers.length
    ? numbers.reduce((sum, value) => sum + value, 0) / numbers.length
    : undefined;

export const median = (numbers: number[]) => {
  if (!numbers.length) return undefined;
  const sorted = [...numbers].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
};
