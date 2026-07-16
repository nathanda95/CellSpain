export const average = (numbers: number[]) =>
  numbers.length
    ? numbers.reduce((sum, value) => sum + value, 0) / numbers.length
    : undefined;

export const median = (numbers: number[]) => {
  // La copie protège le tableau fourni : Array.sort modifie son entrée en place.
  const sorted = [...numbers].sort((a, b) => a - b);
  return sorted.length ? sorted[Math.floor(sorted.length / 2)] : undefined;
};

export const areaScoreColor = (score: number) =>
  score >= 3 ? "#2e9d62" : score >= 2 ? "#e08a2e" : "#d64545";

export const period = (date?: string) => {
  // Les graphiques regroupent les réponses datées par trimestre civil.
  const parsed = date && new Date(date);
  return parsed && !Number.isNaN(+parsed)
    ? `Q${Math.floor(parsed.getMonth() / 3) + 1} ${parsed.getFullYear()}`
    : "Undated";
};

export const periodOrder = (label: string) => {
  // Transforme "Q2 2026" en clé numérique afin de trier plusieurs années.
  const match = /^Q([1-4]) (\d{4})$/.exec(label);
  return match
    ? Number(match[2]) * 4 + Number(match[1])
    : Number.MAX_SAFE_INTEGER;
};
