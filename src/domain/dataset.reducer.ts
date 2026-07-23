import { belongsToImport } from "./import-association";
import type { Dataset, ImportItem } from "./dataset.types";
import type { QuestionnaireConfig } from "./questionnaire.types";
import type { Answer, Verbatim } from "./survey.types";

export type DatasetAction =
  | {
      type: "IMPORT_COMPLETED";
      item: ImportItem;
      answers: Answer[];
      verbatims: Verbatim[];
    }
  | { type: "IMPORT_FAILED"; item: ImportItem }
  | { type: "IMPORT_REMOVED"; item: ImportItem }
  | { type: "VERBATIM_UPDATED"; id: string; patch: Partial<Verbatim> }
  | { type: "QUESTIONNAIRE_ACTIVATED"; questionnaire: QuestionnaireConfig };

export function datasetReducer(state: Dataset, action: DatasetAction): Dataset {
  switch (action.type) {
    case "IMPORT_COMPLETED": {
      const configurationVersionId = action.item.configurationVersionId;
      return {
        ...state,
        answers: [
          ...state.answers,
          ...action.answers.map((answer) => ({
            ...answer,
            importId: action.item.id,
            configurationVersionId: configurationVersionId ?? answer.configurationVersionId,
          })),
        ],
        verbatims: [
          ...state.verbatims,
          ...action.verbatims.map((verbatim) => ({
            ...verbatim,
            importId: action.item.id,
            configurationVersionId: configurationVersionId ?? verbatim.configurationVersionId,
          })),
        ],
        imports: [action.item, ...state.imports],
      };
    }

    case "IMPORT_FAILED":
      return { ...state, imports: [action.item, ...state.imports] };

    case "IMPORT_REMOVED":
      return {
        ...state,
        answers:
          action.item.status === "Completed"
            ? state.answers.filter(
                (answer) => !belongsToImport(answer, action.item, state.imports),
              )
            : state.answers,
        verbatims:
          action.item.status === "Completed"
            ? state.verbatims.filter(
                (verbatim) => !belongsToImport(verbatim, action.item, state.imports),
              )
            : state.verbatims,
        imports: state.imports.filter((item) => item.id !== action.item.id),
      };

    case "VERBATIM_UPDATED":
      return {
        ...state,
        verbatims: state.verbatims.map((verbatim) =>
          verbatim.id === action.id ? { ...verbatim, ...action.patch } : verbatim,
        ),
      };

    case "QUESTIONNAIRE_ACTIVATED": {
      // Questionnaire history is append-only. Activating a new version never
      // touches answers, verbatims or import bindings created by older versions.
      const next = structuredClone(action.questionnaire);
      return {
        ...state,
        questionnaireVersions: [
          ...state.questionnaireVersions.map((version) => ({
            ...version,
            active: false,
          })),
          { ...next, active: true },
        ],
      };
    }
  }
}
