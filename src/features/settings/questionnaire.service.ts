import type {
  CategoryConfig,
  QuestionnaireConfig,
  QuestionConfig,
} from "./questionnaire.types";
import { createId } from "../../shared/utils/id";
import { createInitialQuestionnaire } from "./questionnaire.types";

const normalized = (value: string) => value.trim().toLocaleLowerCase();

export function validateQuestionnaire(
  categories: CategoryConfig[],
  questions: QuestionConfig[],
): string[] {
  const errors: string[] = [];
  const duplicate = (values: string[]) =>
    values.find((value, index) => values.indexOf(value) !== index);
  const categoryKeys = categories.map((item) => normalized(item.stableKey));
  const questionKeys = questions.map((item) => normalized(item.stableKey));
  const activeColumns = questions
    .filter((item) => item.active)
    .map((item) => normalized(item.sourceColumn));

  if (categories.some((item) => !item.stableKey.trim() || !item.name.trim()))
    errors.push("Each category needs a technical key and a name.");
  if (questions.some((item) => !item.stableKey.trim() || !item.label.trim() || !item.sourceColumn.trim()))
    errors.push("Each question needs a technical key, label and source column.");
  if (duplicate(categoryKeys)) errors.push("Category technical keys must be unique.");
  if (duplicate(questionKeys)) errors.push("Question technical keys must be unique.");
  if (duplicate(activeColumns)) errors.push("Two active questions cannot use the same source column.");
  if (questions.some((item) => !categoryKeys.includes(normalized(item.categoryKey))))
    errors.push("Every question must reference an existing category.");
  for (const question of questions.filter((item) => item.responseType === "rating")) {
    if (Object.values(question.scoreMapping ?? {}).some((score) => !Number.isFinite(score)))
      errors.push(`The score mapping for “${question.label}” contains an invalid value.`);
  }
  return errors;
}

export function createQuestionnaireVersion(
  previous: QuestionnaireConfig,
  categories: CategoryConfig[],
  questions: QuestionConfig[],
): QuestionnaireConfig {
  return {
    id: createId(),
    version: previous.version + 1,
    createdAt: new Date().toISOString(),
    active: true,
    legacyAutoDetect: false,
    categories: structuredClone(categories),
    questions: structuredClone(questions),
  };
}

export const activeQuestionnaire = (versions: QuestionnaireConfig[]) =>
  versions.find((item) => item.active) ?? versions[versions.length - 1];

export const exportQuestionnaire = (configuration: QuestionnaireConfig) =>
  JSON.stringify({
    format: "cellspain-questionnaire",
    formatVersion: 1,
    configuration: {
      legacyAutoDetect: Boolean(configuration.legacyAutoDetect),
      categories: configuration.categories,
      questions: configuration.questions,
    },
  }, null, 2);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export function importQuestionnaire(
  contents: string,
  previous: QuestionnaireConfig,
): QuestionnaireConfig {
  let parsed: unknown;
  try {
    parsed = JSON.parse(contents);
  } catch {
    throw new Error("The selected file is not valid JSON.");
  }

  if (!isRecord(parsed)) throw new Error("Invalid questionnaire configuration file.");
  const value = parsed.format === "cellspain-questionnaire" ? parsed.configuration : parsed;
  if (!isRecord(value) || !Array.isArray(value.categories) || !Array.isArray(value.questions))
    throw new Error("Invalid questionnaire configuration file.");

  const categories = value.categories as CategoryConfig[];
  const questions = value.questions as QuestionConfig[];
  const hasInvalidCategory = categories.some((item) =>
    !isRecord(item) || typeof item.stableKey !== "string" ||
    typeof item.name !== "string" || typeof item.active !== "boolean");
  const hasInvalidQuestion = questions.some((item) =>
    !isRecord(item) || typeof item.stableKey !== "string" ||
    typeof item.label !== "string" || typeof item.sourceColumn !== "string" ||
    typeof item.categoryKey !== "string" ||
    !["rating", "verbatim"].includes(String(item.responseType)) ||
    typeof item.required !== "boolean" || typeof item.active !== "boolean");
  if (hasInvalidCategory || hasInvalidQuestion)
    throw new Error("The configuration contains invalid categories or questions.");

  const errors = validateQuestionnaire(categories, questions);
  if (errors.length) throw new Error(errors.join(" "));
  const next = createQuestionnaireVersion(previous, categories, questions);
  next.legacyAutoDetect = value.legacyAutoDetect === true;
  return next;
}

export function resetQuestionnaire(previous: QuestionnaireConfig): QuestionnaireConfig {
  const defaults = createInitialQuestionnaire();
  return {
    ...defaults,
    id: createId(),
    version: previous.version + 1,
    createdAt: new Date().toISOString(),
  };
}
