import type { QuestionnaireConfig } from "./questionnaire.types";
import type { Answer, Verbatim } from "./survey.types";

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
  /** Questionnaire snapshot used for this import. Optional only for legacy persisted data. */
  configurationVersionId?: string;
};

export type Dataset = {
  answers: Answer[];
  verbatims: Verbatim[];
  imports: ImportItem[];
  /** Append-only questionnaire history. Old versions must remain available forever. */
  questionnaireVersions: QuestionnaireConfig[];
};

export const EMPTY_DATASET: Dataset = {
  answers: [],
  verbatims: [],
  imports: [],
  questionnaireVersions: [],
};
