import type { QuestionnaireConfig } from "../../domain/questionnaire.types";
import type { Answer, Verbatim } from "../../domain/survey.types";
import { belongsToImport } from "../../domain/import-association";
import { readSurveySheets } from "./parsing/file.reader";
import {
  buildSheetImportPlan,
  isSurveyResponseSheet,
} from "./parsing/questionnaire.matcher";
import { parseSurveyRow } from "./parsing/survey.parser";

export type ParsedFile = {
  answers: Answer[];
  verbatims: Verbatim[];
  rows: number;
  warnings: string[];
};

/**
 * Parses one import against an immutable questionnaire snapshot.
 * Historical data stores the snapshot id and resolved labels/categories, so a
 * later questionnaire version can never reinterpret an older import.
 */
export async function parseWorkbook(
  file: File,
  importId: string,
  configuration: QuestionnaireConfig,
): Promise<ParsedFile> {
  const questionnaireSnapshot = structuredClone(configuration);
  const sheets = await readSurveySheets(file);
  const result: ParsedFile = { answers: [], verbatims: [], rows: 0, warnings: [] };

  for (const sheet of sheets) {
    const headers = [...new Set(sheet.rows.flatMap((row) => Object.keys(row)))];
    if (!isSurveyResponseSheet(headers, questionnaireSnapshot)) continue;

    const plan = buildSheetImportPlan(headers, questionnaireSnapshot);
    if (plan.unknownColumns.length) {
      result.warnings.push(
        `${plan.unknownColumns.length} unconfigured column${plan.unknownColumns.length > 1 ? "s" : ""}: ${plan.unknownColumns.join(", ")}`,
      );
    }

    result.rows += sheet.rows.length;
    for (const row of sheet.rows) {
      const parsed = parseSurveyRow(row, plan, {
        sheetName: sheet.name,
        fileName: file.name,
        importId,
      });
      result.answers.push(...parsed.answers);
      result.verbatims.push(...parsed.verbatims);
    }
  }

  return result;
}

// Backward-compatible export for existing callers/tests.
export { belongsToImport };
