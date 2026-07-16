import type { Sentiment } from "./feedback.types";

export const legacyScoreMap: Record<string, number> = {
  "no way": 1,
  "no": 1,
  meh: 2,
  bof: 2,
  ok: 3,
  "Stable": 2,
  great: 4,
  "top!": 4,
  top: 4,
  "Yes!": 4,
};

// Uniformise les libellés provenant de fichiers saisis manuellement afin que
// les règles ci-dessous ne dépendent ni de la casse ni des espaces superflus.
const normalize = (value: unknown) =>
  String(value ?? "")
    .toLowerCase()
    .replace(/\s+/g, " ");

export const mapAnswerToScore = (
  value: unknown,
  scoreMap: Record<string, number> = legacyScoreMap,
): number | null => {
  // Les exports peuvent contenir soit une note 1–4, soit son libellé textuel.
  if (typeof value === "number" && value >= 1 && value <= 4) return value;
  const numeric = Number(String(value).trim());
  if (numeric >= 1 && numeric <= 4) return numeric;
  return scoreMap[String(value).trim().toLowerCase()] ?? null;
};

export const scoreToSentiment = (score?: number): Sentiment | undefined =>
  score == null
    ? undefined
    : score >= 3.5
      ? "Positive"
      : score >= 2.5
        ? "Neutral"
        : "Negative";

export const categoryOf = (question: string) => {
  // La V1 ne possède pas de référentiel de questions : la catégorie est donc
  // déduite des mots-clés présents dans l'intitulé de la question.
  const normalized = normalize(question);
  if (/atmosphere|ambiance|work environment/.test(normalized))
    return "Work environment";
  if (/mission/.test(normalized)) return "Missions";
  if (/event/.test(normalized)) return "Events";
  if (/grow professionally|development|career/.test(normalized))
    return "Development";
  if (/compensation|salary/.test(normalized)) return "Salary";
  if (/pom|manager/.test(normalized)) return "POM";
  if (/material|resources/.test(normalized)) return "Material";
  if (/proud/.test(normalized)) return "Proudness";
  return "Other";
};

export const isComment = (header: string, value: unknown) => {
  // Une réponse longue n'est considérée comme verbatim que si sa colonne est
  // une question ouverte connue. Cela évite de prendre un rôle pour un commentaire.
  const content = String(value ?? "").trim();
  return (
    content.length >= 18 &&
    /elaborate|improved|holding you back|main issue|mainly missing|mainly explains|particularly appreciate|wish to explain/.test(
      normalize(header),
    )
  );
};
