import { useEffect, useReducer } from "react";
import { datasetReducer } from "../domain/dataset.reducer";
import type { ImportItem } from "../domain/dataset.types";
import type { QuestionnaireConfig } from "../domain/questionnaire.types";
import type { Answer, Verbatim } from "../domain/survey.types";
import { loadDataset, saveDataset } from "../shared/db/database";

export function useDataset() {
  const [data, dispatch] = useReducer(datasetReducer, undefined, loadDataset);

  useEffect(() => saveDataset(data), [data]);

  const completeImport = (
    item: ImportItem,
    answers: Answer[],
    verbatims: Verbatim[],
  ) => dispatch({ type: "IMPORT_COMPLETED", item, answers, verbatims });

  const failImport = (item: ImportItem) =>
    dispatch({ type: "IMPORT_FAILED", item });

  const removeImport = (item: ImportItem) =>
    dispatch({ type: "IMPORT_REMOVED", item });

  const updateVerbatim = (id: string, patch: Partial<Verbatim>) =>
    dispatch({ type: "VERBATIM_UPDATED", id, patch });

  const activateQuestionnaire = (questionnaire: QuestionnaireConfig) =>
    dispatch({ type: "QUESTIONNAIRE_ACTIVATED", questionnaire });

  return {
    data,
    completeImport,
    failImport,
    removeImport,
    updateVerbatim,
    activateQuestionnaire,
  };
}
