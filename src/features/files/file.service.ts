import * as XLSX from "xlsx";
import {
  categoryOf,
  isComment,
  mapAnswerToScore,
  scoreToSentiment,
} from "../feedback/feedback.service";
import type { Verbatim } from "../feedback/feedback.types";
import type { Answer, ImportItem } from "./file.types";
import type {
  QuestionnaireConfig,
  QuestionConfig,
} from "../settings/questionnaire.types";
import { DEFAULT_SCORE_MAPPING } from "../settings/questionnaire.types";
import { createId } from "../../shared/utils/id";

type SurveyRow = Record<string, unknown>;

type SurveySheet = {
  name: string;
  rows: SurveyRow[];
};

type ParsedFile = {
  answers: Answer[];
  verbatims: Verbatim[];
  rows: number;
  warnings: string[];
};

type Respondent = {
  date?: string;
  role?: string;
  seniority?: string;
};

const RESPONDENT_COLUMN = /completion time|start time|country|role/i;
const DATE_COLUMN = /completion time|start time/i;
const ROLE_COLUMN = /core role|role/i;
const SENIORITY_COLUMN = /how long|seniority/i;
const SYSTEM_COLUMN = /^(id|email|name|last modified time|survey quarter|test respondent id)$/i;
const SYSTEM_QUESTION_COLUMN = /would you say that your overall situation is improving|would you like to be contacted by hr|who are you|areas should be our mains? focus for improvement/i;

// Excel/CSV headers commonly contain invisible trailing spaces or slightly
// different casing. They should still match the configured source column.
const normalizedColumn = (value: string) =>
  value.trim().replace(/\s+/g, " ").toLocaleLowerCase();

const excelColumnIndex = (value: string): number | undefined => {
  const reference = value.trim().toUpperCase();
  if (!/^[A-Z]+$/.test(reference)) return undefined;

  const oneBasedIndex = [...reference].reduce(
    (index, letter) => index * 26 + letter.charCodeAt(0) - 64,
    0,
  );
  return oneBasedIndex - 1;
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
      scoreMapping: DEFAULT_SCORE_MAPPING,
    };
  }
  return undefined;
}

const isSystemColumn = (header: string) =>
  RESPONDENT_COLUMN.test(header) ||
  SENIORITY_COLUMN.test(header) ||
  SYSTEM_COLUMN.test(header.trim()) ||
  SYSTEM_QUESTION_COLUMN.test(header);

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
      // Use the actual workbook header when it differs only in formatting so
      // row lookup succeeds. Excel references such as U, V or AA are also
      // resolved to the header at that position.
      sourceColumn: resolvedSourceColumn(
        item.sourceColumn,
        headers,
        headerByNormalizedName,
      ),
    }));
  // Every explicitly configured column is reserved, including inactive ones,
  // so automatic detection cannot silently reactivate a disabled question.
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

/**
 * Point d'entrée de l'import.
 * Le format du fichier est traité séparément de l'interprétation des réponses :
 * cette fonction ne fait qu'orchestrer la lecture des feuilles et des lignes.
 */
export async function parseWorkbook(
  file: File,
  importId: string,
  configuration: QuestionnaireConfig,
): Promise<ParsedFile> {
  const sheets = await readSurveySheets(file);
  const result: ParsedFile = { answers: [], verbatims: [], rows: 0, warnings: [] };

  for (const sheet of sheets) {
    if (!isSurveyResponseSheet(sheet, configuration)) continue;

    const headers = sheet.rows[0] ? Object.keys(sheet.rows[0]) : [];
    const configured = effectiveQuestions(headers, configuration);
    if (!configuration.legacyAutoDetect) {
      const known = new Set(
        configured.map((item) => normalizedColumn(item.sourceColumn)),
      );
      const unknown = headers.filter(
        (header) =>
          !known.has(normalizedColumn(header)) && !isSystemColumn(header),
      );
      if (unknown.length) result.warnings.push(`${unknown.length} unconfigured column${unknown.length > 1 ? "s" : ""}: ${unknown.join(", ")}`);
    }

    result.rows += sheet.rows.length;

    for (const row of sheet.rows) {
      const parsedRow = parseSurveyRow(row, sheet.name, file.name, importId, configuration);
      result.answers.push(...parsedRow.answers);
      result.verbatims.push(...parsedRow.verbatims);
    }
  }

  return result;
}

async function readSurveySheets(file: File): Promise<SurveySheet[]> {
  // Le JSON n'est pas un classeur : il doit être lu directement comme du texte.
  if (hasExtension(file.name, "json")) {
    return readJsonFile(file);
  }

  return readSpreadsheetFile(file);
}

async function readJsonFile(file: File): Promise<SurveySheet[]> {
  const content: unknown = JSON.parse(await file.text());

  if (!Array.isArray(content)) {
    throw new Error("JSON must be an array of survey response objects");
  }

  const rows = content.filter(isSurveyRow);
  if (rows.length === 0) {
    throw new Error("JSON must be an array of survey response objects");
  }

  return [{ name: "JSON", rows }];
}

async function readSpreadsheetFile(file: File): Promise<SurveySheet[]> {
  const workbook = XLSX.read(await file.arrayBuffer(), { cellDates: true });
  const sheetNames = hasExtension(file.name, "csv")
    ? workbook.SheetNames
    : // Pour un classeur Excel, les réponses sont lues depuis le premier onglet,
      // quel que soit son nom.
      workbook.SheetNames.slice(0, 1);

  if (sheetNames.length === 0) {
    throw new Error("The spreadsheet does not contain any sheet");
  }

  return sheetNames.map((name) => ({
    name,
    rows: XLSX.utils.sheet_to_json<SurveyRow>(workbook.Sheets[name], {
      defval: "",
      raw: false,
    }),
  }));
}

function parseSurveyRow(
  row: SurveyRow,
  sheetName: string,
  fileName: string,
  importId: string,
  configuration: QuestionnaireConfig,
): Pick<ParsedFile, "answers" | "verbatims"> {
  // Les métadonnées du répondant sont lues une seule fois puis partagées par
  // toutes les réponses et tous les commentaires issus de cette ligne.
  const headers = Object.keys(row);
  const respondent = readRespondent(row, headers);
  const answers = readAnswers(row, headers, respondent, fileName, importId, configuration);
  const verbatims = readVerbatims(
    row,
    headers,
    answers,
    respondent,
    sheetName,
    fileName,
    importId,
    configuration,
  );

  return { answers, verbatims };
}

function readRespondent(row: SurveyRow, headers: string[]): Respondent {
  return {
    date: readColumn(row, headers, DATE_COLUMN),
    role: readColumn(row, headers, ROLE_COLUMN),
    seniority: readColumn(row, headers, SENIORITY_COLUMN),
  };
}

function readAnswers(
  row: SurveyRow,
  headers: string[],
  respondent: Respondent,
  fileName: string,
  importId: string,
  configuration: QuestionnaireConfig,
): Answer[] {
  const answers: Answer[] = [];

  const configuredQuestions = configuration.legacyAutoDetect
    ? headers.map<QuestionConfig>((sourceColumn) => ({
        stableKey: sourceColumn,
        label: sourceColumn,
        sourceColumn,
        categoryKey: "",
        responseType: "rating",
        active: true,
      }))
    : effectiveQuestions(headers, configuration).filter((item) => item.responseType === "rating");

  for (const configuredQuestion of configuredQuestions) {
    const question = configuredQuestion.sourceColumn;
    const score = mapAnswerToScore(row[question], configuredQuestion.scoreMapping);
    const category = configuration.legacyAutoDetect
      ? categoryOf(question)
      : configuration.categories.find((item) => item.stableKey === configuredQuestion.categoryKey)?.name ?? "Other";

    if (score === null || category === "Other") continue;

    answers.push({
      question: configuredQuestion.label,
      category,
      score,
      date: respondent.date,
      seniority: respondent.seniority,
      source: fileName,
      importId,
      questionKey: configuredQuestion.stableKey,
      configurationVersionId: configuration.id,
    });
  }

  return answers;
}

function readVerbatims(
  row: SurveyRow,
  headers: string[],
  answers: Answer[],
  respondent: Respondent,
  sheetName: string,
  fileName: string,
  importId: string,
  configuration: QuestionnaireConfig,
): Verbatim[] {
  const verbatims: Verbatim[] = [];
  // Le questionnaire ne relie pas explicitement un commentaire à une note.
  // Par convention, on utilise donc la dernière réponse notée de la même ligne.
  const relatedAnswer = answers[answers.length - 1];

  const commentQuestions = configuration.legacyAutoDetect
    ? headers.filter((question) => isComment(question, row[question]))
    : effectiveQuestions(headers, configuration)
        .filter((item) => item.responseType === "verbatim")
        .map((item) => item.sourceColumn);
  for (const question of commentQuestions) {
    const content = row[question];
    if (!String(content ?? "").trim()) continue;

    const configuredQuestion = configuration.legacyAutoDetect
      ? undefined
      : effectiveQuestions(headers, configuration).find((item) => item.sourceColumn === question);
    const configuredCategory = configuration.categories.find((item) => item.stableKey === configuredQuestion?.categoryKey)?.name;
    const category = configuredCategory ?? relatedAnswer?.category ?? categoryOf(question);
    const score = relatedAnswer?.score;

    verbatims.push({
      id: createId(),
      content: String(content).trim(),
      question,
      category,
      score,
      sentiment: scoreToSentiment(score),
      date: respondent.date,
      role: respondent.role,
      seniority: respondent.seniority,
      source: fileName,
      sheet: sheetName,
      status: "New",
      note: "",
      importId,
      questionKey: configuredQuestion?.stableKey ?? question,
      configurationVersionId: configuration.id,
    });
  }

  return verbatims;
}

function isSurveyResponseSheet(sheet: SurveySheet, configuration: QuestionnaireConfig): boolean {
  // La feuille sélectionnée doit contenir au moins une colonne permettant
  // d'identifier les données d'un répondant.
  const headers = sheet.rows[0] ? Object.keys(sheet.rows[0]) : [];
  const containsRespondentData = headers.some((header) =>
    RESPONDENT_COLUMN.test(header),
  );

  return containsRespondentData || (!configuration.legacyAutoDetect && headers.length > 0);
}

function readColumn(
  row: SurveyRow,
  headers: string[],
  columnPattern: RegExp,
): string | undefined {
  const header = headers.find((candidate) => columnPattern.test(candidate));
  const value = header ? String(row[header] ?? "").trim() : "";
  return value || undefined;
}

function isSurveyRow(value: unknown): value is SurveyRow {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function hasExtension(fileName: string, extension: string): boolean {
  return fileName.toLowerCase().endsWith(`.${extension}`);
}

export function belongsToImport(
  item: Answer | Verbatim,
  target: ImportItem,
  imports: ImportItem[],
): boolean {
  // Les imports récents possèdent un identifiant fiable.
  if (item.importId) return item.importId === target.id;

  // Compatibilité avec les données enregistrées avant l'ajout de importId.
  if (item.source === target.name) return true;

  const completedImports = imports.filter(
    (existingImport) => existingImport.status === "Completed",
  );

  // Dernier recours pour les anciennes données qui ne contiennent même pas
  // leur fichier source : l'association n'est sûre que s'il n'existe qu'un import.
  return completedImports.length === 1 && completedImports[0].id === target.id;
}
