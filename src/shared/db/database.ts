import { EMPTY_DATASET, type Dataset } from "../../domain/dataset.types";
import { createInitialQuestionnaire } from "../../domain/questionnaire.defaults";

const STORAGE_KEY = "cellspain-data";

const emptyDataset = (): Dataset => structuredClone(EMPTY_DATASET);

export const loadDataset = (): Dataset => {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") as Partial<Dataset> | null;
    const dataset = { ...emptyDataset(), ...(stored ?? {}) } as Dataset;
    dataset.answers = Array.isArray(dataset.answers) ? dataset.answers : [];
    dataset.verbatims = Array.isArray(dataset.verbatims) ? dataset.verbatims : [];
    dataset.imports = Array.isArray(dataset.imports) ? dataset.imports : [];
    dataset.questionnaireVersions = Array.isArray(dataset.questionnaireVersions)
      ? dataset.questionnaireVersions
      : [];

    if (!dataset.questionnaireVersions.length) {
      dataset.questionnaireVersions = [createInitialQuestionnaire()];
    }

    // Backfill only missing linkage metadata. Historical labels, categories,
    // scores and text are never recomputed from the current questionnaire.
    const fallbackVersionId = dataset.questionnaireVersions[0].id;
    dataset.imports = dataset.imports.map((item) => ({
      ...item,
      configurationVersionId: item.configurationVersionId ?? fallbackVersionId,
    }));
    const versionByImportId = new Map(
      dataset.imports.map((item) => [item.id, item.configurationVersionId]),
    );
    dataset.answers = dataset.answers.map((answer) => ({
      ...answer,
      configurationVersionId:
        answer.configurationVersionId ??
        (answer.importId ? versionByImportId.get(answer.importId) : undefined) ??
        fallbackVersionId,
    }));
    dataset.verbatims = dataset.verbatims.map((verbatim) => ({
      ...verbatim,
      configurationVersionId:
        verbatim.configurationVersionId ??
        (verbatim.importId ? versionByImportId.get(verbatim.importId) : undefined) ??
        fallbackVersionId,
    }));

    return dataset;
  } catch {
    return emptyDataset();
  }
};

export const saveDataset = (dataset: Dataset) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(dataset));
};
