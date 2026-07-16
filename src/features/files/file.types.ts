import type { Verbatim } from "../feedback/feedback.types";
import type { QuestionnaireConfig } from "../settings/questionnaire.types";

export type Answer = {
  question: string;
  category: string;
  score: number;
  date?: string;
  seniority?: string;
  source?: string;
  importId?: string;
  questionKey?: string;
  configurationVersionId?: string;
};

export type ImportItem = {
  id: string;
  name: string;
  size: number;
  importedAt: string;
  status: "Completed" | "Error";
  rows: number;
  verbatims: number;
  error?: string;
  warnings?: string[];
  configurationVersionId?: string;
};

export type Dataset = {
  answers: Answer[];
  verbatims: Verbatim[];
  imports: ImportItem[];
  questionnaireVersions: QuestionnaireConfig[];
};

export const EMPTY_DATASET: Dataset = {
  answers: [],
  verbatims: [],
  imports: [],
  questionnaireVersions: [],
};
