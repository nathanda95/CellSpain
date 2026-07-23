import type { Answer, Verbatim } from "../../../domain/survey.types";
import type { QuestionConfig } from "../../../domain/questionnaire.types";
import { createId } from "../../../shared/utils/id";
import {
  categoryOf,
  isComment,
  mapAnswerToScore,
  scoreToSentiment,
} from "../../../domain/survey.mapping";
import type { SurveyRow } from "./file.reader";
import type { SheetImportPlan } from "./questionnaire.matcher";

const DATE_COLUMN = /completion time|start time/i;
const ROLE_COLUMN = /core role|role/i;
const SENIORITY_COLUMN = /how long|seniority/i;

type Respondent = {
  date?: string;
  role?: string;
  seniority?: string;
};

type RowContext = {
  sheetName: string;
  fileName: string;
  importId: string;
};

export function parseSurveyRow(
  row: SurveyRow,
  plan: SheetImportPlan,
  context: RowContext,
): { answers: Answer[]; verbatims: Verbatim[] } {
  const respondent = readRespondent(row, plan.headers);
  const answers = readAnswers(row, plan, respondent, context);
  const verbatims = readVerbatims(row, plan, answers, respondent, context);
  return { answers, verbatims };
}

function readAnswers(
  row: SurveyRow,
  plan: SheetImportPlan,
  respondent: Respondent,
  context: RowContext,
): Answer[] {
  const configuredQuestions = plan.legacyAutoDetect
    ? plan.headers.map<QuestionConfig>((sourceColumn) => ({
        stableKey: sourceColumn,
        label: sourceColumn,
        sourceColumn,
        categoryKey: "",
        responseType: "rating",
        active: true,
      }))
    : plan.ratingQuestions;

  return configuredQuestions.flatMap((configuredQuestion) => {
    const sourceColumn = configuredQuestion.sourceColumn;
    const score = mapAnswerToScore(row[sourceColumn], configuredQuestion.scoreMapping);
    const category = plan.legacyAutoDetect
      ? categoryOf(sourceColumn)
      : plan.categoryNameByKey.get(configuredQuestion.categoryKey) ?? "Other";

    if (score === null || category === "Other") return [];

    return [{
      question: configuredQuestion.label,
      category,
      score,
      date: respondent.date,
      seniority: respondent.seniority,
      source: context.fileName,
      importId: context.importId,
      questionKey: configuredQuestion.stableKey,
      configurationVersionId: plan.configurationVersionId,
    }];
  });
}

function readVerbatims(
  row: SurveyRow,
  plan: SheetImportPlan,
  answers: Answer[],
  respondent: Respondent,
  context: RowContext,
): Verbatim[] {
  const relatedAnswer = answers[answers.length - 1];
  const configuredQuestions = plan.legacyAutoDetect
    ? plan.headers
        .filter((sourceColumn) => isComment(sourceColumn, row[sourceColumn]))
        .map<QuestionConfig>((sourceColumn) => ({
          stableKey: sourceColumn,
          label: sourceColumn,
          sourceColumn,
          categoryKey: "",
          responseType: "verbatim",
          active: true,
        }))
    : plan.verbatimQuestions;

  return configuredQuestions.flatMap((configuredQuestion) => {
    const sourceColumn = configuredQuestion.sourceColumn;
    const content = String(row[sourceColumn] ?? "").trim();
    if (!content) return [];

    const configuredCategory = plan.categoryNameByKey.get(configuredQuestion.categoryKey);
    const category = configuredCategory ?? relatedAnswer?.category ?? categoryOf(sourceColumn);
    const score = relatedAnswer?.score;

    return [{
      id: createId(),
      content,
      question: sourceColumn,
      category,
      score,
      sentiment: scoreToSentiment(score),
      date: respondent.date,
      role: respondent.role,
      seniority: respondent.seniority,
      source: context.fileName,
      sheet: context.sheetName,
      status: "New" as const,
      note: "",
      importId: context.importId,
      questionKey: configuredQuestion.stableKey,
      configurationVersionId: plan.configurationVersionId,
    }];
  });
}

function readRespondent(row: SurveyRow, headers: string[]): Respondent {
  return {
    date: readColumn(row, headers, DATE_COLUMN),
    role: readColumn(row, headers, ROLE_COLUMN),
    seniority: readColumn(row, headers, SENIORITY_COLUMN),
  };
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
