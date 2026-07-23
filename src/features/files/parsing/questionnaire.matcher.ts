import type {
  QuestionnaireConfig,
  QuestionConfig,
} from "../../../domain/questionnaire.types";
import { categoryOf, isComment } from "../../../domain/survey.mapping";
import { DEFAULT_SCORE_MAPPING } from "../../../domain/questionnaire.defaults";

const RESPONDENT_COLUMN = /completion time|start time|country|role/i;
const SENIORITY_COLUMN = /how long|seniority/i;
const SYSTEM_COLUMN = /^(id|email|name|last modified time|survey quarter|test respondent id)$/i;
const SYSTEM_QUESTION_COLUMN = /would you say that your overall situation is improving|would you like to be contacted by hr|who are you|areas should be our mains? focus for improvement/i;

export type SheetImportPlan = {
  headers: string[];
  configurationVersionId: string;
  legacyAutoDetect: boolean;
  ratingQuestions: QuestionConfig[];
  verbatimQuestions: QuestionConfig[];
  categoryNameByKey: Map<string, string>;
  unknownColumns: string[];
};

const normalizedColumn = (value: string) =>
  value.trim().replace(/\s+/g, " ").toLocaleLowerCase();

const excelColumnIndex = (value: string): number | undefined => {
  const reference = value.trim().toUpperCase();
  if (!/^[A-Z]+$/.test(reference)) return undefined;
  return [...reference].reduce(
    (index, letter) => index * 26 + letter.charCodeAt(0) - 64,
    0,
  ) - 1;
};

const resolvedSourceColumn = (
  sourceColumn: string,
  headers: string[],
  headerByNormalizedName: Map<string, string>,
) => {
  const namedHeader = headerByNormalizedName.get(normalizedColumn(sourceColumn));
  if (namedHeader) return namedHeader;
  const columnIndex = excelColumnIndex(sourceColumn);
  return columnIndex === undefined ? sourceColumn : headers[columnIndex] ?? sourceColumn;
};

function categoryKeyFromName(configuration: QuestionnaireConfig, name: string) {
  return configuration.categories.find((item) => item.name === name)?.stableKey ?? "";
}

function builtInQuestion(
  header: string,
  configuration: QuestionnaireConfig,
): QuestionConfig | undefined {
  const category = categoryOf(header);
  if (isComment(header, "This placeholder is long enough to identify a comment column")) {
    return {
      stableKey: `builtin_${header.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")}`,
      label: header,
      sourceColumn: header,
      categoryKey: "",
      responseType: "verbatim",
      active: true,
    };
  }
  if (category !== "Other") {
    return {
      stableKey: `builtin_${header.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")}`,
      label: header,
      sourceColumn: header,
      categoryKey: categoryKeyFromName(configuration, category),
      responseType: "rating",
      active: true,
      scoreMapping: { ...DEFAULT_SCORE_MAPPING },
    };
  }
  return undefined;
}

function effectiveQuestions(headers: string[], configuration: QuestionnaireConfig) {
  if (configuration.legacyAutoDetect) return [];

  const headerByNormalizedName = new Map(
    headers.map((header) => [normalizedColumn(header), header]),
  );
  const explicit = configuration.questions
    .filter((item) => item.active && configuration.categories.some(
      (category) => category.active && category.stableKey === item.categoryKey,
    ))
    .map((item) => ({
      ...item,
      scoreMapping: item.scoreMapping ? { ...item.scoreMapping } : undefined,
      sourceColumn: resolvedSourceColumn(
        item.sourceColumn,
        headers,
        headerByNormalizedName,
      ),
    }));

  const explicitColumns = new Set(
    configuration.questions.map((item) => normalizedColumn(resolvedSourceColumn(
      item.sourceColumn,
      headers,
      headerByNormalizedName,
    ))),
  );
  const builtIns = headers
    .filter((header) => !explicitColumns.has(normalizedColumn(header)))
    .map((header) => builtInQuestion(header, configuration))
    .filter((item): item is QuestionConfig => Boolean(item))
    .filter((item) => !item.categoryKey || configuration.categories.some(
      (category) => category.active && category.stableKey === item.categoryKey,
    ));

  return [...explicit, ...builtIns];
}

export function buildSheetImportPlan(
  headers: string[],
  configuration: QuestionnaireConfig,
): SheetImportPlan {
  const questions = effectiveQuestions(headers, configuration);
  const knownColumns = new Set(
    questions.map((item) => normalizedColumn(item.sourceColumn)),
  );

  return {
    headers: [...headers],
    configurationVersionId: configuration.id,
    legacyAutoDetect: Boolean(configuration.legacyAutoDetect),
    ratingQuestions: questions.filter((item) => item.responseType === "rating"),
    verbatimQuestions: questions.filter((item) => item.responseType === "verbatim"),
    categoryNameByKey: new Map(
      configuration.categories.map((category) => [category.stableKey, category.name]),
    ),
    unknownColumns: configuration.legacyAutoDetect
      ? []
      : headers.filter(
          (header) => !knownColumns.has(normalizedColumn(header)) && !isSystemColumn(header),
        ),
  };
}

export function isSurveyResponseSheet(
  headers: string[],
  configuration: QuestionnaireConfig,
): boolean {
  const containsRespondentData = headers.some((header) => RESPONDENT_COLUMN.test(header));
  return containsRespondentData || (!configuration.legacyAutoDetect && headers.length > 0);
}

function isSystemColumn(header: string) {
  return (
    RESPONDENT_COLUMN.test(header) ||
    SENIORITY_COLUMN.test(header) ||
    SYSTEM_COLUMN.test(header.trim()) ||
    SYSTEM_QUESTION_COLUMN.test(header)
  );
}
